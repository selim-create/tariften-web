"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock3, LoaderCircle, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { lokmaDishName } from "@/lib/lokma-emoji";
import { parseTransferDate as parseDate, transferPlatform as platformOf, transferWhen as whenLabel } from "@/lib/video-transfer-display";
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
  const date = parseDate(item.created_at);
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
    <main className="min-h-[75vh] bg-[#fcfcfc] pb-20">
      <PageIntro crumb="Tarif Aktarımlarım" kicker="Tariften mutfak atölyesi" title="Tarif *aktarımlarım*"
        actions={(
          <Link href="/recipe/aktar" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark">
            <Plus className="h-4 w-4" aria-hidden /> Yeni tarif aktar
          </Link>
        )}>
        Bağlantıyı bir kez gönder, gerisini Tariften hazırlasın. Hazır olduğunda haber veririz.
      </PageIntro>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
        {!loading && !user && (
          <div className="rounded-3xl bg-white p-7 text-[15px] text-slate-600 ring-1 ring-black/5">
            Aktarımlarını görmek için <Link className="font-semibold text-brand underline underline-offset-4" href="/login">giriş yap</Link>.
          </div>
        )}
        {(loading || fetching) && user && (
          <div className="flex items-center gap-3 rounded-3xl bg-white p-8 text-sm text-slate-500 ring-1 ring-black/5">
            <LoaderCircle className="h-5 w-5 animate-spin text-brand" aria-hidden /> Tarif aktarımların getiriliyor…
          </div>
        )}
        {error && user && (
          <p role="alert" className="mb-5 flex items-center gap-2 rounded-2xl bg-[#fdf0ec] p-4 text-sm text-brand-dark ring-1 ring-[#f3cfc5]">
            <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden /> {error}
          </p>
        )}
        {!fetching && user && jobs.length === 0 && !error && (
          <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-black/5">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[28px] bg-[#f6efe8]"><LokmaIngredientIcon name="tabak" size="xl" /></span>
            <h2 className="mt-5 font-heading text-2xl font-bold text-slate-900">Henüz aktarılmış tarifin yok</h2>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-slate-500">Kaydettiğin bir yemek videosu var mı? Bağlantısını yapıştır, tarifini çıkaralım.</p>
            <Link href="/recipe/aktar" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800">
              İlk tarifini aktar <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
        {jobs.length > 0 && (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
            {jobs.map(item => {
              const state = itemState(item);
              const statusText = state.tone === "success" ? "text-emerald-700 bg-emerald-50"
                : state.tone === "error" ? "text-red-700 bg-red-50"
                : state.tone === "review" ? "text-amber-800 bg-amber-50"
                : "text-brand-dark bg-[#fdf1ea]";
              const platform = platformOf(item.source_url);
              const title = item.title || `${platform} videosu`;
              const when = whenLabel(item.created_at);
              return (
                <li key={item.id} id={`aktarim-${item.id}`}
                  className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6 ${highlight === item.id ? "bg-[#fdf6f1]" : ""}`}>
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#f6efe8]" aria-hidden>
                    {item.title ? <LokmaIngredientIcon name={lokmaDishName(item.title)} size="xl" className="scale-[0.8]" /> : <LokmaIngredientIcon name="tabak" size="xl" className="scale-[0.8]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusText}`}>
                        {state.tone === "success" ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          : state.tone === "progress" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          : state.tone === "error" ? <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                          : <Clock3 className="h-3.5 w-3.5" aria-hidden />}
                        {state.label}
                      </span>
                      <span className="text-xs text-gray-400">{platform}{when ? ` · ${when}` : ""}</span>
                    </div>
                    <h2 className="mt-2 line-clamp-2 font-heading text-lg font-bold leading-snug text-slate-900">{title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{state.hint}</p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    {item.status === "published" && item.recipe_slug ? (
                      <Link href={`/recipe/${encodeURIComponent(item.recipe_slug)}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-gray-200 transition hover:text-brand hover:ring-brand/40">
                        Tarifi görüntüle <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </Link>
                    ) : item.status === "needs_review" ? (
                      <Link href={`/recipe/aktar?job=${item.id}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark">
                        Tarifini kontrol et <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    ) : item.status === "failed" && item.retryable ? (
                      <button type="button" onClick={() => void retry(item)} disabled={retrying !== null}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-800 ring-1 ring-gray-200 transition hover:text-brand disabled:opacity-50">
                        {retrying === item.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                        Yeniden dene
                      </button>
                    ) : item.status === "failed" || item.status === "uncertain" ? (
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand">
                        Orijinal paylaşımı aç <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-gray-400">
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Durumu otomatik güncelleniyor
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
