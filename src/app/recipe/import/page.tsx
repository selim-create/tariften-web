"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, CheckCircle2,
  ChefHat, ChevronDown, ClipboardList, FileText, Info, LoaderCircle, LockKeyhole,
  PenLine, Plus, RotateCcw, ShieldCheck, Sparkles, Trash2,
  TriangleAlert, WandSparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAccountQuotas, fetchAccountQuotas, quotaReached, quotaReset } from "@/lib/account-quotas-client";
import { createRecipe } from "@/lib/api";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { capitalizeIngredientTr } from "@/lib/ingredient-display";
import {
  buildApprovedRecipe, editorFromPreview, importReviewNotes, parseImportPreview,
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
  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState<"preview" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [usageNotice, setUsageNotice] = useState("");
  const [betaUnavailable, setBetaUnavailable] = useState(false);
  const [routeMissing, setRouteMissing] = useState(false);
  const [activeIngredient, setActiveIngredient] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    if (!usageNotice) return;
    const timer = window.setTimeout(() => setUsageNotice(""), 4600);
    return () => window.clearTimeout(timer);
  }, [usageNotice]);

  const updateSource = (text: string) => {
    setSource(text);
    setPreview(null);
    setEditor(null);
    setAccepted(true);
    setError("");
    setBetaUnavailable(false);
    setRouteMissing(false);
    setActiveIngredient(null);
    setActiveStep(null);
  };
  const updateEditor = (change: (old: ImportEditor) => ImportEditor) => {
    setEditor(old => old ? change(old) : null);
    // Preserve the user's choice if they intentionally uncheck the preselected option.
    setError("");
  };

  const requestPreview = async () => {
    if (!token || busy) return;
    const invalid = validateRecipeSource(source);
    if (invalid) { setError(invalid); return; }

    setBusy("preview");
    setError("");
    setBetaUnavailable(false);
    setRouteMissing(false);
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
        const code = payload && typeof payload === "object" && "code" in payload
          && typeof payload.code === "string" ? payload.code : "";
        if (code === "recipe_import_route_missing" || code === "recipe_import_unavailable") {
          setBetaUnavailable(true);
          setRouteMissing(code === "recipe_import_route_missing");
        }
        if (response.status === 504 || code === "recipe_import_timeout" || /cURL error 28|operation timed out/i.test(msg)) {
          throw new Error("Tarifini düzenlemek bu kez beklediğimizden uzun sürdü. Notların burada duruyor; birazdan yeniden deneyebilirsin. Deneme hakkından kullanım düşmüş olabilir.");
        }
        throw new Error(msg);
      }
      const checked = parseImportPreview(payload);
      setPreview(checked);
      setEditor(editorFromPreview(checked));
      setUsageNotice("Tarif notların düzenlendi · 1 AI denemesi kullanıldı.");
      setActiveIngredient(null);
      setActiveStep(null);
      setAccepted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Önizleme hazırlanamadı. Yeniden deneyebilirsin.");
    } finally {
      // A failed paid AI attempt may still consume the daily quota.
      void quotas.reload();
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
        <p className="mx-auto my-5 max-w-lg text-slate-600">Kendi tariflerini akıllı biçimde düzenlemek için Tariften hesabına giriş yap veya Standart Üye olarak kayıt ol.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-xl bg-[#db4c3f] px-7 py-3.5 font-bold text-white">Giriş Yap</Link>
          <Link href="/register" className="rounded-xl border border-slate-200 px-7 py-3.5 font-bold text-slate-800">Standart Üye Ol</Link>
        </div>
      </section>
    </main>
  );

  const warnings = preview ? importReviewNotes(preview.warnings, preview.needs_confirmation) : [];

  return <main className="min-h-[calc(100dvh-4rem)] bg-[#fffbf7] text-slate-800">
    <div className="mx-auto max-w-[1460px] px-3 pb-12 pt-5 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#f0e6dc] bg-white px-4 py-4 text-slate-900 shadow-[0_8px_30px_rgba(98,65,43,0.035)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/recipe/create" aria-label="Tarif oluşturmaya dön"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff0ed] text-[#db4c3f] transition hover:bg-[#f8d8cb]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-[20px] font-extrabold tracking-tight sm:text-[23px]">Tarifin, en güzel hâline geliyor.</h1>
              <span className="rounded-full border border-[#f0d6ca] bg-[#fdf0e9] px-2 py-0.5 text-[9px] font-black tracking-wide text-[#ba6251]">BETA</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[#847a70]">Tarifini sen anlat, düzenlemesini Tariften’e bırak. Son söz her zaman senin.</p>
          </div>
        </div>
        <nav aria-label="Tarif aktarım adımları" className="hidden items-center gap-2 text-[11px] font-semibold text-[#9a8170] md:flex">
          <span className="rounded-full bg-[#fce9df] px-3 py-1.5 font-bold text-[#b24e40]">01 · Metin</span>
          <ArrowRight className="h-3 w-3 opacity-50" />
          <span className={`rounded-lg px-2.5 py-1.5 ${preview ? "bg-[#fce9df] text-[#b24e40]" : ""}`}>02 · Kontrol</span>
          <ArrowRight className="h-3 w-3 opacity-50" />
          <span>03 · Onay</span>
        </nav>
        <span className="hidden items-center gap-1.5 text-[11px] text-[#619577] xl:inline-flex">
          <ShieldCheck className="h-4 w-4" /> Onayın olmadan yayımlanmaz
        </span>
      </header>
      {usageNotice && (
        <div role="status" className="fixed bottom-6 right-6 z-[90] rounded-2xl border border-[#edd5c3] bg-[#fffaf3] px-4 py-3 text-xs font-semibold text-[#a7644c] shadow-lg">
          {usageNotice}
          <button className="ml-3 underline" type="button" onClick={() => setUsageNotice("")}>Kapat</button>
        </div>
      )}
      {/* Independent editorial panels; the source remains accessible while the recipe grows. */}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <section className="flex min-w-0 flex-col rounded-[24px] border border-[#f0e6dc] bg-white p-4 shadow-[0_8px_30px_rgba(98,65,43,0.035)] sm:p-5 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#ffede3] text-[#be5c49]"><span aria-hidden="true" className="text-2xl">📖</span></div>
              <div><h2 className="font-heading text-lg font-extrabold">Senin mutfak notların</h2><p className="text-xs text-[#93887a]">Anneanneden kalma, elinin alıştığı, sana özel…</p></div>
            </div>
          </div>

          <FormLabel htmlFor="source-recipe">Hadi, tarifini anlat 🍅</FormLabel>
          <textarea id="source-recipe" value={source} onChange={e => updateSource(e.target.value)}
            disabled={busy !== null} maxLength={20000} spellCheck
            placeholder={"Örn. 2 yumurta, 1 bardak süt, biraz un. Önce yumurtaları çırp, sütü ekle…"}
            className="h-[260px] min-h-[180px] w-full resize-y rounded-2xl border border-[#efe5dc] bg-[#fffdfa] p-4 text-[13px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10 disabled:opacity-60" />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
            <span>Tarifin sana ait; eksik kalan yerleri beraber kontrol ederiz.</span>
            <span className="font-mono">{new TextEncoder().encode(source).length.toLocaleString("tr-TR")} / 20.000 bayt</span>
          </div>

          {!preview && <button type="button" disabled={busy !== null} onClick={() => updateSource(EXAMPLE)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#b44c41] hover:underline disabled:opacity-50">
            <span aria-hidden="true">🥘</span> Bir örnek tarif dene
          </button>}

          <div className="mt-3 shrink-0 border-t border-slate-100 pt-3">
            <button type="button" onClick={() => void requestPreview()}
              disabled={busy !== null || quotas.loading || !!quotas.error || !quotas.data || !!validateRecipeSource(source)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#db4c3f] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#c44236] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
              {busy === "preview" ? <><LoaderCircle className="h-5 w-5 animate-spin" /> Tarifin düzenleniyor…</> : <><WandSparkles className="h-5 w-5" /> {preview ? "Önizlemeyi yeniden oluştur" : "Tarifimi güzelleştir"} <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="mt-2 text-center text-[10px] text-slate-400">Yalnızca istersen başlar. Görsel üretimi yapılmaz.</p>
          </div>
        </section>

        <section className="min-w-0 rounded-[24px] border border-[#f0e6dc] bg-white p-4 shadow-[0_8px_30px_rgba(98,65,43,0.035)] sm:p-6" aria-live="polite">
          {!!error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium leading-5 text-red-800"><TriangleAlert className="mr-2 inline-block h-4 w-4" />{error}</div>}
          {!preview || !editor ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-3 text-center lg:h-full">
              <div className="mb-3 grid h-16 w-16 place-items-center rounded-[22px] bg-[#fff2e8] text-[#db4c3f]">
                {busy === "preview" ? <LoaderCircle className="h-7 w-7 animate-spin" /> : <span aria-hidden="true" className="text-4xl">🍲</span>}
              </div>
              <span className="mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#db4c3f]">Tariften editör masası</span>
              <h2 className="max-w-sm text-lg font-black leading-tight text-slate-900 md:text-xl">
                {busy === "preview" ? "Tarifin deftere işleniyor…" : "Tarifinin düzenlenmiş hâli burada görünecek"}
              </h2>
              <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                {busy === "preview" ? "Malzemeler, adımlar ve kanıt parçaları karşılaştırılıyor. Bu işlem biraz sürebilir." :
                  "Tarif notlarını soldan ekle. Yazım düzeltmelerini, editoryal spotu ve profesyonel yapılış önerilerini senin onayına sunacağız."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {["Malzemeler", "Hazırlanış", "Editoryal spot"].map(x =>
                  <span key={x} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-500">{x}</span>)}
              </div>
              {betaUnavailable && <div className="mt-5 max-w-sm"><Notice warning>
                {routeMissing ? "Akıllı Tarif Aktarımı API yolu bu sunucuda bulunamadı. Core eklentisinin yeni sürümü henüz dağıtılmamış olabilir. Yönetici güncellemesi gerekiyor."
                  : "Akıllı Tarif Aktarımı özelliği sunucuda henüz etkinleştirilmedi."}
                {" "}İstersen tarifini <Link className="font-bold underline" href="/recipe/create">elle oluşturabilirsin.</Link>
              </Notice></div>}
            </div>
          ) : (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCheck className="h-5 w-5" /></div>
                  <div><h2 className="font-heading text-xl font-extrabold">Düzenlenmiş tarifin</h2><p className="text-xs text-[#93887a]">Orijinal metin solda, düzeltme önerileri sağda</p></div>
                </div>
                <button type="button" onClick={() => updateSource(source)} disabled={!!busy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-[#db4c3f] hover:text-[#db4c3f]">
                  <RotateCcw className="h-3.5 w-3.5" /> Sıfırla
                </button>
              </div>

              {warnings.length > 0 && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-[#fff9ee] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-amber-900"><TriangleAlert className="h-4 w-4" /> Tarifine son kez birlikte bakalım</div>
                  <ul className="space-y-1.5 pl-5 text-xs leading-6 text-amber-900">
                    {Array.from(new Set(warnings)).map(w => <li key={w} className="list-disc">{w}</li>)}
                  </ul>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <FormLabel>Tarifinin adı</FormLabel>
                  <input aria-label="Tarif başlığı" value={editor.title}
                    onChange={e => updateEditor(old => ({ ...old, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-lg font-black outline-none focus:border-[#db4c3f]" />
                </div>
                <div className="rounded-2xl border border-[#f0dfca] bg-[#fffaf2] p-4 sm:p-5">
                  <label htmlFor="recipe-import-servings" className="mb-2 block text-[12px] font-extrabold text-slate-800">Kaç kişilik? <span className="text-[#db4c3f]">*</span></label>
                  <div className="flex items-center gap-4">
                    <input id="recipe-import-servings" type="number" min={1} max={36} step={1}
                      value={editor.servings} onChange={e => updateEditor(old => ({ ...old, servings: e.target.value }))}
                      placeholder="Örn. 4" aria-required="true"
                      className="h-12 w-32 rounded-xl border border-[#ddc8b7] bg-white px-4 text-base font-bold text-slate-800 outline-none focus:border-[#db4c3f]" />
                    <span className="text-xs leading-5 text-[#7c6f62]">AI önerisini kontrol et veya kendin seç.</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#8d7563]">Yapay zekâ yaklaşık kişi sayısı önerebilir. Kesin bilgi değildir; kontrol edip değiştirebilirsin.</p>
                </div>
                <div className="grid gap-3 rounded-2xl border border-[#efdfd2] bg-white p-4 sm:grid-cols-3">
                  <Input label="Tahmini kalori · kcal/kişi" value={editor.calories}
                    onChange={v => updateEditor(old => ({ ...old, calories: v }))} placeholder="Belirlenemedi" />
                  <Input label="Mutfak · AI önerisi" value={editor.cuisine}
                    onChange={v => updateEditor(old => ({ ...old, cuisine: v }))} placeholder="Örn. Türk Mutfağı" />
                  <Input label="Öğün tipi · AI önerisi" value={editor.mealType}
                    onChange={v => updateEditor(old => ({ ...old, mealType: v }))} placeholder="Örn. Akşam Yemeği" />
                  <p className="col-span-full text-xs leading-5 text-[#8c8178]">
                    Kalori değeri kesin değildir; malzeme miktarları ve porsiyona göre değişebilir.
                    Dilersen tüm önerileri değiştirebilir veya kalori alanını boş bırakabilirsin.
                  </p>
                </div>
                <div>
                  <FormLabel>Editoryal spot · Kaynaktaki bilgilere dayalı öneri</FormLabel>
                  <textarea aria-label="Tarif spotu" rows={2} value={editor.excerpt}
                    onChange={e => updateEditor(old => ({ ...old, excerpt: e.target.value }))}
                    className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-heading text-lg font-black"><LokmaIngredientIcon name="domates" size="sm" /> Malzemeler <span className="text-sm font-normal text-slate-400">{editor.ingredients.length}</span></h3>
                    <Link href="/lokma/ikonlar" target="_blank" rel="noopener noreferrer" className="ml-auto mr-3 text-[11px] font-semibold text-[#a75b4b] underline decoration-[#dfc5b8] underline-offset-4 hover:text-[#db4c3f]">Tüm ikonları gör</Link>
                    <button type="button" aria-label="Malzeme ekle" disabled={editor.ingredients.length >= 40}
                      onClick={() => { setActiveIngredient(editor.ingredients.length); updateEditor(old => ({ ...old, ingredients: [...old.ingredients, { name: "", amount: "", unit: "", original_span: "", source_verified: false, userEdited: true }] })); }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50"><Plus className="h-4 w-4" /> Ekle</button>
                  </div>

                  <div className="space-y-2">
                    {editor.ingredients.map((ingredient, i) =>
                      <div key={i} className="overflow-hidden rounded-2xl border border-[#efe7de] bg-white transition hover:border-[#e5c8b9]">
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <LokmaIngredientIcon name={ingredient.name} size="sm" />
                          <button type="button" aria-expanded={activeIngredient === i}
                            onClick={() => setActiveIngredient(current => current === i ? null : i)}
                            className="flex min-h-9 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-[#db4c3f]">
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-bold text-slate-800">{capitalizeIngredientTr(ingredient.name) || "Yeni malzeme"}</span>
                              <span className={ingredient.userEdited ? "mt-0.5 block text-[10px] text-amber-700" : ingredient.name_corrected ? "mt-0.5 block text-[10px] text-[#b95c45]" : "mt-0.5 block text-[10px] text-emerald-700"}>
                                {ingredient.userEdited ? "Sen düzenledin" : ingredient.name_corrected ? "Yazımı düzeltildi · kontrol et" : "Kaynaktan alındı"}
                              </span>
                            </span>
                            <span className={!ingredient.amount ? "max-w-[38%] shrink-0 text-right text-xs font-semibold text-amber-700" : "max-w-[38%] shrink-0 text-right text-xs font-semibold text-[#6d665f]"}>
                              {[ingredient.amount, ingredient.unit].filter(Boolean).join(" ") || "Miktar belirtilmemiş"}
                            </span>
                            <ChevronDown className={activeIngredient === i ? "h-4 w-4 shrink-0 rotate-180 text-[#9d8c7f]" : "h-4 w-4 shrink-0 text-[#9d8c7f]"} />
                          </button>
                          <button type="button" aria-label={(i + 1) + ". malzemeyi sil"}
                            onClick={() => { updateEditor(old => ({ ...old, ingredients: old.ingredients.filter((_, index) => index !== i) })); setActiveIngredient(null); }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {activeIngredient === i && <div className="border-t border-[#f2ebe5] bg-[#fffcf9] px-3 pb-3 pt-3">
                          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]">
                            <Input label="Malzeme" value={ingredient.name} onChange={v => updateIngredient(i, "name", v)} placeholder="Malzeme adı" />
                            <Input label="Miktar" value={ingredient.amount} onChange={v => updateIngredient(i, "amount", v)} placeholder="Belirtilmemiş" />
                            <Input label="Birim" value={ingredient.unit} onChange={v => updateIngredient(i, "unit", v)} placeholder="Belirtilmemiş" />
                          </div>
                          {ingredient.original_span && <p className="mt-2 rounded-md bg-white px-3 py-2 text-[11px] leading-5 text-slate-500">Kaynak: “{ingredient.original_span}”{ingredient.name_corrected && <span className="ml-2 font-semibold text-[#c84c3f]">Yazım düzeltmesi önerildi.</span>}</p>}
                        </div>}
                      </div>)}
                    {editor.ingredients.length === 0 && <Notice warning>Kaynakta doğrulanmış malzeme bulunamadı. Tarifi yayınlamak için malzemeleri kendin eklemelisin.</Notice>}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-heading text-lg font-black"><ChefHat className="h-4 w-4 text-[#db4c3f]" /> Yapılışı <span className="text-sm font-normal text-slate-400">{editor.steps.length}</span></h3>
                    <button type="button" aria-label="Adım ekle" disabled={editor.steps.length >= 40}
                      onClick={() => { setActiveStep(editor.steps.length); updateEditor(old => ({ ...old, steps: [...old.steps, { content: "", original_span: "", source_verified: false, userEdited: true }] })); }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50"><Plus className="h-4 w-4" /> Ekle</button>
                  </div>

                  <div className="space-y-2">
                    {editor.steps.map((step, i) =>
                      <div key={i} className="overflow-hidden rounded-2xl border border-[#efe7de] bg-white transition hover:border-[#e5c8b9]">
                        <div className="flex items-start gap-3 p-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fcebe7] text-xs font-black text-[#db4c3f]">{i + 1}</span>
                          <button type="button" aria-expanded={activeStep === i}
                            onClick={() => setActiveStep(current => current === i ? null : i)}
                            className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-[#db4c3f]">
                            <span className={step.userEdited ? "text-[10px] font-semibold text-amber-700" : step.editorial_rewrite ? "text-[10px] font-semibold text-[#b95c45]" : "text-[10px] font-semibold text-emerald-700"}>
                              {step.userEdited ? "Sen düzenledin" : step.editorial_rewrite ? "Editoryal öneri · kontrol et" : "Orijinal adım"}
                            </span>
                            <p className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-slate-700">{step.content || "Yeni hazırlanış adımı"}</p>
                          </button>
                          <button type="button" aria-label={(i + 1) + ". adımı düzenle"}
                            onClick={() => setActiveStep(current => current === i ? null : i)}
                            aria-expanded={activeStep === i} className="rounded-lg p-2 text-[#938579] hover:bg-[#ffede8] hover:text-[#db4c3f]">
                            <ChevronDown className={activeStep === i ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
                          </button>
                          <button type="button" aria-label={(i + 1) + ". adımı sil"}
                            onClick={() => { updateEditor(old => ({ ...old, steps: old.steps.filter((_, index) => index !== i) })); setActiveStep(null); }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {activeStep === i && <div className="border-t border-[#f2ebe5] bg-[#fffcf9] px-3 pb-3 pt-3">
                          <textarea aria-label={(i + 1) + ". hazırlanış adımı"} rows={3} value={step.content} onChange={e => updateStep(i, e.target.value)}
                            className="w-full resize-y rounded-xl border border-[#e8ded4] bg-white p-3 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
                          {step.original_span && (step.userEdited || step.editorial_rewrite) && <p className="mt-2 text-[11px] leading-5 text-slate-500">Orijinal: “{step.original_span}”</p>}
                        </div>}
                      </div>)}
                    {editor.steps.length === 0 && <Notice warning>Kaynakta doğrulanmış bir adım bulunamadı. Tarifin nasıl yapıldığını kendin eklemelisin.</Notice>}
                  </div>
                </div>

                <details className="group rounded-2xl border border-[#efe7de] bg-[#fffcf9]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
                    <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Sparkles className="h-4 w-4 text-[#db4c3f]" /> Tarifini daha kolay bulsunlar <span className="text-[10px] font-medium text-slate-400">SEO · İsteğe bağlı</span></span>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 border-t border-[#efe7de] px-4 pb-4 pt-3">
                    <p className="text-xs leading-6 text-slate-500">Arama görünürlüğü için önerilen metinlerdir; gerçek tarifi değiştirmezler.</p>
                    <Input label="SEO başlığı" value={editor.seoTitle} onChange={v => updateEditor(old => ({ ...old, seoTitle: v }))} />
                    <label className="block"><span className="mb-2 block text-[11px] font-semibold text-slate-500">Meta açıklaması</span>
                      <textarea rows={2} value={editor.seoDescription} onChange={e => updateEditor(old => ({ ...old, seoDescription: e.target.value }))}
                        className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#db4c3f]" />
                    </label>
                    <Input label="Anahtar kelimeler · Virgülle ayır" value={editor.seoKeywords} onChange={v => updateEditor(old => ({ ...old, seoKeywords: v }))} />
                  </div>
                </details>

                <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-[#f9faf9] p-4">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ShieldCheck className="h-5 w-5 text-emerald-700" /> Son kontrol ve yayımlama</div>
                  <p className="text-xs leading-6 text-slate-600">Kaynakla karşılaştır, özellikle eksik miktarları ve gıda güvenliğini kontrol et. “Onayla ve yayımla” tarifini herkese açık şekilde yayımlar. Otomatik görsel üretimi yapılmaz.</p>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[#db4c3f]" />
                    <span className="text-xs font-medium leading-6 text-slate-700">Tarifimin <strong>herkese açık yayımlanacağını</strong> biliyorum. Malzeme miktarlarını, hazırlanış adımlarını ve belirsiz alanları yayından önce kontrol edebilirim. Yayımlamak için ayrıca “Onayla ve yayımla” düğmesine basmalıyım.</span>
                  </label>
                  <button type="button" onClick={() => void publish()}
                    disabled={!accepted || busy !== null || quotas.loading || !!quotas.error || !quotas.data || !!publishValidation(editor)}
                    className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#db4c3f] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#c34236] disabled:cursor-not-allowed disabled:bg-slate-300">
                    {busy === "publish" ? <><LoaderCircle className="h-5 w-5 animate-spin" /> Tarifin yayımlanıyor…</> : <><CheckCircle2 className="h-5 w-5" /> Onayla ve yayımla</>}
                  </button>
                  {publishValidation(editor) && <p className="text-xs font-semibold text-amber-700">{publishValidation(editor)}</p>}
                </div>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  </main>;
}
