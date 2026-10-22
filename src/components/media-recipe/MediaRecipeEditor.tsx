"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowUp, Check, CheckCircle2, ChefHat, ChevronDown, Globe2, Info, LoaderCircle,
  LockKeyhole, Plus, RotateCcw, Sparkles, Trash2, TriangleAlert,
} from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { getTerms } from "@/lib/api";
import { PUBLIC_ALLERGEN_LABELS } from "@/lib/recipe-allergens";
import {
  DEFAULT_VISIBILITY, buildPhotoSavePayload, pendingConfirmations, photoEditorFromPreview, photoSaveValidation,
  type PhotoConfirmations, type PhotoEditor, type PhotoPreview, type RecipeVisibility,
} from "@/lib/media-recipe-import";

const FIELD = "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10";
const UNCERTAIN = "border-amber-300 bg-amber-50/70 ring-1 ring-amber-200";

/** Only the warnings a cook can act on; every code stays a plain Turkish sentence. */
const WARNING_COPY: Readonly<Record<string, string>> = {
  nutrition_unverified: "Kalori ve süreler fotoğraftan tahmin edildi; doğrulanmış değer değildir.",
  quality_review_needed: "Tarifte eksik kalan yerler olabilir. Malzemeleri ve adımları bir kez kontrol et.",
  items_truncated: "Çok uzun bir liste kısaltıldı. Eksik malzeme ya da adım varsa ekle.",
  title_missing: "Tarifin adı okunamadı. Bir isim ver.",
  transcription_review: "Sayfadan yazıya aktarıldı. Defterdeki hâliyle karşılaştır.",
  ingredients_missing: "Sayfada malzeme bulunamadı. Malzemeleri kendin ekle.",
  steps_missing: "Sayfada yapılış bulunamadı. Adımları kendin ekle.",
  ingredient_quantity_missing: "Bazı malzemelerin miktarı yazmıyor; tuz gibi “göz kararı” olabilir.",
};

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-semibold text-slate-600">{children}</label>;
}

function confidenceCopy(level: string, confidence: number): string {
  if (level === "high" || confidence >= 0.75) return "Yüksek";
  if (level === "medium" || confidence >= 0.45) return "Orta";
  return "Düşük";
}

export type MediaRecipeEditorProps = {
  preview: PhotoPreview;
  /** Object URL of the dish photo, only for the "Fotoğrafı kapak yap" option. */
  coverUrl?: string;
  saving: boolean;
  /** A reason saving is blocked outside the form (for example the daily recipe quota). */
  blockedReason?: string;
  error?: string;
  onSave: (payload: ReturnType<typeof buildPhotoSavePayload>) => void;
  onReset: () => void;
};

/**
 * Review-before-save screen for photo and notebook previews. Same editorial
 * language as the text import: the member checks everything, uncertain parts
 * are highlighted and nothing is saved until "Tarifi kaydet".
 */
