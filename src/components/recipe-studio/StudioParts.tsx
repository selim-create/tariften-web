"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, Circle, Clock3, Flame, ImageUp, Link2, Plus, Trash2, Users, Video, X,
} from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import RecipeCover from "@/components/recipe/RecipeCover";

/* Shared visual language of the manual recipe studio (create + edit).
 * Page-level logic (auth, quotas, upload, submit) stays in the pages. */

export const studioInput =
  "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";
export const studioLabel = "mb-1.5 block text-[13px] font-semibold text-slate-700";

export function StudioSection({ title, hint, children, aside }: {
  title: string; hint?: string; children: React.ReactNode; aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-black/5 sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold tracking-[-0.01em] text-slate-900">{title}</h2>
          {hint && <p className="mt-1 text-sm leading-relaxed text-slate-500">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Numeric field with its unit printed inside the box ("dk", "kişi", "kcal"). */
export function NumberField({ label, suffix, value, onChange, min, max, required, ariaLabel, hint }: {
  label: string; suffix: string; value: string; onChange: (value: string) => void;
  min: number; max: number; required?: boolean; ariaLabel?: string; hint?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={studioLabel}>{label}{required && <span className="text-brand"> *</span>}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="numeric" min={min} max={max} step={1} value={value}
          aria-label={ariaLabel} aria-required={required || undefined}
          onChange={event => onChange(event.target.value)}
          className={`${studioInput} pr-14 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`} />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">{suffix}</span>
      </div>
      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export type MediaMode = "upload" | "url" | "video";

/** Photo picker: upload, image link or YouTube link. The page owns the upload. */
export function MediaPicker({ mode, onModeChange, preview, uploading, accept, onFile, urlValue, onUrl, onVideo, onClear }: {
  mode: MediaMode; onModeChange: (mode: MediaMode) => void; preview: string; uploading: boolean; accept: string;
  onFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
  urlValue: string; onUrl: (value: string) => void; onVideo: (value: string) => void; onClear: () => void;
}) {
  // Links are committed explicitly, so a half-typed address never becomes the photo.
  const [draft, setDraft] = useState(urlValue);
  const [linkError, setLinkError] = useState("");
  const commit = () => {
    const value = draft.trim();
    if (!/^https?:\/\/\S+$/i.test(value)) { setLinkError("Geçerli bir bağlantı yapıştır (https://…)."); return; }
    if (mode === "video" && !youtubeThumbnail(value)) { setLinkError("Bu bir YouTube video bağlantısı gibi görünmüyor."); return; }
    setLinkError("");
    if (mode === "video") onVideo(value); else onUrl(value);
  };
  const tabs: { key: MediaMode; label: string; icon: typeof ImageUp }[] = [
    { key: "upload", label: "Fotoğraf yükle", icon: ImageUp },
    { key: "url", label: "Görsel linki", icon: Link2 },
    { key: "video", label: "YouTube", icon: Video },
  ];
  return (
    <div>
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl bg-[#f6efe8] ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Tarif fotoğrafı önizlemesi" className="aspect-[16/10] w-full object-cover" />
          <button type="button" onClick={onClear} aria-label="Görseli kaldır"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-700 shadow-sm transition hover:text-brand">
            <Trash2 className="h-4 w-4" />
          </button>
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-slate-900/45 text-sm font-semibold text-white">Yükleniyor…</div>
          )}
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Görsel kaynağı" className="mb-3 inline-flex rounded-xl bg-gray-100 p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => onModeChange(key)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition ${mode === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                <Icon className="h-4 w-4" aria-hidden /> <span className={key === "upload" ? "" : "hidden sm:inline"}>{label}</span>
                {key !== "upload" && <span className="sm:hidden">{key === "url" ? "Link" : "Video"}</span>}
              </button>
            ))}
          </div>
          {mode === "upload" && (
            <label className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-[#fcfaf8] px-6 py-10 text-center transition hover:border-brand/50 hover:bg-[#fdf6f1]">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand ring-1 ring-black/5 transition group-hover:-translate-y-0.5">
                <ImageUp className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-[15px] font-semibold text-slate-800">Fotoğrafını seç ya da buraya bırak</span>
              <span className="mt-1 text-xs text-gray-500">JPG, PNG veya WebP · en fazla 8 MB</span>
              <input type="file" accept={accept} onChange={onFile} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Tarif fotoğrafı yükle" />
            </label>
          )}
          {mode !== "upload" && (
            <div>
              <div className="flex gap-2">
                <input type="url" inputMode="url" value={draft}
                  onChange={event => { setDraft(event.target.value); setLinkError(""); }}
                  onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); commit(); } }}
                  className={`${studioInput} min-w-0 flex-1`} aria-invalid={!!linkError}
                  placeholder={mode === "video" ? "https://www.youtube.com/watch?v=…" : "https://ornek.com/tarif-fotografi.jpg"}
                  aria-label={mode === "video" ? "YouTube bağlantısı" : "Görsel bağlantısı"} />
                <button type="button" onClick={commit} disabled={!draft.trim()}
                  className="min-h-12 shrink-0 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40">
                  Ekle
                </button>
              </div>
              {linkError && <p role="alert" className="mt-1.5 text-xs font-medium text-brand-dark">{linkError}</p>}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">Görsel isteğe bağlı. Eklemezsen tarifin kendi kapağıyla yayımlanır.</p>
        </>
      )}
    </div>
  );
}

