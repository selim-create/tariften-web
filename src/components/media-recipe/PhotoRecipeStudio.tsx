"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown, ArrowRight, ArrowUp, Camera, ChevronRight, ImagePlus, LoaderCircle, LockKeyhole, NotebookPen,
  Sparkles, Trash2, TriangleAlert, X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchAccountQuotas, quotaReached, quotaReset, useAccountQuotas } from "@/lib/account-quotas-client";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import MediaRecipeEditor from "@/components/media-recipe/MediaRecipeEditor";
import MediaRecipeLinks from "@/components/media-recipe/MediaRecipeLinks";
import {
  MediaRecipeError, PHOTO_MAX_BYTES, PHOTO_MAX_FILES, PHOTO_NOTE_MAX, PHOTO_TARGET_EDGE,
  checkPhotoRecipeAvailable, isPhotoFeatureOff, movePage, removePage, requestPhotoPreview, savePhotoRecipe,
  validatePhotoFile, validatePhotoPick, type PhotoMode, type PhotoPreview,
} from "@/lib/media-recipe-import";

type Picked = { id: string; file: File; url: string };

const COPY = {
  dish: {
    crumb: "Fotoğraftan tarif",
    kicker: "Tariften · Fotoğraftan tarif",
    title: <>Gördüğün yemek, <span className="italic text-brand">senin mutfağında.</span></>,
    lead: "Restoranda yediğin ya da beğendiğin bir yemeğin fotoğrafını seç. Tariften evde yapabileceğin tahmini bir tarif hazırlar; kaydetmeden önce sen kontrol edersin.",
    panel: "Yemek fotoğrafı",
    panelHint: "Tabağın net göründüğü tek bir fotoğraf",
    notePlaceholder: "Örn. restoranda yedim, acılıydı",
    action: "Tarifi tahmin et",
    busy: "Fotoğraf inceleniyor…",
  },
  notebook: {
    crumb: "Defterden tarif",
    kicker: "Tariften · Defterden tarif",
    title: <>Defterdeki tarif, <span className="italic text-brand">kaybolmasın.</span></>,
    lead: "El yazısı ya da basılı tarif sayfalarının fotoğrafını çek. Tariften yazıyı olduğu gibi aktarır; emin olamadığı yerleri işaretler, sen düzeltirsin.",
    panel: "Defter sayfaları",
    panelHint: "1–4 sayfa, okunma sırasıyla",
    notePlaceholder: "Örn. Anneannemin kurabiyesi",
    action: "Sayfaları yazıya aktar",
    busy: "Sayfalar okunuyor…",
  },
} as const;

/**
 * Scales big phone photos down to ~2500 px JPEG before upload (Core advice):
 * faster on mobile data and keeps 4 pages under server limits. Formats the
 * browser cannot decode (HEIC on most browsers) are sent unchanged.
 */
