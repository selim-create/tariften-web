"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, CheckCircle2, ChevronRight, Clapperboard, LoaderCircle, LockKeyhole, RefreshCw, TriangleAlert, Upload, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAccountQuotas, quotaReached, quotaReset, useAccountQuotas } from "@/lib/account-quotas-client";
import MediaRecipeLinks from "@/components/media-recipe/MediaRecipeLinks";
import { parseVideoJob } from "@/lib/video-recipe-import";
import {
  MediaRecipeError, VIDEO_NOTE_MAX, formatBytes, formatDuration, isKnownDuration, uploadOwnVideo,
  validateVideoDuration, validateVideoFile,
} from "@/lib/media-recipe-import";

type Phase = "pick" | "uploading" | "upload_failed" | "processing" | "failed" | "slow" | "off";
type Selected = { file: File; url: string; duration: number | null };

/** Reads the duration from the browser's own <video> metadata (no upload needed). */
function readDuration(url: string): Promise<number | null> {
  return new Promise(resolve => {
    const video = document.createElement("video");
    const done = (value: number | null) => {
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 8000);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}

const POLL_MS = 3000;
const POLL_LIMIT_MS = 10 * 60 * 1000;

export default function OwnVideoStudio() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = user?.token;
  const quotas = useAccountQuotas(token);

  const [phase, setPhase] = useState<Phase>("pick");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [reading, setReading] = useState(false);
  const [note, setNote] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobStatus, setJobStatus] = useState("");
  // One request_id per chosen file: retries after a dropped connection reuse
  // it, so Core never stores a second copy or uses a second daily quota.
  const requestIdRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const clearSelection = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setSelected(null);
    requestIdRef.current = "";
  }, []);

  const startOver = () => {
    abortRef.current?.abort();
    clearSelection();
    setPhase("pick");
    setProgress(0);
    setError("");
    setJobId(null);
    setJobStatus("");
  };

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    const invalid = validateVideoFile(file);
    if (invalid) { setError(invalid); return; }
    clearSelection();
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setReading(true);
    const duration = await readDuration(url);
    setReading(false);
    if (urlRef.current !== url) return;
    const tooLong = validateVideoDuration(duration);
    if (tooLong) {
      URL.revokeObjectURL(url);
      urlRef.current = null;
      setError(`${tooLong} Seçtiğin video ${formatDuration(duration ?? 0)}.`);
      return;
    }
    requestIdRef.current = crypto.randomUUID();
    setSelected({ file, url, duration });
    setPhase("pick");
  };

  const upload = async () => {
    if (!token || !selected || phase === "uploading") return;
    setError("");
    try {
      // Free pre-check, so 200 MB is never sent when today's AI quota is used up.
      const fresh = await fetchAccountQuotas(token);
      if (quotaReached(fresh, "recipe_ai_day")) {
        setError("Bugünkü yapay zekâ tarif hakkını kullandın. Yenilenme: " + quotaReset(fresh, "recipe_ai_day"));
        return;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kullanım hakların kontrol edilemedi. Birazdan yeniden dene.");
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("uploading");
    setProgress(0);
    try {
      const accepted = await uploadOwnVideo({
        token, file: selected.file, note, requestId: requestIdRef.current,
        onProgress: setProgress, signal: controller.signal,
      });
      setJobId(accepted.jobId);
      setJobStatus(accepted.status);
      if (accepted.status === "failed") {
        setError(accepted.message || "Video işlenemedi.");
        setPhase("failed");
      } else {
        setPhase("processing");
      }
    } catch (cause) {
      if (controller.signal.aborted) return;
      const failure = cause instanceof MediaRecipeError ? cause.failure : null;
      if (failure?.code === "video_upload_unavailable") { setPhase("off"); return; }
      setError(cause instanceof Error ? cause.message : "Video yüklenemedi.");
      // Network problems can be retried with the same request_id; a rejected file cannot.
      setPhase(failure && failure.status === 0 ? "upload_failed" : "pick");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      void quotas.reload();
    }
  };

  // Poll the existing, free status endpoint (same as social video transfers).
  useEffect(() => {
    if (phase !== "processing" || !jobId || !token) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();
    const check = async () => {
      if (!active) return;
      if (Date.now() - startedAt > POLL_LIMIT_MS) { setPhase("slow"); return; }
      if (document.visibilityState !== "hidden") {
        try {
          const response = await fetch(`/api/recipe-social/video/status/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
          });
          if (response.ok) {
            const job = parseVideoJob(await response.json());
            if (!active) return;
            setJobStatus(job.status);
            if (job.status === "needs_review") { router.push(`/recipe/aktar?job=${job.id}`); return; }
            if (job.status === "published" && job.recipe_slug) { router.push(`/recipe/${encodeURIComponent(job.recipe_slug)}`); return; }
            if (job.status === "failed" || job.status === "uncertain") {
              setError(job.message || "Videondan tarif çıkarılamadı.");
              setPhase("failed");
              return;
            }
          }
        } catch { /* A missed poll is retried; the job keeps running on the server. */ }
      }
      if (active) timer = setTimeout(() => { void check(); }, POLL_MS);
    };
    timer = setTimeout(() => { void check(); }, POLL_MS);
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [phase, jobId, token, router]);

  if (authLoading) return <main className="grid min-h-[70vh] place-items-center text-slate-500"><LoaderCircle className="h-7 w-7 animate-spin" aria-label="Hesap kontrol ediliyor" /></main>;
  if (!token) return (
    <main className="mx-auto grid min-h-[75vh] max-w-3xl place-items-center px-4 py-16">
      <section className="w-full rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
        <LockKeyhole className="mx-auto mb-5 h-12 w-12 text-[#db4c3f]" aria-hidden />
        <h1 className="text-3xl font-black text-slate-900">Kendi videondan tarif</h1>
        <p className="mx-auto my-5 max-w-lg text-slate-600">Video yüklemek için Tariften hesabına giriş yap veya Standart Üye olarak kayıt ol.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-xl bg-[#db4c3f] px-7 py-3.5 font-bold text-white">Giriş Yap</Link>
          <Link href="/register" className="rounded-xl border border-slate-200 px-7 py-3.5 font-bold text-slate-800">Standart Üye Ol</Link>
        </div>
      </section>
    </main>
  );

  const aiQuota = quotas.data?.quotas.recipe_ai_day;
  const aiBlocked = quotaReached(quotas.data, "recipe_ai_day");
  const percent = Math.round(progress * 100);

  return <main className="min-h-[calc(100dvh-4rem)] bg-[#fffbf7] text-slate-800">
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-2">
      <header className="px-1 pb-2 pt-3 sm:pt-6">
        <nav aria-label="Sayfa konumu" className="mb-6 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
          <Link href="/recipe/aktar" className="transition hover:text-brand">Tarif Aktar</Link>
          <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
          <span className="font-medium text-slate-700">Kendi videondan tarif</span>
        </nav>
        <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
          Tariften · Kendi videon <span className="rounded-full bg-[#fdf1ea] px-2 py-0.5 text-[10px] tracking-[0.14em] ring-1 ring-[#f3d7ca]">Beta</span>
        </p>
        <h1 className="font-heading text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 text-balance sm:text-[48px]">
          Çektiğin video, <span className="italic text-brand">yazılı tarif olsun.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-500">Mutfakta telefonla çektiğin yemek videosunu yükle. Tariften malzemeleri ve adımları çıkarır; yayımlamadan önce sen kontrol edersin.</p>
      </header>

      <section className="mt-6 rounded-3xl bg-white p-4 ring-1 ring-black/5 sm:p-7" aria-live="polite">
        {phase === "off" ? (
          <div className="rounded-2xl border border-[#f1e2d6] bg-[#fffaf5] p-6 text-center">
            <span className="inline-flex rounded-full bg-[#fdf1ea] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand ring-1 ring-[#f3d7ca]">Yakında</span>
            <p className="mt-3 text-sm leading-6 text-slate-600">Kendi videondan tarif çok yakında burada. Şimdilik bir video bağlantısından <Link href="/recipe/aktar" className="font-semibold text-brand underline">tarif aktarabilirsin</Link>.</p>
          </div>
        ) : phase === "processing" || phase === "slow" ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-[#f6efe8]">
              {phase === "slow" ? <Clapperboard className="h-7 w-7 text-brand" aria-hidden /> : <LoaderCircle className="h-7 w-7 animate-spin text-brand" aria-hidden />}
            </span>
            <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">
              {phase === "slow" ? "Videon beklenenden uzun sürüyor" : jobStatus === "processing" ? "Videon inceleniyor…" : "Videon sıraya alındı"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {phase === "slow" ? "Hazır olduğunda Tarif Aktarımlarım'da görünecek ve sana haber vereceğiz. Aynı videoyu yeniden yüklemene gerek yok."
                : "Görüntü, ses ve notun birlikte inceleniyor; genellikle 1–2 dakika sürer. Bu sayfadan ayrılabilirsin, tarifin hazır olunca haber vereceğiz."}
            </p>
            <Link href={jobId ? `/recipe/aktarimlarim?job=${jobId}` : "/recipe/aktarimlarim"}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-gray-200 transition hover:text-brand hover:ring-brand/40">
              Tarif Aktarımlarım <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : phase === "failed" ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[24px] bg-red-50 text-red-600"><TriangleAlert className="h-7 w-7" aria-hidden /></span>
            <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">Videondan tarif çıkaramadık</h2>
            <p role="alert" className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{error || "Bir sorun oluştu."}</p>
            <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">Video dosyan güvenlik için silindi; yeniden denemek için videoyu tekrar seçmelisin.</p>
            <button type="button" onClick={startOver}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#db4c3f] px-5 text-sm font-semibold text-white transition hover:bg-brand-dark">
              <Upload className="h-4 w-4" aria-hidden /> Yeni video yükle
            </button>
          </div>
        ) : (
          <>
            <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="sr-only" aria-label="Video seç"
              disabled={phase === "uploading" || reading}
              onChange={e => { void choose(e.target.files?.[0]); e.target.value = ""; }} />

            {!selected ? (
              <button type="button" onClick={() => inputRef.current?.click()} disabled={reading}
                className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#ecdccf] bg-[#fffdfa] px-4 text-center transition hover:border-[#db4c3f]/50 hover:bg-[#fff7f2]">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#db4c3f] ring-1 ring-black/5">
                  {reading ? <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden /> : <Clapperboard className="h-6 w-6" aria-hidden />}
                </span>
                <span className="text-sm font-bold text-slate-800">{reading ? "Video kontrol ediliyor…" : "Video seç"}</span>
                <span className="max-w-xs text-xs leading-5 text-slate-500">MP4 veya MOV · En fazla 3 dakika · En fazla 200 MB. Video yalnızca tarif çıkarmak için kullanılır, ardından silinir.</span>
              </button>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <video src={selected.url} muted playsInline controls preload="metadata"
                  className="aspect-[9/16] max-h-64 w-full rounded-2xl bg-slate-900 object-contain sm:w-40" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">Videon hazır</p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    {formatBytes(selected.file.size)}{isKnownDuration(selected.duration) ? ` · ${formatDuration(selected.duration)}` : ""}
                  </p>
                  {!isKnownDuration(selected.duration) && (
                    <p className="mt-2 text-[11px] leading-5 text-amber-800">Tarayıcın videonun süresini okuyamadı. 3 dakikadan uzunsa yükleme kabul edilmez.</p>
                  )}
                  {phase !== "uploading" && (
                    <button type="button" onClick={() => { clearSelection(); setError(""); setPhase("pick"); }}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand">
                      <X className="h-3.5 w-3.5" aria-hidden /> Başka video seç
                    </button>
                  )}
                </div>
              </div>
            )}

            <label htmlFor="own-video-note" className="mb-1.5 mt-5 block text-[13px] font-semibold text-slate-700">Not · İsteğe bağlı</label>
            <textarea id="own-video-note" rows={2} value={note} maxLength={VIDEO_NOTE_MAX} disabled={phase === "uploading"}
              onChange={e => setNote(e.target.value)} placeholder="Örn. 4 kişilik, annemin tarifi, ölçüleri videoda söylüyorum"
              className="w-full resize-none rounded-2xl border border-[#efe5dc] bg-[#fffdfa] p-3.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10" />

            {phase === "uploading" && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>{percent < 100 ? "Video yükleniyor…" : "Sunucu videoyu kontrol ediyor…"}</span>
                  <span className="tabular-nums">%{percent}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Yükleme ilerlemesi"
                  aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                  <div className="h-full rounded-full bg-[#db4c3f] transition-[width] duration-300" style={{ width: `${percent}%` }} />
                </div>
                <button type="button" onClick={() => { abortRef.current?.abort(); setPhase("upload_failed"); setError("Yükleme iptal edildi."); }}
                  className="mt-3 text-xs font-semibold text-slate-500 hover:text-red-600">İptal et</button>
              </div>
            )}

            {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-800"><TriangleAlert className="mr-2 inline-block h-4 w-4" aria-hidden />{error}</div>}

            {phase !== "uploading" && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => void upload()}
                  disabled={!selected || reading || quotas.loading || !!quotas.error || !quotas.data || aiBlocked}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#db4c3f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300">
                  {phase === "upload_failed" ? <><RefreshCw className="h-4 w-4" aria-hidden /> Yüklemeyi yeniden dene</> : <><Upload className="h-4 w-4" aria-hidden /> Videoyu yükle</>}
                </button>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  {aiBlocked ? `Bugünkü yapay zekâ hakkın doldu. Yenilenme: ${quotaReset(quotas.data, "recipe_ai_day")}`
                    : `Günlük AI tarif hakkından 1 kullanır${aiQuota && aiQuota.remaining !== null ? ` · Bugün ${aiQuota.remaining} hakkın kaldı` : ""}. Yarıda kalan yükleme tekrar edilirse ikinci kez düşmez.`}
                </p>
              </div>
            )}
          </>
        )}

        <ol className="mt-6 grid gap-2 text-left sm:grid-cols-3">
          {["Videonu yükle", "Tariften tarifini çıkarır", "Kontrol et, yayımla"].map((label, i) => (
            <li key={label} className="flex items-center gap-2 rounded-2xl bg-[#fcfaf8] px-3 py-3 ring-1 ring-black/5">
              {phase === "processing" && i === 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                : <span className="font-heading text-sm font-bold text-brand tabular-nums">{String(i + 1).padStart(2, "0")}</span>}
              <span className="text-[13px] font-semibold text-slate-700">{label}</span>
            </li>
          ))}
        </ol>
        <MediaRecipeLinks current="video" />
      </section>
    </div>
  </main>;
}