/** Preparation steps with numbering, reordering and removal. */
export function StepsEditor({ steps, onChange, onAdd, onRemove, onMove }: {
  steps: string[]; onChange: (index: number, value: string) => void; onAdd: () => void;
  onRemove: (index: number) => void; onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={index} className="group flex flex-wrap items-center gap-2 rounded-2xl bg-[#fcfaf8] p-3 ring-1 ring-black/5 sm:flex-nowrap sm:items-start sm:gap-4 sm:p-4">
            <span className="order-1 w-8 shrink-0 text-center font-heading text-xl font-bold text-brand tabular-nums sm:pt-2">{index + 1}</span>
            <textarea aria-label={`${index + 1}. hazırlanış adımı`} value={step} rows={3}
              onChange={event => onChange(index, event.target.value)}
              placeholder={index === 0 ? "Örn. Soğanı ince doğra, zeytinyağında pembeleşene kadar kavur." : "Bu adımda ne yapılıyor?"}
              className="order-3 min-h-24 w-full min-w-0 basis-full resize-y sm:order-2 sm:basis-auto sm:flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10" />
            <div className="order-2 ml-auto flex shrink-0 gap-1 sm:order-3 sm:ml-0 sm:flex-col">
              <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`${index + 1}. adımı yukarı taşı`}
                className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onMove(index, 1)} disabled={index === steps.length - 1} aria-label={`${index + 1}. adımı aşağı taşı`}
                className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-white hover:text-slate-800 disabled:opacity-30 disabled:hover:bg-transparent">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onRemove(index)} aria-label={`${index + 1}. adımı kaldır`}
                className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-[#fdecea] hover:text-brand">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <AddRowButton onClick={onAdd} disabled={steps.length >= 40}>Adım ekle</AddRowButton>
    </div>
  );
}

export function AddRowButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 text-sm font-semibold text-slate-600 transition hover:border-brand hover:bg-[#fdf6f1] hover:text-brand disabled:opacity-50">
      <Plus className="h-4 w-4" aria-hidden /> {children}
    </button>
  );
}

type PreviewData = {
  title: string; excerpt: string; prep_time: string; cook_time: string; calories: string; servings: string;
  cuisine: string[]; meal_type: string[]; ingredients: { name: string }[]; steps: string[];
};