async function prepareForUpload(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= PHOTO_TARGET_EDGE && file.size <= PHOTO_MAX_BYTES) { bitmap.close(); return file; }
    const scale = Math.min(1, PHOTO_TARGET_EDGE / longest);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.88));
    return blob ? new File([blob], "foto.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export default function PhotoRecipeStudio({ mode }: { mode: PhotoMode }) {
  const copy = COPY[mode];
  const dish = mode === "dish";
  const max = PHOTO_MAX_FILES[mode];
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = user?.token;
  const quotas = useAccountQuotas(token);

  const [pages, setPages] = useState<Picked[]>([]);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<PhotoPreview | null>(null);
  const [busy, setBusy] = useState<"preview" | "save" | null>(null);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [featureOff, setFeatureOff] = useState(false);
  const [usageNotice, setUsageNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pagesRef = useRef<Picked[]>([]);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  // Object URLs are revoked when the page closes.
  useEffect(() => () => pagesRef.current.forEach(p => URL.revokeObjectURL(p.url)), []);
  useEffect(() => {
    if (!usageNotice) return;
    const timer = setTimeout(() => setUsageNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [usageNotice]);
  // Free check (no quota, nothing written): a switched-off feature shows "Yakında" up front.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void checkPhotoRecipeAvailable(token, controller.signal).then(state => {
      if (state === "off") setFeatureOff(true);
    });
    return () => controller.abort();
  }, [token]);

  const addFiles = (list: FileList | null) => {
    if (!list || !list.length) return;
    setError("");
    const incoming = Array.from(list);
    for (const file of incoming) {
      const invalid = validatePhotoPick(file);
      if (invalid) { setError(invalid); return; }
    }
    const current = pagesRef.current;
    if (dish) current.forEach(p => URL.revokeObjectURL(p.url));
    const base = dish ? [] : current;
    const room = max - base.length;
    if (!dish && incoming.length > room) setError(`En fazla ${max} sayfa ekleyebilirsin; fazlası eklenmedi.`);
    const added = incoming.slice(0, Math.max(0, room)).map(file => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setPages([...base, ...added]);
    setPreview(null);
  };
  const dropPage = (index: number) => setPages(old => {
    const target = old[index];
    if (target) URL.revokeObjectURL(target.url);
    return removePage(old, index);
  });

  const reset = () => {
    setPreview(null);
    setError("");
    setSaveError("");
  };

  const requestPreview = async () => {
    if (!token || busy || !pages.length) return;
    setBusy("preview");
    setError("");
    setSaveError("");
    try {
      // A paid AI attempt uses recipe_ai_day even if never saved; check first.
      const fresh = await fetchAccountQuotas(token);
      if (quotaReached(fresh, "recipe_ai_day")) {
        setError("Bugünkü yapay zekâ hakkın doldu. Yenilenme: " + quotaReset(fresh, "recipe_ai_day"));
        return;
      }
      const files = await Promise.all(pages.map(p => prepareForUpload(p.file)));
      for (const file of files) {
        const invalid = validatePhotoFile(file);
        if (invalid) throw new Error(invalid);
      }
      const result = await requestPhotoPreview(token, mode, files, note);
      setPreview(result);
      setUsageNotice("Günlük AI tarif hakkından bir deneme kullanıldı.");
    } catch (cause) {
      if (cause instanceof MediaRecipeError && isPhotoFeatureOff(cause.failure)) setFeatureOff(true);
      setError(cause instanceof Error ? cause.message : "Bir şeyler ters gitti. Birazdan yeniden dene.");
    } finally {
      // A failed paid attempt may still count; refresh the remaining quota.
      void quotas.reload();
      setBusy(null);
    }
  };

  const save = async (payload: Parameters<typeof savePhotoRecipe>[1]) => {
    if (!token || busy) return;
    setBusy("save");
    setSaveError("");
    try {
      const saved = await savePhotoRecipe(token, payload);
      void quotas.reload();
      router.push(`/recipe/${encodeURIComponent(saved.slug || String(saved.id))}`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Tarif kaydedilemedi.";
      if (cause instanceof MediaRecipeError && cause.failure.code === "photo_recipe_preview_expired") {
        // The token is single-use and time-limited: back to the photo, which is still selected.
        setPreview(null);
        setError(message);
      } else {
        setSaveError(message);
      }
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) return <main className="grid min-h-[70vh] place-items-center text-slate-500"><LoaderCircle className="h-7 w-7 animate-spin" aria-label="Hesap kontrol ediliyor" /></main>;
  if (!token) return (
    <main className="mx-auto grid min-h-[75vh] max-w-3xl place-items-center px-4 py-16">
      <section className="w-full rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
        <LockKeyhole className="mx-auto mb-5 h-12 w-12 text-[#db4c3f]" aria-hidden />
        <h1 className="text-3xl font-black text-slate-900">{copy.crumb}</h1>
        <p className="mx-auto my-5 max-w-lg text-slate-600">Bu özelliği kullanmak için Tariften hesabına giriş yap veya Standart Üye olarak kayıt ol.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-xl bg-[#db4c3f] px-7 py-3.5 font-bold text-white">Giriş Yap</Link>
          <Link href="/register" className="rounded-xl border border-slate-200 px-7 py-3.5 font-bold text-slate-800">Standart Üye Ol</Link>
        </div>
      </section>
    </main>
  );

  const aiRemaining = quotas.data?.quotas.recipe_ai_day;
  const aiBlocked = quotaReached(quotas.data, "recipe_ai_day");
  const saveBlocked = quotaReached(quotas.data, "recipe_day")
    ? "Bugünkü tarif kaydetme hakkın doldu. Yenilenme: " + quotaReset(quotas.data, "recipe_day") : "";
  const coverUrl = dish ? pages[0]?.url : undefined;

  return <main className="min-h-[calc(100dvh-4rem)] bg-[#fffbf7] text-slate-800">
    {usageNotice && <div role="status" className="fixed bottom-5 right-5 z-[110] max-w-sm rounded-2xl bg-[#253b30] px-4 py-3 text-xs font-bold text-white shadow-xl">{usageNotice}</div>}
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-2">
      <header className="px-1 pb-2 pt-3 sm:pt-6">
        <nav aria-label="Sayfa konumu" className="mb-6 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
          <Link href="/recipe/aktar" className="transition hover:text-brand">Tarif Aktar</Link>
          <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
          <span className="font-medium text-slate-700">{copy.crumb}</span>
        </nav>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
              {copy.kicker} <span className="rounded-full bg-[#fdf1ea] px-2 py-0.5 text-[10px] tracking-[0.14em] ring-1 ring-[#f3d7ca]">Beta</span>
            </p>
            <h1 className="font-heading text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 text-balance sm:text-[48px]">{copy.title}</h1>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-500">{copy.lead}</p>
          </div>
          <nav aria-label="Adımlar" className="flex items-center gap-2 text-[12px] font-semibold text-gray-400">
            <span className={!preview ? "text-brand" : "text-slate-900"}>01 · {dish ? "Fotoğraf" : "Sayfalar"}</span>
            <span className="h-px w-6 bg-gray-300" aria-hidden />
            <span className={preview ? "text-brand" : ""}>02 · Kontrol</span>
            <span className="h-px w-6 bg-gray-300" aria-hidden />
            <span>03 · Kaydet</span>
          </nav>
        </div>
      </header>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <section className="flex min-w-0 flex-col rounded-3xl bg-white p-4 ring-1 ring-black/5 sm:p-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f6efe8] text-[#c84b3d]" aria-hidden>{dish ? <Camera className="h-5 w-5" /> : <NotebookPen className="h-5 w-5" />}</div>
            <div><h2 className="font-heading text-lg font-bold text-slate-900">{copy.panel}</h2><p className="text-xs text-slate-500">{copy.panelHint}</p></div>
          </div>

          {featureOff ? (
            <div className="rounded-2xl border border-[#f1e2d6] bg-[#fffaf5] p-5 text-center">
              <span className="inline-flex rounded-full bg-[#fdf1ea] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand ring-1 ring-[#f3d7ca]">Yakında</span>
              <p className="mt-3 text-sm leading-6 text-slate-600">{dish ? "Fotoğraftan tarif" : "Defterden tarif"} çok yakında burada. Şimdilik tarifini <Link href="/recipe/create" className="font-semibold text-brand underline">kendin yazabilir</Link> ya da <Link href="/recipe/import" className="font-semibold text-brand underline">metinden aktarabilirsin</Link>.</p>
            </div>
          ) : <>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple={!dish} className="sr-only"
              aria-label={dish ? "Yemek fotoğrafı seç" : "Defter sayfası ekle"}
              onChange={e => { addFiles(e.target.files); e.target.value = ""; }} disabled={!!busy} />

            {pages.length === 0 ? (
              <button type="button" onClick={() => inputRef.current?.click()} disabled={!!busy}
                className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#ecdccf] bg-[#fffdfa] px-4 text-center transition hover:border-[#db4c3f]/50 hover:bg-[#fff7f2]">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#db4c3f] ring-1 ring-black/5"><ImagePlus className="h-6 w-6" aria-hidden /></span>
                <span className="text-sm font-bold text-slate-800">{dish ? "Fotoğraf seç ya da çek" : "Sayfa fotoğraflarını seç"}</span>
                <span className="max-w-xs text-xs leading-5 text-slate-500">{dish ? "JPG, PNG, WebP veya HEIC · Konum gibi bilgiler sunucuda silinir, fotoğrafın saklanmaz." : "En fazla 4 sayfa · Sayfaları düz ve ışıklı çek. Fotoğraflar okunduktan sonra silinir."}</span>
              </button>
            ) : dish ? (
              <figure className="relative overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pages[0].url} alt="Seçtiğin yemek fotoğrafı" className="max-h-[340px] w-full object-cover" />
                <div className="absolute right-3 top-3 flex gap-2">
                  <button type="button" onClick={() => inputRef.current?.click()} disabled={!!busy}
                    className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-black/5 backdrop-blur hover:text-brand">Değiştir</button>
                  <button type="button" aria-label="Fotoğrafı kaldır" onClick={() => { dropPage(0); setPreview(null); }} disabled={!!busy}
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-600 ring-1 ring-black/5 backdrop-blur hover:text-red-600"><X className="h-4 w-4" aria-hidden /></button>
                </div>
              </figure>
            ) : (
              <div>
                <ol className="space-y-2" aria-label="Sayfa sırası">
                  {pages.map((page, i) => (
                    <li key={page.id} className="flex items-center gap-3 rounded-2xl bg-[#fcfaf8] p-2 ring-1 ring-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={page.url} alt="" className="h-16 w-14 shrink-0 rounded-lg object-cover" />
                      <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">Sayfa {i + 1}</span>
                      <button type="button" aria-label={`Sayfa ${i + 1}'i yukarı taşı`} disabled={i === 0 || !!busy}
                        onClick={() => { setPages(old => movePage(old, i, i - 1)); setPreview(null); }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden /></button>
                      <button type="button" aria-label={`Sayfa ${i + 1}'i aşağı taşı`} disabled={i === pages.length - 1 || !!busy}
                        onClick={() => { setPages(old => movePage(old, i, i + 1)); setPreview(null); }}
                        className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden /></button>
                      <button type="button" aria-label={`Sayfa ${i + 1}'i kaldır`} disabled={!!busy}
                        onClick={() => { dropPage(i); setPreview(null); }}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </li>
                  ))}
                </ol>
                {pages.length < max && (
                  <button type="button" onClick={() => inputRef.current?.click()} disabled={!!busy}
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50">
                    <ImagePlus className="h-4 w-4" aria-hidden /> Sayfa ekle ({pages.length}/{max})
                  </button>
                )}
              </div>
            )}

            <label htmlFor="media-recipe-note" className="mb-1.5 mt-5 block text-[13px] font-semibold text-slate-700">Not · İsteğe bağlı</label>
            <textarea id="media-recipe-note" rows={2} value={note} maxLength={PHOTO_NOTE_MAX} disabled={!!busy}
              onChange={e => setNote(e.target.value)} placeholder={copy.notePlaceholder}
              className="w-full resize-none rounded-2xl border border-[#efe5dc] bg-[#fffdfa] p-3.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10" />
            <p className="mt-1 text-right font-mono text-[10px] text-slate-400">{note.length} / {PHOTO_NOTE_MAX}</p>

            {error && <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-800"><TriangleAlert className="mr-2 inline-block h-4 w-4" aria-hidden />{error}</div>}

            <div className="mt-3 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => void requestPreview()}
                disabled={!!busy || !pages.length || quotas.loading || !!quotas.error || !quotas.data || aiBlocked}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#db4c3f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-slate-300">
                {busy === "preview" ? <><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> {copy.busy}</>
                  : <><Sparkles className="h-4 w-4" aria-hidden /> {preview ? "Yeniden dene" : copy.action} <ArrowRight className="h-4 w-4" aria-hidden /></>}
              </button>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                {aiBlocked ? `Bugünkü yapay zekâ hakkın doldu. Yenilenme: ${quotaReset(quotas.data, "recipe_ai_day")}`
                  : `Her deneme günlük AI tarif hakkından 1 kullanır${aiRemaining && aiRemaining.remaining !== null ? ` · Bugün ${aiRemaining.remaining} hakkın kaldı` : ""}.`}
              </p>
            </div>
          </>}

          <MediaRecipeLinks current={dish ? "dish" : "notebook"} />
        </section>

        <section className="min-w-0 rounded-3xl bg-white p-4 ring-1 ring-black/5 sm:p-7" aria-live="polite">
          {preview ? (
            <MediaRecipeEditor key={preview.previewToken} preview={preview} coverUrl={coverUrl}
              saving={busy === "save"} blockedReason={saveBlocked} error={saveError}
              onSave={payload => void save(payload)} onReset={reset} />
          ) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-3 py-6 text-center lg:min-h-[480px]">
              <div className="relative mb-6 h-28 w-40" aria-hidden>
                <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28px] bg-[#f6efe8]">
                  {busy === "preview" ? <LoaderCircle className="h-7 w-7 animate-spin text-brand" /> : <LokmaIngredientIcon name="tabak" size="xl" />}
                </span>
                <span className="lokma-float absolute left-0 top-2 grid h-11 w-11 place-items-center rounded-2xl bg-white ring-1 ring-black/5"><LokmaIngredientIcon name={dish ? "domates" : "un"} size="lg" /></span>
                <span className="lokma-float absolute bottom-0 right-1 grid h-11 w-11 place-items-center rounded-2xl bg-white ring-1 ring-black/5 [animation-delay:1.2s]"><LokmaIngredientIcon name={dish ? "biber" : "yumurta"} size="lg" /></span>
              </div>
              <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">Tariften editör masası</span>
              <h2 className="max-w-sm font-heading text-xl font-bold leading-tight text-slate-900 md:text-2xl">
                {busy === "preview" ? copy.busy : "Tarifin hazır olduğunda burada düzenleyebilirsin"}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                {busy === "preview" ? "Bu genellikle 10–60 saniye sürer. Sayfadan ayrılma." :
                  dish ? "Fotoğrafını seç ve “Tarifi tahmin et”e bas. Tahmini tarif burada açılır; kaydetmeden önce her şeyi değiştirebilirsin."
                    : "Sayfaları sırayla ekle ve “Sayfaları yazıya aktar”a bas. Emin olamadığımız yerleri sarıyla işaretleriz."}
              </p>
              {busy !== "preview" && (
                <ol className="mt-6 grid w-full max-w-md gap-2 text-left sm:grid-cols-3">
                  {(dish ? ["Fotoğrafı seç", "Tariften tahmin eder", "Kontrol et, kaydet"] : ["Sayfaları ekle", "Tariften yazıya döker", "Düzelt, kaydet"]).map((label, i) => (
                    <li key={label} className="rounded-2xl bg-[#fcfaf8] px-3 py-3 ring-1 ring-black/5">
                      <span className="block font-heading text-sm font-bold text-brand tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-slate-700">{label}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" aria-hidden /> Kaydettiğin tarif, sen yayımlamadıkça yalnızca sana görünür.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  </main>;
}
