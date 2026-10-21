"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, ChefHat, Clock3, LoaderCircle, Plus, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { needsRightsConfirmation } from "@/lib/video-recipe-import";

type Transfer = {
  id: number;
  status: string;
  title?: string;
  source_url: string;
  created_at: string;
  recipe_slug?: string;
  message?: string;
  retryable?: boolean;
  error_code?: string;
};

const ACTIVE = new Set(["queued", "pull_ready", "dispatching", "processing"]);

function delayed(item: Transfer): boolean {
  if (item.status !== "queued" && item.status !== "pull_ready" && item.status !== "processing") return false;
  const date = Date.parse(item.created_at.replace(" ", "T") + (item.created_at.includes("Z") ? "" : "Z"));
  return Number.isFinite(date) && Date.now() - date > 10 * 60 * 1000;
}

function itemState(item: Transfer) {
  if (item.status === "published" && item.recipe_slug)
    return { label: "Tarif yayımlandı", hint: "Tarifin hazır, artık Tariften'de.", tone: "success" };
  if (item.status === "needs_review")
    return { label: "Ek kontrol gerekiyor", hint: "Bazı bilgiler netleştirilmeli. Tarifin saklanıyor; ikinci analiz başlamadı.", tone: "review" };
  if (item.status === "failed")
    return { label: "Aktarım tamamlanamadı", hint: item.message || "Tarif çıkarılırken bir sorun oluştu.", tone: "error" };
  if (item.status === "uncertain")
    return { label: "Sonuç doğrulanamadı", hint: "Bu işlem otomatik tekrarlanmayacak. Destek ekibimiz kaydı inceleyebilir.", tone: "error" };
  if (item.status === "pending")
    return { label: "Yayımlama kontrol ediliyor", hint: "Aynı video için ikinci tarif oluşturulmayacak.", tone: "review" };
  if (delayed(item))
    return { label: "Aktarım beklenenden uzun sürüyor", hint: "İşleyici bu kaydı henüz tamamlamadı. Aynı bağlantıyı tekrar göndermene gerek yok.", tone: "review" };
  if (item.status === "processing")
    return { label: "Tarif hazırlanıyor", hint: "Video, ekrandaki yazılar, ses ve açıklama birlikte inceleniyor. Genellikle 15–40 saniye sürer.", tone: "progress" };
  return { label: "Sıraya alındı", hint: "Tarif aktarma isteğin kaydedildi. İşleyici devreye girdiğinde hazırlanacak.", tone: "progress" };
}