export default function MediaRecipeEditor({ preview, coverUrl, saving, blockedReason, error, onSave, onReset }: MediaRecipeEditorProps) {
  const dish = preview.mode === "dish";
  const [editor, setEditor] = useState<PhotoEditor>(() => photoEditorFromPreview(preview));
  const [confirmed, setConfirmed] = useState<PhotoConfirmations>({ dish: false, allergens: false });
  const [visibility, setVisibility] = useState<RecipeVisibility>(preview.defaultVisibility || DEFAULT_VISIBILITY);
  const [useCover, setUseCover] = useState(preview.coverAvailable);
  const [terms, setTerms] = useState<{ cuisine: string[]; meal_type: string[] }>({ cuisine: [], meal_type: [] });
  useEffect(() => {
    void getTerms().then(data => {
      if (data) setTerms({ cuisine: data.cuisine || [], meal_type: data.meal_type || [] });
    }).catch(() => {});
  }, []);

  const update = (change: (old: PhotoEditor) => PhotoEditor) => setEditor(old => change(old));
  const setIngredient = (index: number, key: "name" | "amount" | "unit", value: string) =>
    update(old => ({ ...old, ingredients: old.ingredients.map((row, i) => i === index ? { ...row, [key]: value, uncertain: false } : row) }));
  const setStep = (index: number, content: string) =>
    update(old => ({ ...old, steps: old.steps.map((row, i) => i === index ? { ...row, content, uncertain: false } : row) }));
  const markIngredient = (index: number) =>
    update(old => ({ ...old, ingredients: old.ingredients.map((row, i) => i === index ? { ...row, uncertain: false } : row) }));
  const markStep = (index: number) =>
    update(old => ({ ...old, steps: old.steps.map((row, i) => i === index ? { ...row, uncertain: false } : row) }));
  const moveStep = (index: number, to: number) => update(old => {
    if (to < 0 || to >= old.steps.length) return old;
    const steps = [...old.steps];
    const [item] = steps.splice(index, 1);
    steps.splice(to, 0, item);
    return { ...old, steps };
  });

  const pending = pendingConfirmations(preview, editor, confirmed);
  const invalid = photoSaveValidation(editor);
  const warnings = preview.warnings.map(code => WARNING_COPY[code]).filter((v): v is string => !!v);
  const askDish = dish && preview.needsConfirmation.includes("dish") && !!preview.detected;
  const hasConflict = preview.needsConfirmation.includes("allergens") || preview.allergenConflicts.length > 0;
  const allergenNames = preview.allergens.contains.map(key => PUBLIC_ALLERGEN_LABELS[key] ?? key);
  const canSave = !saving && !blockedReason && pending.length === 0 && !invalid;

  const save = () => {
    if (!canSave) return;
    onSave(buildPhotoSavePayload(preview, editor, { visibility, useCover }));
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-5 w-5" aria-hidden /></div>
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Tarifin hazır</h2>
            <p className="text-xs text-[#93887a]">{dish ? "Fotoğraftan tahmin edildi · Kaydetmeden önce kontrol et" : "Defterden yazıya aktarıldı · Sayfayla karşılaştır"}</p>
          </div>
        </div>
        <button type="button" onClick={onReset} disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-[#db4c3f] hover:text-[#db4c3f] disabled:opacity-50">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Baştan başla
        </button>
      </div>

      {preview.aiEstimated && (
        <div className="mb-4 flex gap-3 rounded-2xl border border-[#f1d5c8] bg-[#fff4ee] p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#db4c3f]" aria-hidden />
          <div className="min-w-0 text-sm leading-6 text-[#6b4a3f]">
            <span className="mr-2 inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#c2463a] ring-1 ring-[#f1d5c8]">{preview.label || "AI Tahmini Tarif"}</span>
            Bu tarif fotoğraftaki yemeğe bakılarak tahmin edildi; tabaktaki yemeğin birebir tarifi değildir. Bu etiket tarif sayfasında da görünür.
          </div>
        </div>
      )}

      {dish && preview.detected && (
        <section aria-label="Tanınan yemek" className="mb-4 rounded-2xl border border-[#efe7de] bg-white p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-slate-600">Fotoğraftaki yemek: <strong className="font-heading text-base text-slate-900">{preview.detected.dish || "Belirlenemedi"}</strong></p>
            <span className="text-xs font-semibold text-slate-500">Tanıma güveni: {confidenceCopy(preview.detected.level, preview.detected.confidence)} · %{Math.round(preview.detected.confidence * 100)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="meter" aria-label="Tanıma güveni"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(preview.detected.confidence * 100)}>
            <div className={`h-full rounded-full ${preview.detected.confidence >= 0.75 ? "bg-emerald-500" : preview.detected.confidence >= 0.45 ? "bg-amber-400" : "bg-[#db4c3f]"}`}
              style={{ width: `${Math.max(4, Math.round(preview.detected.confidence * 100))}%` }} />
          </div>
          {askDish && (
            <div className={`mt-4 rounded-xl p-3 ${confirmed.dish ? "bg-emerald-50" : "bg-amber-50"}`}>
              <p className="text-sm font-semibold text-slate-800">
                {confirmed.dish ? <><Check className="mr-1 inline h-4 w-4 text-emerald-700" aria-hidden />Yemeği onayladın.</> : `Bu yemek “${preview.detected.dish}” mi?`}
              </p>
              {!confirmed.dish && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setConfirmed(c => ({ ...c, dish: true }))}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-900 px-3.5 text-xs font-semibold text-white hover:bg-slate-800">
                    <Check className="h-3.5 w-3.5" aria-hidden /> Evet, doğru
                  </button>
                  {preview.detected.alternatives.map(name => (
                    <button key={name} type="button"
                      onClick={() => { setConfirmed(c => ({ ...c, dish: true })); update(old => ({ ...old, title: name })); }}
                      className="inline-flex min-h-9 items-center rounded-full bg-white px-3.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:text-brand hover:ring-brand/40">
                      Hayır, {name}
                    </button>
                  ))}
                </div>
              )}
              {!confirmed.dish && <p className="mt-2 text-[11px] leading-5 text-amber-900">Başka bir yemekse adını aşağıda düzeltip “Evet, doğru”ya bas; malzemeleri de ona göre kontrol et.</p>}
            </div>
          )}
          {preview.assumptions.length > 0 && (
            <div className="mt-4">
              <p className="text-[12px] font-semibold text-slate-600">Tahmin edilenler</p>
              <ul className="mt-1 space-y-1 pl-5 text-xs leading-6 text-slate-600">
                {preview.assumptions.map(item => <li key={item} className="list-disc">{item}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {!dish && (preview.illegible.length > 0 || preview.uncertain.length > 0) && (
        <section aria-label="Okuma notları" className="mb-4 rounded-2xl border border-amber-200 bg-[#fff9ee] p-4 text-xs leading-6 text-amber-900">
          <p className="flex items-center gap-2 text-sm font-bold"><TriangleAlert className="h-4 w-4" aria-hidden /> Sayfayla bir kez karşılaştır</p>
          {preview.uncertain.length > 0 && <p className="mt-1">Emin olamadığımız yerler sarıyla işaretli. Düzelt ya da doğruysa “Doğru”ya bas.</p>}
          {preview.illegible.length > 0 && (
            <>
              <p className="mt-2 font-semibold">Okunamayan kısımlar</p>
              <ul className="pl-5">{preview.illegible.map(item => <li key={item} className="list-disc">{item}</li>)}</ul>
            </>
          )}
        </section>
      )}

      {(preview.allergenWarning || hasConflict) && (
        <section aria-label="Alerjen uyarısı" className={`mb-4 rounded-2xl border p-4 text-sm leading-6 ${hasConflict ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="flex items-start gap-2 font-semibold"><TriangleAlert className="mt-1 h-4 w-4 shrink-0" aria-hidden />
            {preview.allergenWarning || "Bu tarif alerji listendeki malzemeleri içeriyor. Malzemeyi değiştirmeyi düşünebilirsin."}</p>
          {hasConflict && (
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium">
              <input type="checkbox" checked={confirmed.allergens} onChange={e => setConfirmed(c => ({ ...c, allergens: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#db4c3f]" />
              <span>Uyarıyı okudum; malzemeleri kendim kontrol edeceğim.</span>
            </label>
          )}
        </section>
      )}

      {warnings.length > 0 && (
        <ul className="mb-5 space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
          {warnings.map(w => <li key={w} className="flex gap-2"><Info className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden />{w}</li>)}
        </ul>
      )}

      <div className="space-y-5">
        <div>
          <Label htmlFor="media-recipe-title">Tarifinin adı</Label>
          <input id="media-recipe-title" value={editor.title} maxLength={180}
            onChange={e => update(old => ({ ...old, title: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-lg font-black outline-none focus:border-[#db4c3f]" />
        </div>
        <div>
          <Label htmlFor="media-recipe-excerpt">Kısa açıklama · İsteğe bağlı</Label>
          <textarea id="media-recipe-excerpt" rows={2} value={editor.excerpt} maxLength={450}
            onChange={e => update(old => ({ ...old, excerpt: e.target.value }))}
            placeholder={dish ? "" : "Örn. Bayramlarda yapılırdı."}
            className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
          {!dish && preview.sourceNotes && !editor.excerpt.includes(preview.sourceNotes) && (
            <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
              Sayfadaki not: “{preview.sourceNotes}”{" "}
              <button type="button" className="font-semibold text-[#c84b3d] hover:underline"
                onClick={() => update(old => ({ ...old, excerpt: [old.excerpt.trim(), preview.sourceNotes].filter(Boolean).join(" ").slice(0, 450) }))}>
                Açıklamaya ekle
              </button>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#f0dfca] bg-[#fffaf2] p-4 sm:grid-cols-4">
          {([
            ["servings", "Kaç kişilik?", "Örn. 4", 36],
            ["prepTime", "Hazırlık · dk", "—", 720],
            ["cookTime", "Pişirme · dk", "—", 720],
            ["calories", "kcal · kişi başı", "—", 3000],
          ] as const).map(([key, label, placeholder, max]) => (
            <div key={key}>
              <Label htmlFor={`media-recipe-${key}`}>{label}</Label>
              <input id={`media-recipe-${key}`} type="number" inputMode="numeric" min={1} max={max} step={1}
                value={editor[key]} placeholder={placeholder}
                onChange={e => update(old => ({ ...old, [key]: e.target.value }))}
                className="h-11 w-full rounded-xl border border-[#ddc8b7] bg-white px-3 text-sm font-semibold outline-none focus:border-[#db4c3f]" />
            </div>
          ))}
          <p className="col-span-full text-[11px] leading-5 text-[#947c69]">
            {dish ? "Bu değerler tahmindir; kendi ölçülerine göre değiştirebilirsin." : "Sayfada yazmayan değerleri boş bırakabilirsin; uydurulmadı."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="media-recipe-cuisine">Mutfak</Label>
            <input id="media-recipe-cuisine" list="media-cuisine-options" value={editor.cuisine}
              onChange={e => update(old => ({ ...old, cuisine: e.target.value }))} placeholder="Örn. Türk Mutfağı" className={FIELD} />
            <datalist id="media-cuisine-options">{terms.cuisine.map(name => <option key={name} value={name} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="media-recipe-meal">Öğün tipi</Label>
            <input id="media-recipe-meal" list="media-meal-options" value={editor.mealType}
              onChange={e => update(old => ({ ...old, mealType: e.target.value }))} placeholder="Örn. Akşam Yemeği" className={FIELD} />
            <datalist id="media-meal-options">{terms.meal_type.map(name => <option key={name} value={name} />)}</datalist>
          </div>
        </div>

        <section className="border-t border-slate-100 pt-6" aria-label="Malzemeler">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900"><LokmaIngredientIcon name="domates" size="sm" /> Malzemeler <span className="text-sm font-normal text-slate-400">{editor.ingredients.length}</span></h3>
            <button type="button" disabled={editor.ingredients.length >= 40}
              onClick={() => update(old => ({ ...old, ingredients: [...old.ingredients, { name: "", amount: "", unit: "", uncertain: false, note: "", original_text: "", page: null }] }))}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden /> Ekle</button>
          </div>
          <div className="space-y-2">
            {editor.ingredients.map((row, i) => (
              <div key={i} className={`rounded-2xl border p-3 ${row.uncertain ? UNCERTAIN : "border-[#efe7de] bg-white"}`}>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_auto]">
                  <input aria-label={`${i + 1}. malzeme adı`} value={row.name} placeholder="Malzeme" onChange={e => setIngredient(i, "name", e.target.value)} className={FIELD} />
                  <button type="button" aria-label={`${i + 1}. malzemeyi sil`}
                    onClick={() => update(old => ({ ...old, ingredients: old.ingredients.filter((_, index) => index !== i) }))}
                    className="rounded-lg p-3 text-slate-400 hover:bg-red-50 hover:text-red-600 sm:order-last"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-2 sm:contents">
                    <input aria-label={`${i + 1}. malzeme miktarı`} value={row.amount} placeholder="Miktar" onChange={e => setIngredient(i, "amount", e.target.value)} className={FIELD} />
                    <input aria-label={`${i + 1}. malzeme birimi`} value={row.unit} placeholder="Birim" onChange={e => setIngredient(i, "unit", e.target.value)} className={FIELD} />
                  </div>
                </div>
                {(row.uncertain || row.original_text) && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-5">
                    <span className={row.uncertain ? "text-amber-900" : "text-slate-500"}>
                      {row.uncertain && <strong className="mr-1">Emin olamadık.</strong>}
                      {row.note && <span className="mr-1">{row.note}</span>}
                      {row.original_text && <span>Sayfada{row.page ? ` (s. ${row.page})` : ""}: “{row.original_text}”</span>}
                    </span>
                    {row.uncertain && (
                      <button type="button" onClick={() => markIngredient(i)}
                        className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white px-3 font-semibold text-slate-800 ring-1 ring-amber-300 hover:ring-emerald-400">
                        <Check className="h-3.5 w-3.5" aria-hidden /> Doğru
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-6" aria-label="Yapılışı">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900"><ChefHat className="h-4 w-4 text-[#db4c3f]" aria-hidden /> Yapılışı <span className="text-sm font-normal text-slate-400">{editor.steps.length}</span></h3>
            <button type="button" disabled={editor.steps.length >= 40}
              onClick={() => update(old => ({ ...old, steps: [...old.steps, { content: "", uncertain: false, note: "" }] }))}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#db4c3f] disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden /> Ekle</button>
          </div>
          <div className="space-y-2">
            {editor.steps.map((row, i) => (
              <div key={i} className={`rounded-2xl border p-3 ${row.uncertain ? UNCERTAIN : "border-[#efe7de] bg-white"}`}>
                <div className="flex items-start gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fcebe7] text-xs font-black text-[#db4c3f]">{i + 1}</span>
                  <textarea aria-label={`${i + 1}. hazırlanış adımı`} rows={2} value={row.content} onChange={e => setStep(i, e.target.value)}
                    className="min-w-0 flex-1 resize-y rounded-xl border border-[#e8ded4] bg-white p-3 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
                  <div className="flex shrink-0 flex-col">
                    <button type="button" aria-label={`${i + 1}. adımı yukarı taşı`} disabled={i === 0} onClick={() => moveStep(i, i - 1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowUp className="h-4 w-4" aria-hidden /></button>
                    <button type="button" aria-label={`${i + 1}. adımı aşağı taşı`} disabled={i === editor.steps.length - 1} onClick={() => moveStep(i, i + 1)}
                      className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"><ArrowDown className="h-4 w-4" aria-hidden /></button>
                    <button type="button" aria-label={`${i + 1}. adımı sil`}
                      onClick={() => update(old => ({ ...old, steps: old.steps.filter((_, index) => index !== i) }))}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                </div>
                {row.uncertain && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pl-11 text-[11px] leading-5 text-amber-900">
                    <span><strong className="mr-1">Emin olamadık.</strong>{row.note}</span>
                    <button type="button" onClick={() => markStep(i)}
                      className="inline-flex min-h-8 items-center gap-1 rounded-full bg-white px-3 font-semibold text-slate-800 ring-1 ring-amber-300 hover:ring-emerald-400">
                      <Check className="h-3.5 w-3.5" aria-hidden /> Doğru
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {(dish || editor.chefTip) && (
          <div>
            <Label htmlFor="media-recipe-tip">Şef ipucu · İsteğe bağlı</Label>
            <textarea id="media-recipe-tip" rows={2} value={editor.chefTip} maxLength={650}
              onChange={e => update(old => ({ ...old, chefTip: e.target.value }))}
              className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm leading-6 outline-none focus:border-[#db4c3f]" />
          </div>
        )}

        <details className="group rounded-2xl border border-[#efe7de] bg-[#fffcf9]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Sparkles className="h-4 w-4 text-[#db4c3f]" aria-hidden /> Tarifini daha kolay bulsunlar <span className="text-[10px] font-medium text-slate-400">SEO · İsteğe bağlı</span></span>
            <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="space-y-3 border-t border-[#efe7de] px-4 pb-4 pt-3">
            <p className="text-xs leading-6 text-slate-500">Yalnızca herkese açık tariflerde işe yarar; gerçek tarifi değiştirmez.</p>
            <input aria-label="SEO başlığı" value={editor.seoTitle} placeholder="SEO başlığı" onChange={e => update(old => ({ ...old, seoTitle: e.target.value }))} className={FIELD} />
            <textarea aria-label="Meta açıklaması" rows={2} value={editor.seoDescription} placeholder="Meta açıklaması" onChange={e => update(old => ({ ...old, seoDescription: e.target.value }))}
              className="w-full resize-y rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#db4c3f]" />
            <input aria-label="Anahtar kelimeler" value={editor.seoKeywords} placeholder="Anahtar kelimeler · Virgülle ayır" onChange={e => update(old => ({ ...old, seoKeywords: e.target.value }))} className={FIELD} />
          </div>
        </details>

        {allergenNames.length > 0 && (
          <p className="text-[11px] leading-5 text-slate-500">Malzeme adlarına göre içerebileceği alerjenler: {allergenNames.join(", ")}. Etiket okumanın yerini tutmaz.</p>
        )}

        <section aria-label="Kaydet" className="space-y-4 rounded-2xl border border-slate-200 bg-[#f9faf9] p-4">
          <fieldset>
            <legend className="mb-2 text-sm font-extrabold text-slate-900">Kimler görsün?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["private", "Sadece ben", "Tariflerim'de durur; başka kimse göremez.", LockKeyhole],
                ["public", "Herkese açık", dish ? "Tariften'de yayımlanır; “AI Tahmini Tarif” etiketiyle görünür." : "Tariften'de yayımlanır; herkes görebilir.", Globe2],
              ] as const).map(([value, title, hint, Icon]) => (
                <label key={value} className={`flex cursor-pointer gap-3 rounded-xl border bg-white p-3.5 transition ${visibility === value ? "border-[#db4c3f] ring-2 ring-[#db4c3f]/10" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="media-recipe-visibility" value={value} checked={visibility === value}
                    onChange={() => setVisibility(value)} className="mt-1 h-4 w-4 shrink-0 accent-[#db4c3f]" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><Icon className="h-4 w-4 text-slate-500" aria-hidden /> {title}</span>
                    <span className="mt-0.5 block text-[11px] leading-5 text-slate-500">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Bu seçimi daha sonra tarif sayfasından değiştirebilirsin.</p>
          </fieldset>

          {dish && preview.coverAvailable && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <input type="checkbox" checked={useCover} onChange={e => setUseCover(e.target.checked)} className="h-4 w-4 shrink-0 accent-[#db4c3f]" />
              {coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
              )}
              <span className="min-w-0 text-xs leading-5 text-slate-700"><strong className="block text-sm text-slate-800">Fotoğrafı kapak yap</strong>Konum ve cihaz bilgileri silinmiş hâli kullanılır.</span>
            </label>
          )}

          {(pending.length > 0 || invalid) && (
            <ul className="space-y-1 text-xs font-semibold text-amber-800" aria-live="polite">
              {pending.map(item => <li key={item}>• {item}</li>)}
              {invalid && <li>• {invalid}</li>}
            </ul>
          )}
          {blockedReason && <p className="text-xs font-semibold text-amber-800">{blockedReason}</p>}
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-800">{error}</p>}

          <button type="button" onClick={save} disabled={!canSave}
            className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#db4c3f] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#c34236] disabled:cursor-not-allowed disabled:bg-slate-300">
            {saving ? <><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Kaydediliyor…</>
              : <><CheckCircle2 className="h-5 w-5" aria-hidden /> {visibility === "public" ? "Kaydet ve yayımla" : "Tarifi kaydet"}</>}
          </button>
          <p className="text-center text-[10px] text-slate-400">Kayıt günlük tarif hakkından 1 kullanır. <Link href="/profile" className="underline">Haklarım</Link></p>
        </section>
      </div>
    </div>
  );
}