/** Live card preview + a plain readiness list. Shows only what the cook typed. */
export function StudioPreview({ data, image }: { data: PreviewData; image: string }) {
  const minutes = (Number(data.prep_time) || 0) + (Number(data.cook_time) || 0);
  const named = data.ingredients.filter(item => item.name.trim());
  const filledSteps = data.steps.filter(step => step.trim()).length;
  const kicker = data.cuisine[0] || data.meal_type[0];
  const checks = [
    { done: !!data.title.trim(), label: "Tarifin adı" },
    { done: /^[1-9]\d*$/.test(data.servings.trim()) && Number(data.servings) <= 36, label: "Kaç kişilik olduğu" },
    { done: named.length > 0 && named.length === data.ingredients.length, label: "Malzemeler" },
    { done: filledSteps > 0 && filledSteps === data.steps.length, label: "Hazırlanış adımları" },
  ];
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Canlı önizleme</p>
      <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5">
        <div className="relative aspect-[4/3] bg-[#f6efe8]">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : data.title.trim() ? (
            <RecipeCover title={data.title.trim()} compact />
          ) : (
            <div className="absolute inset-0 grid place-items-center"><LokmaIngredientIcon name="tabak" size="xl" /></div>
          )}
        </div>
        <div className="p-5">
          {kicker && <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{kicker}</p>}
          <h3 className={`font-heading text-xl font-bold leading-tight tracking-[-0.015em] ${data.title.trim() ? "text-slate-900" : "text-gray-300"}`}>
            {data.title.trim() || "Tarifinin adı"}
          </h3>
          {data.excerpt.trim() && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{data.excerpt}</p>}
          {(minutes > 0 || Number(data.servings) > 0 || Number(data.calories) > 0) && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-slate-600 tabular-nums">
              {minutes > 0 && <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-gray-400" aria-hidden />{minutes} dk</span>}
              {Number(data.servings) > 0 && <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gray-400" aria-hidden />{Number(data.servings)} kişilik</span>}
              {Number(data.calories) > 0 && <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-gray-400" aria-hidden />{Number(data.calories)} kcal</span>}
            </div>
          )}
          {named.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex flex-wrap gap-1.5" aria-label="Malzemeler">
                {named.slice(0, 10).map((item, i) => (
                  <span key={i} title={item.name} className="grid h-9 w-9 place-items-center rounded-xl bg-[#f6efe8]">
                    <LokmaIngredientIcon name={item.name} size="md" />
                  </span>
                ))}
                {named.length > 10 && <span className="grid h-9 min-w-9 place-items-center rounded-xl bg-gray-100 px-2 text-xs font-semibold text-slate-500">+{named.length - 10}</span>}
              </div>
              <p className="mt-2 text-xs text-gray-500 tabular-nums">{named.length} malzeme{filledSteps > 0 ? ` · ${filledSteps} adım` : ""}</p>
            </div>
          )}
        </div>
      </article>
      <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
        <p className="text-sm font-semibold text-slate-900">Yayına hazır mı?</p>
        <ul className="mt-3 space-y-2">
          {checks.map(item => (
            <li key={item.label} className={`flex items-center gap-2.5 text-sm ${item.done ? "text-slate-700" : "text-gray-400"}`}>
              {item.done
                ? <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3 w-3" strokeWidth={3} aria-hidden /></span>
                : <Circle className="h-5 w-5 text-gray-300" aria-hidden />}
              {item.label}<span className="sr-only">{item.done ? " tamam" : " eksik"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Small dialog to add a cuisine / meal type / difficulty / diet option. */
export function OptionDialog({ label, onClose, onSubmit }: { label: string; onClose: () => void; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    onClose();
  };
  return (
    <div role="presentation" className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <form role="dialog" aria-modal="true" aria-labelledby={id} onSubmit={submit}
        className="w-full max-w-sm rounded-t-3xl bg-white p-6 pb-[max(24px,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={id} className="font-heading text-lg font-bold text-slate-900">{label}</h2>
          <button type="button" onClick={onClose} aria-label="Kapat" className="grid h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <input ref={inputRef} value={value} onChange={event => setValue(event.target.value)} maxLength={60}
          className={studioInput} placeholder="Yeni seçenek" aria-label={label} />
        <button type="submit" disabled={!value.trim()}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
          Ekle
        </button>
      </form>
    </div>
  );
}

export const CATEGORY_LABELS: Record<string, { label: string; add: string }> = {
  cuisine: { label: "Mutfak", add: "Yeni mutfak ekle" },
  meal_type: { label: "Öğün türü", add: "Yeni öğün türü ekle" },
  difficulty: { label: "Zorluk", add: "Yeni zorluk seviyesi ekle" },
  diet: { label: "Beslenme tercihi", add: "Yeni beslenme tercihi ekle" },
};

/** YouTube thumbnail for a pasted watch / share / shorts link, or "" if not YouTube. */
export function youtubeThumbnail(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : "";
}
