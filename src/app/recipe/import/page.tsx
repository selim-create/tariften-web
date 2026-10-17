"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, CheckCircle2,
  ChefHat, ClipboardList, FileText, Info, LoaderCircle, LockKeyhole,
  PenLine, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2,
  TriangleAlert, WandSparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import QuotaPanel from "@/components/account/QuotaPanel";
import { useAccountQuotas, fetchAccountQuotas, quotaReached, quotaReset } from "@/lib/account-quotas-client";
import { createRecipe } from "@/lib/api";
import {
  buildApprovedRecipe, editorFromPreview, importWarningLabel, parseImportPreview,
  publishValidation, validateRecipeSource,
} from "@/lib/recipe-text-import";
import type {
  GroundedImportPreview, ImportEditor, EditableIngredient, EditableStep,
} from "@/lib/recipe-text-import";

const EXAMPLE = `Anneannemin fasulye yemeği

2 su bardağı kuru fasulye, 1 adet soğan, 2 yemek kaşığı zeytinyağı, 1 tatlı kaşığı domates salçası, tuz.

Fasulyeleri bir gece önceden suda beklet.
Soğanı ince doğra ve zeytinyağında kavur.
Salçayı ekle, ardından fasulyeleri tencereye al.
Üzerini geçecek kadar su ekle, yumuşayana kadar pişir.`;

function FormLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{children}</label>;
}
function Input({ label, value, onChange, placeholder, extraClass = "" }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; extraClass?: string;
}) {
  return <label className={`block min-w-0 ${extraClass}`}>
    <span className="mb-1.5 block text-[11px] font-semibold text-slate-500">{label}</span>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10" />
  </label>;
}
function Notice({ children, warning = false }: { children: React.ReactNode; warning?: boolean }) {
  return <div className={`flex gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6 ${warning ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
    {warning ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
    <div>{children}</div>
  </div>;
}

export default function RecipeTextImportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = user?.token;
  const quotas = useAccountQuotas(token);

  const [source, setSource] = useState("");
  const [preview, setPreview] = useState<GroundedImportPreview | null>(null);
  const [editor, setEditor] = useState<ImportEditor | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState<"preview" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [betaUnavailable, setBetaUnavailable] = useState(false);

  const updateSource = (text: string) => {
    setSource(text);
    setPreview(null);
    setEditor(null);
    setAccepted(false);
    setError("");
    setBetaUnavailable(false);
  };
  const updateEditor = (change: (old: ImportEditor) => ImportEditor) => {
    setEditor(old => old ? change(old) : null);
    setAccepted(false);
    setError("");
  };

  const requestPreview = async () => {
    if (!token || busy) return;
    const invalid = validateRecipeSource(source);
    if (invalid) { setError(invalid); return; }

    setBusy("preview");
    setError("");
    setBetaUnavailable(false);
    try {
      // A paid AI attempt consumes recipe_ai_day even when never published.
      // If quota service is unavailable, refuse to trigger a paid request.
      const fresh = await fetchAccountQuotas(token);
      if (quotaReached(fresh, "recipe_ai_day")) {
        setError("Bugünkü yapay zekâ hakkın doldu. Yenilenme: " + quotaReset(fresh, "recipe_ai_day"));
        return;
      }
      const response = await fetch("/api/recipe-import/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        cache: "no-store",
        body: JSON.stringify({ source_text: source }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const msg = payload && typeof payload === "object" && "message" in payload
          && typeof payload.message === "string" ? payload.message : "Önizleme hazırlanamadı.";
        if (response.status === 503 && (msg.includes("henüz") || msg.includes("açık değil"))) setBetaUnavailable(true);
        throw new Error(msg);
      }
      const checked = parseImportPreview(payload);
      setPreview(checked);
      setEditor(editorFromPreview(checked));
      setAccepted(false);
      void quotas.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Önizleme hazırlanamadı. Yeniden deneyebilirsin.");
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!token || !editor || !preview || !accepted || busy) return;
    const invalid = publishValidation(editor);
    if (invalid) { setError(invalid); return; }
    setBusy("publish");
    setError("");
    try {
      // WordPress /recipes/create writes a PUBLIC recipe and deducts recipe_day.
      const fresh = await fetchAccountQuotas(token);
      if (quotaReached(fresh, "recipe_day")) {
        setError("Bugünkü tarif yayımlama hakkın doldu. Yenilenme: " + quotaReset(fresh, "recipe_day"));
        return;
      }
      const result = await createRecipe(token, buildApprovedRecipe(editor));
      if (!result?.success || !(result.slug || result.id)) {
        throw new Error(result?.message || "Tarif yayımlanamadı.");
      }
      void quotas.reload();
      router.push(`/recipe/${result.slug || result.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tarif kaydedilemedi.");
    } finally {
      setBusy(null);
    }
  };

  const updateIngredient = (index: number, key: "name" | "amount" | "unit", value: string) => {
    updateEditor(old => ({
      ...old,
      ingredients: old.ingredients.map((item, i) =>
        i === index ? { ...item, [key]: value, userEdited: true, source_verified: false } : item),
    }));
  };
  const updateStep = (index: number, content: string) => {
    updateEditor(old => ({
      ...old,
      steps: old.steps.map((step, i) =>
        i === index ? { ...step, content, userEdited: true, source_verified: false } : step),
    }));
  };

  if (authLoading) return <main className="grid min-h-[70vh] place-items-center text-slate-500"><LoaderCircle className="h-7 w-7 animate-spin" aria-label="Hesap kontrol ediliyor" /></main>;
  if (!token) return (
    <main className="mx-auto grid min-h-[75vh] max-w-3xl place-items-center px-4 py-16">
      <section className="w-full rounded-[32px] border border-slate-100 bg-white p-10 text-center shadow-xl shadow-slate-900/5">
        <LockKeyhole className="mx-auto mb-5 h-12 w-12 text-[#db4c3f]" aria-hidden />
        <h1 className="text-3xl font-black text-slate-900">Tarifini Tariften’e Aktar</h1>
        <p className="mx-auto my-5 max-w-lg text-slate-600">Kendi tariflerini akıllı biçimde düzenlemek için Tariften hesabına giriş yap veya ücretsiz kayıt ol.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-xl bg-[#db4c3f] px-7 py-3.5 font-bold text-white">Giriş Yap</Link>
          <Link href="/register" className="rounded-xl border border-slate-200 px-7 py-3.5 font-bold text-slate-800">Ücretsiz Kayıt Ol</Link>
        </div>
      </section>
    </main>
  );

  const warnings = preview
    ? Array.from(new Set([...preview.warnings, ...preview.needs_confirmation])).map(importWarningLabel)
    : [];

  return <main className="min-h-screen bg-[#f7f7f5] pb-24 text-slate-800">
    <section className="relative overflow-hidden bg-[#101c24] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-64 h-[580px] w-[580px] rounded-full bg-[#db4c3f]/18 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-12 h-[380px] w-[380px] rounded-full bg-[#74ac84]/10 blur-[90px]" />
      <div className="relative mx-auto max-w-7xl px-5 pb-14 pt-8 md:px-9 md:pb-20 md:pt-10">
        <Link href="/recipe/create" className="inline-flex items-center gap-2 text-sm font-medium text-white/55 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Tarif oluşturma
        </Link>
        <div className="mt-12 grid items-end gap-9 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#db4c3f]/50 bg-[#db4c3f]/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ff9c90]">
              <Sparkles className="h-3.5 w-3.5" /> Akıllı Tarif Aktarımı <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-white/75">BETA</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] md:text-6xl">
              Ailenden kalan tarif,<br /><span className="text-[#ff9e90]">yeni bir hikâyeye.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#c0c9c9] md:text-lg">
              Dağınık notlarını yapıştır. Tariften malzemeleri ve adımları kaynak metne sadık kalarak ayırsın; son sözü yine sen söyle.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ["01", "Metni ekle", "Kendi tarifinin orijinali sende kalır."],
              ["02", "Karşılaştır", "Her malzemeyi ve adımı kontrol et."],
              ["03", "Onayla", "Hazır olduğunda sen yayımla."],
            ].map(([number, heading, detail]) =>
              <div key={number} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 backdrop-blur-sm">
                <span className="font-mono text-lg font-bold text-[#ff9e90]">{number}</span>
                <div><p className="text-sm font-extrabold">{heading}</p><p className="mt-1 text-xs leading-5 text-white/55">{detail}</p></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-7xl px-5 pt-10 md:px-9">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#db4c3f] text-white">1</span>
          Kaynak
          <span className="mx-1 text-slate-300">/</span>
          <span className={`flex h-8 w-8 items-center justify-center rounded-full ${preview ? "bg-[#db4c3f] text-white" : "bg-slate-200 text-slate-500"}`}>2</span>
          Önizleme
          <span className="mx-1 text-slate-300">/</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500">3</span>
          Onay
        </div>
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck className="h-4 w-4 text-[#42936c]" /> Kaynak odaklı aktarım · Otomatik yayın yok</span>
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fcebe7] text-[#db4c3f]"><FileText className="h-5 w-5" /></div>
              <div><h2 className="text-xl font-black">Orijinal tarifin</h2><p className="text-xs text-slate-500">Yalnızca yazı · URL, video ve fotoğraf henüz yok</p></div>
            </div>
          </div>

          <FormLabel htmlFor="source-recipe">Tarif metnini buraya yapıştır</FormLabel>
          <textarea id="source-recipe" value={source} onChange={e => updateSource(e.target.value)}
            disabled={busy !== null} maxLength={20000} spellCheck
            placeholder={"Örn. 2 yumurta, 1 bardak süt, biraz un. Önce yumurtaları çırp, sütü ekle…"}
            className="h-[360px] w-full resize-y rounded-2xl border border-slate-200 bg-[#fafaf9] p-5 text-[15px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#db4c3f] focus:ring-4 focus:ring-[#db4c3f]/10 disabled:opacity-60" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>Eksik bilgiler tahmin edilmez; düzenleyerek tamamlayabilirsin.</span>
            <span className="font-mono">{new TextEncoder().encode(source).length.toLocaleString("tr-TR")} / 20.000 bayt</span>
          </div>

          {!preview && <button type="button" disabled={busy !== null} onClick={() => updateSource(EXAMPLE)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#b44c41] hover:underline disabled:opacity-50">
            <ClipboardList className="h-4 w-4" /> Örnek bir tarif metni getir
          </button>}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Önizleme için AI kullanım hakkın</p>
            <QuotaPanel data={quotas.data} error={quotas.error} loading={quotas.loading} kinds={["recipe_ai_day"]} />
            <p className="mb-5 mt-3 text-xs leading-5 text-slate-500">
              Her önizleme isteği günlük bir AI hakkı kullanır. Aynı metni tekrar göndermek yeni bir kullanım sayılır. Metnin otomatik kaydedilmez.
            </p>
            <button type="button" onClick={() => void requestPreview()}
              disabled={busy !== null || quotas.loading || !!quotas.error || !quotas.data || quotaReached(quotas.data, "recipe_ai_day") || !!validateRecipeSource(source)}
              className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#db4c3f] px-5 py-4 text-sm font-extrabold text-white shadow-lg shadow-[#db4c3f]/15 transition hover:bg-[#c44236] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
              {busy === "preview" ? <><LoaderCircle className="h-5 w-5 animate-spin" /> Tarifin yapılandırılıyor…</> : <><WandSparkles className="h-5 w-5" /> {preview ? "Önizlemeyi yeniden oluştur" : "Tarifi yapılandır ve önizle"} <ArrowRight className="h-4 w-4" /></>}
            </button>
            {quotaReached(quotas.data, "recipe_ai_day") && <p className="mt-3 text-xs text-amber-700">Bugünkü AI aktarım hakkın doldu. Sonraki hak: {quotaReset(quotas.data, "recipe_ai_day")}</p>}
            <p className="mt-3 text-center text-xs text-slate-400">Bu işlem yalnızca senin tıklamanla başlar. AI görseli üretilmez.</p>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8" aria-live="polite">
          {!preview || !editor ? (
            <div className="flex min-h-[590px] flex-col items-center justify-center px-3 text-center">
              <div className="mb-7 grid h-24 w-24 place-items-center rounded-[30px] bg-[#f8ede9] text-[#db4c3f]">
                {busy === "preview" ? <LoaderCircle className="h-11 w-11 animate-spin" /> : <BookOpen className="h-11 w-11" strokeWidth={1.6} />}
              </div>
              <span className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-[#db4c3f]">Kaynak doğrulamalı önizleme</span>
              <h2 className="max-w-sm text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                {busy === "preview" ? "Tarifin ayrıştırılıyor" : "Tarifinin düzenli hâli burada belirecek"}
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">
                {busy === "preview" ? "Malzemeler, adımlar ve kanıt parçaları karşılaştırılıyor. Bu işlem biraz sürebilir." :
                  "Sol taraftan metnini ekle. Eksik veya doğrulanamayan bölümleri belirteceğiz; hiçbir malzemeyi kendiliğimizden eklemeyeceğiz."}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {["Malzemeler", "Hazırlanış", "SEO önerileri"].map(x =>
                  <span key={x} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">{x}</span>)}
              </div>
              {betaUnavailable && <div className="mt-7 max-w-sm"><Notice warning>Akıllı Tarif Aktarımı şu anda sunucuda kapalı. Ekran hazır; beta açıldığında kullanıma sunulacak. Kendi tarifini <Link className="font-bold underline" href="/recipe/create">elle oluşturabilirsin.</Link></Notice></div>}
            </div>
          ) : (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCheck className="h-5 w-5" /></div>
                  <div><h2 className="text-xl font-black">Tarifini kontrol et</h2><p className="text-xs text-slate-500">Kaynak metin solda · Düzenlenebilir sonuç sağda</p></div>
                </div>
                <button type="button" onClick={() => updateSource(source)} disabled={!!busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-[#db4c3f] hover:text-[#db4c3f]">
                  <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
                </button>
              </div>

              {warnings.length > 0 && (
                <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-amber-900"><TriangleAlert className="h-4 w-4" /> Kontrol edilmesi gereken alanlar</div>
                  <ul className="space-y-1.5 pl-5 text-xs leading-6 text-amber-900">
                    {Array.from(new Set(warnings)).map(w => <li key={w} className="list-disc">{w}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <FormLabel>Tarif başlığı · Editoryal öneri</FormLabel>
                  <input aria-label="Tarif başlığı" value={editor.title}
                    onChange={e => updateEditor(old => ({ ...old, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-lg font-black outline-none focus:border-[#db4c3f]" />
                </div>
                <div>
                  <FormLabel>Spot · Editoryal öneri</FormLabel>
                  <textarea aria-label="Tarif spotu" rows={2} value={editor.excerpt}
                    onChange={e => updateEditor(old => ({ ...old, excerpt: e.target.value }))}
                    className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-black"><ChefHat className="h-5 w-5 text-[#db4c3f]" /> Malzemeler <span className="text-sm font-normal text-slate-400">{editor.ingredients.length}</span></h3>
                    <button type="button" aria-label="Malzeme ekle" disabled={editor.ingredients.length >= 40}
                      onClick={() => updateEditor(old => ({ ...old, ingredients: [...old.ingredients, { name: "", amount: "", unit: "", original_span: "", source_verified: false, userEdited: true }] }))}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50"><Plus className="h-4 w-4" /> Ekle</button>
                  </div>
                  <div className="space-y-4">
                    {editor.ingredients.map((ingredient, i) =>
                      <div key={i} className="rounded-2xl border border-slate-200 bg-[#fcfcfb] p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${ingredient.userEdited ? "text-amber-700" : "text-emerald-700"}`}>
                            {ingredient.userEdited ? <PenLine className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                            {ingredient.userEdited ? "Sen düzenledin" : "Kaynakta bulundu"}
                          </span>
                          <button type="button" aria-label={`${i + 1}. malzemeyi sil`} onClick={() => updateEditor(old => ({ ...old, ingredients: old.ingredients.filter((_, index) => index !== i) }))}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
                          <Input label="Malzeme" value={ingredient.name} onChange={v => updateIngredient(i, "name", v)} placeholder="Malzeme adı" />
                          <Input label="Miktar" value={ingredient.amount} onChange={v => updateIngredient(i, "amount", v)} placeholder="Belirtilmemiş" />
                          <Input label="Birim" value={ingredient.unit} onChange={v => updateIngredient(i, "unit", v)} placeholder="Belirtilmemiş" />
                        </div>
                        {ingredient.original_span && <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">Kaynakta: “{ingredient.original_span}”</p>}
                      </div>)}
                    {editor.ingredients.length === 0 && <Notice warning>Kaynakta doğrulanmış malzeme bulunamadı. Tarifi yayınlamak için malzemeleri kendin eklemelisin.</Notice>}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-black"><ClipboardList className="h-5 w-5 text-[#db4c3f]" /> Hazırlanış <span className="text-sm font-normal text-slate-400">{editor.steps.length}</span></h3>
                    <button type="button" aria-label="Adım ekle" disabled={editor.steps.length >= 40}
                      onClick={() => updateEditor(old => ({ ...old, steps: [...old.steps, { content: "", original_span: "", source_verified: false, userEdited: true }] }))}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50"><Plus className="h-4 w-4" /> Ekle</button>
                  </div>
                  <div className="space-y-3">
                    {editor.steps.map((step, i) =>
                      <div key={i} className="flex gap-3 rounded-2xl border border-slate-200 bg-[#fcfcfb] p-4">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fcebe7] text-xs font-black text-[#db4c3f]">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center justify-between">
                            <span className={`text-[11px] font-semibold ${step.userEdited ? "text-amber-700" : "text-emerald-700"}`}>
                              {step.userEdited ? "Sen düzenledin" : "Kaynağın orijinal adımı"}
                            </span>
                            <button type="button" aria-label={`${i + 1}. adımı sil`} onClick={() => updateEditor(old => ({ ...old, steps: old.steps.filter((_, index) => index !== i) }))}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <textarea aria-label={`${i + 1}. hazırlanış adımı`} rows={3} value={step.content} onChange={e => updateStep(i, e.target.value)}
                            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
                          {step.original_span && step.userEdited && <p className="mt-2 text-[11px] leading-5 text-slate-500">Kaynakta: “{step.original_span}”</p>}
                        </div>
                      </div>)}
                    {editor.steps.length === 0 && <Notice warning>Kaynakta doğrulanmış bir adım bulunamadı. Tarifin nasıl yapıldığını kendin eklemelisin.</Notice>}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#db4c3f]" /><h3 className="text-lg font-black">Arama motoru önerileri</h3></div>
                  <p className="mb-4 text-xs leading-6 text-slate-500">Bu alanlar kaynaktaki gerçekler değil, editoryal önerilerdir. İstersen değiştirebilirsin.</p>
                  <div className="space-y-3">
                    <Input label="SEO başlığı" value={editor.seoTitle} onChange={v => updateEditor(old => ({ ...old, seoTitle: v }))} />
                    <label className="block"><span className="mb-2 block text-[11px] font-semibold text-slate-500">Meta açıklaması</span>
                      <textarea rows={2} value={editor.seoDescription} onChange={e => updateEditor(old => ({ ...old, seoDescription: e.target.value }))}
                        className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#db4c3f]" />
                    </label>
                    <Input label="Anahtar kelimeler · Virgülle ayır" value={editor.seoKeywords} onChange={v => updateEditor(old => ({ ...old, seoKeywords: v }))} />
                  </div>
                </div>

                <div className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-[#f9faf9] p-5">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-700" /> Son kontrol ve yayımlama</div>
                  <p className="text-xs leading-6 text-slate-600">Kaynakla karşılaştır, özellikle eksik miktarları ve gıda güvenliğini kontrol et. “Onayla ve yayımla” tarifini herkese açık şekilde yayımlar. Otomatik görsel üretimi yapılmaz.</p>
                  <QuotaPanel data={quotas.data} error={quotas.error} loading={quotas.loading} kinds={["recipe_day"]} />
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#db4c3f]" />
                    <span className="text-xs font-medium leading-6 text-slate-700">Orijinal tarifle tüm malzeme ve adımları karşılaştırdım. Belirsiz alanları kontrol ettim ve tarifimin <strong>herkese açık yayımlanmasını</strong> onaylıyorum.</span>
                  </label>
                  <button type="button" onClick={() => void publish()}
                    disabled={!accepted || busy !== null || quotas.loading || !!quotas.error || !quotas.data || quotaReached(quotas.data, "recipe_day") || !!publishValidation(editor)}
                    className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#db4c3f] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#c34236] disabled:cursor-not-allowed disabled:bg-slate-300">
                    {busy === "publish" ? <><LoaderCircle className="h-5 w-5 animate-spin" /> Tarifin yayımlanıyor…</> : <><CheckCircle2 className="h-5 w-5" /> Onayla ve yayımla</>}
                  </button>
                  {publishValidation(editor) && <p className="text-xs font-semibold text-amber-700">{publishValidation(editor)}</p>}
                </div>
              </div>
            </div>
          )}

          {!!error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-800"><TriangleAlert className="mr-2 inline-block h-4 w-4" />{error}</div>}
        </section>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Tarif, sen onaylamadan yayımlanmaz.</span>
        <Link href="/recipe/create" className="inline-flex items-center gap-2 font-bold text-[#db4c3f] hover:underline">Klasik tarif oluşturucuya dön <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  </main>;
}