export default function MyRecipeTransfers() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<Transfer[]>([]);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(true);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [retrying, setRetrying] = useState<number | null>(null);

  const retry = async (item: Transfer) => {
    if (!user?.token || retrying) return;
    setRetrying(item.id);
    setError("");
    try {
      const response = await fetch("/api/recipe-social/video/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify(needsRightsConfirmation(item.source_url)
          ? { source_url: item.source_url, request_id: crypto.randomUUID(), rights_confirmed: true }
          : { source_url: item.source_url, request_id: crypto.randomUUID() }),
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
          ? payload.message : "Aktarım yeniden başlatılamadı.";
        throw new Error(message);
      }
      setHighlight(item.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Aktarım yeniden başlatılamadı.");
    } finally {
      setRetrying(null);
      setRefresh(n => n + 1);
    }
  };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("job");
    if (id && /^[1-9]\d{0,12}$/.test(id)) setHighlight(Number(id));
  }, []);

  useEffect(() => {
    if (!user?.token) {
      setFetching(false);
      setJobs([]);
      return;
    }
    const token = user.token;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Fast polling while something is in progress, slow otherwise.
    const schedule = (busy: boolean) => {
      if (timer) clearTimeout(timer);
      if (active) timer = setTimeout(() => { void load(); }, busy ? 3000 : 20000);
    };
    const load = async () => {
      if (document.visibilityState === "hidden") { schedule(false); return; }
      try {
        const result = await fetch("/api/recipe-social/video/history", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        if (!result.ok) throw new Error("Aktarımlar şu anda alınamıyor.");
        const value: unknown = await result.json();
        if (!value || typeof value !== "object" || !("jobs" in value) || !Array.isArray(value.jobs))
          throw new Error("Aktarım yanıtı doğrulanamadı.");
        const next = (value.jobs as unknown[]).filter((item): item is Transfer =>
          !!item && typeof item === "object" &&
          Number.isSafeInteger((item as Transfer).id) &&
          typeof (item as Transfer).status === "string" &&
          typeof (item as Transfer).source_url === "string" &&
          typeof (item as Transfer).created_at === "string"
        );
        if (active) { setJobs(next); setError(""); setFetching(false); }
        schedule(next.some(item => ACTIVE.has(item.status) && !delayed(item)));
      } catch (cause) {
        if (active) { setError(cause instanceof Error ? cause.message : "Bir sorun oluştu."); setFetching(false); }
        schedule(false);
      }
    };
    void load();
    document.addEventListener("visibilitychange", load);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", load);
      window.removeEventListener("focus", load);
    };
  }, [user?.token, refresh]);

  useEffect(() => {
    if (!highlight) return;
    const selected = jobs.find(item => item.id === highlight);
    if (selected?.status === "published" && selected.recipe_slug) {
      router.replace(`/recipe/${encodeURIComponent(selected.recipe_slug)}`);
    }
  }, [jobs, highlight, router]);

  return (
    <main className="min-h-[75vh] bg-[#fffbf8] pb-20">
      <div className="mx-auto max-w-[1100px] px-4 pt-9 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#d25745]">
              <Sparkles className="h-4 w-4" /> Tariften mutfak atölyesi
            </p>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#182c27] sm:text-4xl">Tarif Aktarımlarım</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#72766f]">Bağlantıyı bir kez gönder, gerisini Tariften hazırlasın. Tarifler burada takip edilir; hazır olduğunda haber veririz.</p>
          </div>
          <Link href="/recipe/aktar" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#df5042] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#c94336]">
            <Plus className="h-4 w-4" /> Yeni tarif aktar
          </Link>
        </div>
        {!loading && !user && (
          <div className="rounded-3xl border border-[#eedfd4] bg-white p-7 text-sm text-[#625c55]">
            Aktarımlarını görmek için <Link className="font-bold text-[#c34a3c] underline" href="/login">giriş yap</Link>.
          </div>
        )}
        {(loading || fetching) && user && (
          <div className="flex items-center gap-3 rounded-3xl border border-[#eedfd4] bg-white p-8 text-sm text-[#64716a]">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Tarif aktarımların getiriliyor…
          </div>
        )}
        {error && user && (
          <p role="alert" className="mb-5 flex items-center gap-2 rounded-2xl border border-[#f3d8d1] bg-[#fff1ed] p-4 text-sm text-[#9b4538]">
            <ShieldAlert className="h-5 w-5" /> {error}
          </p>
        )}
        {!fetching && user && jobs.length === 0 && !error && (
          <div className="rounded-3xl border border-[#eedfd4] bg-white p-10 text-center">
            <ChefHat className="mx-auto h-10 w-10 text-[#d25745]" />
            <h2 className="mt-4 font-heading text-xl font-bold text-[#182c27]">Henüz aktarılmış tarifin yok</h2>
            <p className="mt-2 text-sm text-[#72766f]">Sosyal medyadan ilk yemek bağlantını ekleyebilirsin.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {jobs.map(item => {
            const state = itemState(item);
            const statusText = state.tone === "success" ? "text-emerald-700 bg-emerald-50"
              : state.tone === "error" ? "text-red-700 bg-red-50"
              : state.tone === "review" ? "text-amber-800 bg-amber-50"
              : "text-[#a85841] bg-[#fff0e9]";
            const title = item.title || `Tarif aktarımı #${item.id}`;
            return (
              <article key={item.id} className={`rounded-[25px] border bg-white p-5 shadow-[0_12px_30px_rgba(55,37,24,0.035)] sm:p-6 ${highlight === item.id ? "border-[#e19b88]" : "border-[#ede0d7]"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold ${statusText}`}>
                    {state.tone === "success" ? <CheckCircle2 className="h-3.5 w-3.5" />
                      : state.tone === "progress" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      : state.tone === "error" ? <ShieldAlert className="h-3.5 w-3.5" />
                      : <Clock3 className="h-3.5 w-3.5" />}
                    {state.label}
                  </span>
                  <span className="text-xs font-semibold text-[#b2a49a]">#{item.id}</span>
                </div>
                <h2 className="mt-5 min-h-[48px] font-heading text-[18px] font-bold leading-snug text-[#1f302a]">{title}</h2>
                <p className="mt-2 text-xs leading-5 text-[#777069]">{state.hint}</p>
                <div className="mt-6 border-t border-[#f3ebe6] pt-4">
                  {item.status === "published" && item.recipe_slug ? (
                    <Link href={`/recipe/${encodeURIComponent(item.recipe_slug)}`}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-[#c84b3d] hover:underline">
                      Tarifi görüntüle <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : item.status === "needs_review" ? (
                    <Link href={`/recipe/aktar?job=${item.id}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#bd674b] hover:underline">
                      Tarifini kontrol et <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : item.status === "failed" && item.retryable ? (
                    <button type="button" onClick={() => void retry(item)} disabled={retrying !== null}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-[#c84b3d] hover:underline disabled:opacity-50">
                      {retrying === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Yeniden dene
                    </button>
                  ) : item.status === "failed" || item.status === "uncertain" ? (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[#9b8a7d] hover:underline">
                      Orijinal paylaşımı aç <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#9b8a7d]">
                      <RefreshCw className="h-3.5 w-3.5" /> Durumu otomatik güncelleniyor
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
