"use client";

import type { Dispatch, SetStateAction } from "react";
import type { QuickRecipeDraft } from "@/lib/quick-recipe-review";
import { validateQuickRecipe } from "@/lib/quick-recipe-review";

type Props = {
  draft: QuickRecipeDraft;
  setDraft: Dispatch<SetStateAction<QuickRecipeDraft | null>>;
  existingRecipeId: number | null;
  saving: boolean;
  uncertain: boolean;
  error: string;
  onPublish: () => void;
  onClose: () => void;
  onNew: () => void;
};

const inputClass = "w-full rounded-xl border border-[#ebded2] bg-[#fffdfa] px-3 py-2.5 text-sm text-[#25343a] outline-none transition focus:border-[#db4c3f]";
const labelClass = "mb-1.5 block text-xs font-extrabold text-[#76685e]";

export default function QuickRecipeReview({
  draft, setDraft, existingRecipeId, saving, uncertain, error, onPublish, onClose, onNew,
}: Props) {
  const patch = (fields: Partial<QuickRecipeDraft>) => setDraft(old => old ? { ...old, ...fields } : old);
  const problem = validateQuickRecipe(draft);
  return (
    <div className="fixed inset-0 z-[190] overflow-y-auto bg-[#1a2428]/75 p-3 backdrop-blur-sm sm:p-6"
      role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="quick-recipe-title"
        className="mx-auto my-3 w-full max-w-4xl overflow-hidden rounded-[28px] border border-[#f2e5d8] bg-[#fffaf6] shadow-2xl sm:my-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0e4d8] bg-white p-5 sm:p-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#bd5345]">TARİFTEN · AI ŞEF</p>
            <h2 id="quick-recipe-title" className="mt-2 font-heading text-2xl font-extrabold text-[#21343b] sm:text-3xl">
              Tarifin hazır. Son dokunuş sende.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7f7369]">İsmini, ölçülerini ve adımlarını düzenleyebilirsin. Henüz yayımlanmadı.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Tarif önizlemesini kapat"
            className="rounded-full border border-[#eaded2] px-4 py-2 text-xs font-bold text-[#715d55] hover:bg-[#fff2ed] disabled:opacity-50">
            Kapat
          </button>
        </header>
        <div className="max-h-[65vh] space-y-7 overflow-y-auto p-5 sm:max-h-[70vh] sm:p-8">
          {existingRecipeId ? <p className="rounded-2xl border border-[#e7d7bc] bg-[#fff5df] p-4 text-sm text-[#77572a]">
            Benzer isimli bir tarif zaten var. <a className="font-bold underline" href={`/recipe/${existingRecipeId}`} target="_blank" rel="noreferrer">Mevcut tarife bak</a>; istersen kendi tarifini ayrıca yayımlayabilirsin.
          </p> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={labelClass}>Tarifin adı *</span>
              <input className={inputClass} value={draft.title} maxLength={180} onChange={e => patch({ title: e.target.value })} />
            </label>
            <label className="sm:col-span-2"><span className={labelClass}>Editoryal spot</span>
              <textarea className={inputClass} rows={3} value={draft.excerpt} onChange={e => patch({ excerpt: e.target.value })} />
            </label>
            <label><span className={labelClass}>Kaç kişilik? *</span>
              <input className={inputClass} aria-label="Kaç kişilik" type="number" min={1} max={36} value={draft.servings}
                onChange={e => patch({ servings: e.target.value })} />
            </label>
            <label><span className={labelClass}>Kişi başına yaklaşık kalori · AI tahmini</span>
              <input className={inputClass} aria-label="Kişi başına yaklaşık kalori" type="number" min={1} max={3000}
                value={draft.calories} onChange={e => patch({ calories: e.target.value })} placeholder="Bilinmiyor" />
            </label>
            <label><span className={labelClass}>Mutfak</span>
              <input className={inputClass} value={draft.cuisine.join(", ")} onChange={e => patch({ cuisine: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} />
            </label>
            <label><span className={labelClass}>Öğün türü</span>
              <input className={inputClass} value={draft.meal_type.join(", ")} onChange={e => patch({ meal_type: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} />
            </label>
            <label><span className={labelClass}>Hazırlama · dakika</span>
              <input className={inputClass} type="number" min={0} max={720} value={draft.prep_time} onChange={e => patch({ prep_time: e.target.value })} />
            </label>
            <label><span className={labelClass}>Pişirme · dakika</span>
              <input className={inputClass} type="number" min={0} max={720} value={draft.cook_time} onChange={e => patch({ cook_time: e.target.value })} />
            </label>
          </div>
          <section aria-label="Tarif malzemeleri">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-heading text-xl font-extrabold text-[#25353a]">Malzemeler</h3>
              <button type="button" disabled={draft.ingredients.length >= 40} className="text-xs font-bold text-[#c24f40] disabled:opacity-40"
                onClick={() => patch({ ingredients: [...draft.ingredients, { name: "", amount: "", unit: "" }] })}>+ Malzeme ekle</button>
            </div>
            <div className="space-y-3">{draft.ingredients.map((row, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-2xl border border-[#eee2d7] bg-white p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
                <input className={inputClass + " col-span-2 sm:col-span-1"} aria-label={`${i + 1}. malzemenin adı`} placeholder="Malzeme"
                  value={row.name} onChange={e => patch({ ingredients: draft.ingredients.map((v, index) => index === i ? { ...v, name: e.target.value } : v) })} />
                <input className={inputClass} aria-label={`${i + 1}. malzemenin miktarı`} placeholder="Miktar" value={row.amount}
                  onChange={e => patch({ ingredients: draft.ingredients.map((v, index) => index === i ? { ...v, amount: e.target.value } : v) })} />
                <input className={inputClass} aria-label={`${i + 1}. malzemenin birimi`} placeholder="Birim" value={row.unit}
                  onChange={e => patch({ ingredients: draft.ingredients.map((v, index) => index === i ? { ...v, unit: e.target.value } : v) })} />
                <button type="button" aria-label={`${i + 1}. malzemeyi kaldır`} className="col-span-2 rounded-xl border border-[#f1d6cd] px-3 text-xs font-bold text-[#b94c40] sm:col-span-1"
                  onClick={() => patch({ ingredients: draft.ingredients.filter((_, index) => index !== i) })}>Sil</button>
              </div>
            ))}</div>
          </section>
          <section aria-label="Tarif hazırlanışı">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-heading text-xl font-extrabold text-[#25353a]">Hazırlanış</h3>
              <button type="button" disabled={draft.steps.length >= 40} className="text-xs font-bold text-[#c24f40] disabled:opacity-40"
                onClick={() => patch({ steps: [...draft.steps, ""] })}>+ Adım ekle</button>
            </div>
            <div className="space-y-3">{draft.steps.map((step, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-[#eee2d7] bg-white p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#db4c3f] text-xs font-black text-white">{i + 1}</span>
                <textarea className={inputClass + " min-w-0 flex-1"} rows={3} aria-label={`${i + 1}. hazırlanış adımı`}
                  value={step} onChange={e => patch({ steps: draft.steps.map((v, index) => index === i ? e.target.value : v) })} />
                <button type="button" aria-label={`${i + 1}. adımı kaldır`} onClick={() => patch({ steps: draft.steps.filter((_, index) => index !== i) })}
                  className="self-start rounded-xl px-2 py-2 text-xs font-bold text-[#b94c40]">Sil</button>
              </div>
            ))}</div>
          </section>
          <label><span className={labelClass}>Şefin ipucu</span>
            <textarea className={inputClass} rows={3} value={draft.chef_tip} onChange={e => patch({ chef_tip: e.target.value })} />
          </label>
          <p className="text-xs leading-5 text-[#887a6f]">Kalori bilgisi doğrulanmış beslenme analizi değildir. Değer bilinmiyorsa boş bırakabilirsin.</p>
        </div>
        <footer className="border-t border-[#f0e4d8] bg-white p-5 sm:p-6">
          {(error || problem) && <p role="alert" className="mb-3 rounded-xl bg-[#fff2ed] p-3 text-sm font-semibold text-[#b74135]">{error || problem}</p>}
          {uncertain && <p role="alert" className="mb-3 text-sm text-[#b74135]">Tarif kaydedilmiş olabilir. Yeniden göndermeden önce Profil &gt; Tariflerim bölümünü kontrol et.</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onNew} disabled={saving} className="text-xs font-bold text-[#806f64] underline disabled:opacity-50">Yeni tarif isteği yaz</button>
            <button type="button" onClick={onPublish} disabled={saving || uncertain || !!problem}
              className="min-h-12 rounded-2xl bg-[#db4c3f] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#db4c3f]/15 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? "Yayımlanıyor…" : "Kontrol ettim, yayımla"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
