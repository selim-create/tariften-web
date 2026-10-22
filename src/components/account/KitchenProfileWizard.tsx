"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, ChefHat, CircleAlert, Clock3, Loader2, Minus, Plus, Salad, Save,
  ShieldCheck, ThumbsDown, Trash2, Users, X,
} from "lucide-react";
import {
  KITCHEN_STEPS, type KitchenDraft, type KitchenOption, type KitchenOptions, type KitchenPatch,
  type KitchenProfile, type KitchenStepKey, KitchenProfileError, addTags, allergenConsentMissing,
  buildStepPatch, clampHousehold, draftFromProfile, formatTrDate, isStepDirty, isStepFilled,
  mergeSavedStep, removeTag, setAllergenReaction, toggleAllergen, toggleValue,
} from "@/lib/kitchen-profile";

type FieldError = { message: string; field: string; step: KitchenStepKey };

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const CHIP = `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${FOCUS}`;
const CHIP_ON = "kp-chip-on border-brand bg-[#fdf1ea] text-[#a8362b]";
const CHIP_OFF = "border-gray-200 bg-white text-slate-700 hover:border-gray-300";
const STEP_ICONS: Record<KitchenStepKey, typeof Users> = {
  household: Users, diets: Salad, dislikes: ThumbsDown, kitchen: ChefHat, allergens: ShieldCheck,
};

function Chip({ selected, onClick, children, describedBy }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; describedBy?: string;
}) {
  return (
    <button type="button" aria-pressed={selected} aria-describedby={describedBy} onClick={onClick}
      className={`${CHIP} ${selected ? CHIP_ON : CHIP_OFF}`}>
      {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

function ChoiceGrid({ options, value, onChange, label }: {
  options: KitchenOption[]; value: string | null; onChange: (value: string | null) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {options.map(option => {
        const selected = value === option.value;
        return (
          <button key={option.value} type="button" aria-pressed={selected}
            onClick={() => onChange(selected ? null : option.value)}
            className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left text-[15px] font-medium transition ${FOCUS} ${selected ? CHIP_ON : CHIP_OFF}`}>
            <span>{option.label}</span>
            <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-brand bg-brand text-white" : "border-gray-300"}`}>
              {selected && <Check className="h-3 w-3" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ id, children, hint }: { id?: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 id={id} className="font-heading text-base font-semibold text-slate-900">{children}</h3>
      {hint && <div className="mt-0.5 text-sm text-gray-500">{hint}</div>}
    </div>
  );
}

function InlineError({ id, message }: { id?: string; message: string }) {
  return (
    <div id={id} role="alert" className="kp-error mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span>{message}</span>
    </div>
  );
}

export type KitchenProfileWizardProps = {
  initialProfile: KitchenProfile;
  options: KitchenOptions;
  welcome?: boolean;
  /** Partial PUT; resolves with the profile Core stored. */
  save: (patch: KitchenPatch) => Promise<KitchenProfile>;
  /** Full DELETE; resolves with the blank profile. */
  erase?: () => Promise<KitchenProfile>;
  /** Called after the final step was saved with complete:true. */
  onFinished: (profile: KitchenProfile) => void;
};

export default function KitchenProfileWizard({ initialProfile, options, save, erase, onFinished }: KitchenProfileWizardProps) {
  const uid = useId();
  // The page is an editor once Core has recorded completion at load time.
  const [editor] = useState(() => initialProfile.completed_at !== null);
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState<KitchenDraft>(() => draftFromProfile(initialProfile));
  const [index, setIndex] = useState(0);
  const [reached, setReached] = useState(() => (initialProfile.completed_at ? KITCHEN_STEPS.length - 1 : 0));
  const [consentChecked, setConsentChecked] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<FieldError | null>(null);
  const [savedStep, setSavedStep] = useState<KitchenStepKey | null>(null);
  const [confirmErase, setConfirmErase] = useState<"allergens" | "all" | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const step = KITCHEN_STEPS[index];
  const last = index === KITCHEN_STEPS.length - 1;
  const dirty = isStepDirty(step.key, draft, profile) || (step.key === "dislikes" && tagInput.trim() !== "");
  const consentMissing = step.key === "allergens" && allergenConsentMissing(draft, profile, consentChecked);
  const fieldError = (...fields: string[]) => (error && error.step === step.key && fields.includes(error.field) ? error.message : "");
  const stepFieldNames: string[] = [...step.fields, "allergen_consent"];
  const generalError = error && error.step === step.key && !stepFieldNames.includes(error.field) ? error.message : "";

  const edit = (patch: Partial<KitchenDraft>) => {
    setDraft(current => ({ ...current, ...patch }));
    setSavedStep(null);
    if (error?.step === step.key) setError(null);
  };

  const goTo = (next: number) => {
    setIndex(next);
    setReached(current => Math.max(current, next));
    setError(null);
    setSavedStep(null);
    setTagError("");
    setConfirmErase(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  /** Adds whatever is typed in the dislike field; returns the resulting list or null on error. */
  const commitTagInput = (): string[] | null => {
    if (!tagInput.trim()) return draft.dislikes;
    const result = addTags(draft.dislikes, tagInput, options.dislikes);
    if (result.added.length) edit({ dislikes: result.tags });
    setTagInput(result.error && !result.added.length ? tagInput : "");
    setTagError(result.error);
    return result.error && !result.added.length ? null : result.tags;
  };

  const persist = async (extra: { complete?: boolean } = {}): Promise<KitchenProfile | null> => {
    let working = draft;
    if (step.key === "dislikes") {
      const tags = commitTagInput();
      if (!tags) return null;
      working = { ...draft, dislikes: tags };
    }
    if (step.key === "allergens" && allergenConsentMissing(working, profile, consentChecked)) {
      setError({ step: step.key, field: "allergen_consent", message: "Alerji bilgini kaydetmek için önce onay kutusunu işaretle." });
      return null;
    }
    const patch = buildStepPatch(step.key, working, profile, { consentChecked, complete: extra.complete });
    if (Object.keys(patch).length === 0) return profile;
    setSaving(true);
    setError(null);
    try {
      const saved = await save(patch);
      setProfile(saved);
      setDraft(mergeSavedStep(step.key, working, saved));
      if (saved.allergen_consent_at) setConsentChecked(false);
      return saved;
    } catch (reason) {
      const err = reason instanceof KitchenProfileError ? reason : null;
      setError({
        step: step.key,
        field: err?.field || "",
        message: reason instanceof Error && reason.message ? reason.message : "Kaydedilemedi. Lütfen tekrar dene.",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePrimary = async () => {
    if (editor) {
      const saved = await persist();
      if (saved) setSavedStep(step.key);
      return;
    }
    const saved = await persist({ complete: last });
    if (!saved) return;
    if (last) onFinished(saved);
    else goTo(index + 1);
  };

  /** Skip: nothing from this step is saved; the edits are put back. */
  const handleSkip = async () => {
    const reverted = mergeSavedStep(step.key, draft, profile);
    setDraft(reverted);
    setTagInput("");
    setTagError("");
    setConsentChecked(false);
    if (!last) { goTo(index + 1); return; }
    setSaving(true);
    setError(null);
    try {
      const saved = await save({ complete: true });
      onFinished(saved);
    } catch (reason) {
      setError({ step: step.key, field: "", message: reason instanceof Error && reason.message ? reason.message : "Kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  const eraseAllergens = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await save({ allergen_consent: false });
      setProfile(saved);
      setDraft(current => ({ ...current, allergens: saved.allergens.map(item => ({ ...item })) }));
      setConsentChecked(false);
      setConfirmErase(null);
      setSavedStep(step.key);
    } catch (reason) {
      setError({ step: step.key, field: "", message: reason instanceof Error && reason.message ? reason.message : "Alerji bilgin silinemedi." });
    } finally {
      setSaving(false);
    }
  };

  const eraseAll = async () => {
    if (!erase) return;
    setSaving(true);
    setError(null);
    try {
      const blank = await erase();
      setProfile(blank);
      setDraft(draftFromProfile(blank));
      setConsentChecked(false);
      setConfirmErase(null);
      setTagInput("");
      setSavedStep(step.key);
    } catch (reason) {
      setError({ step: step.key, field: "", message: reason instanceof Error && reason.message ? reason.message : "Mutfak profilin sıfırlanamadı." });
    } finally {
      setSaving(false);
    }
  };

  const primaryLabel = editor ? "Kaydet" : last ? "Bitir" : dirty ? "Kaydet ve devam et" : "Devam et";
  const progress = Math.round(((index + 1) / KITCHEN_STEPS.length) * 100);
  const Icon = STEP_ICONS[step.key];
  const { min, max } = options.household_size;
  const ids = {
    heading: `${uid}-heading`, household: `${uid}-household`, time: `${uid}-time`, tags: `${uid}-tags`,
    tagHint: `${uid}-tag-hint`, tagError: `${uid}-tag-error`, consent: `${uid}-consent`, consentHint: `${uid}-consent-hint`,
    equipment: `${uid}-equipment`, experience: `${uid}-experience`, diets: `${uid}-diets`, allergens: `${uid}-allergens`,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-10">
      {/* Progress */}
      <nav aria-label="Mutfak profili adımları" className="lg:col-span-4">
        <div className="lg:sticky lg:top-24">
          <div className="mb-3 flex items-baseline justify-between text-sm lg:hidden">
            <span className="font-semibold text-slate-900">Adım {index + 1} / {KITCHEN_STEPS.length}</span>
            <span className="text-gray-500">{step.title}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 lg:hidden" role="progressbar"
            aria-label="İlerleme" aria-valuemin={1} aria-valuemax={KITCHEN_STEPS.length} aria-valuenow={index + 1}
            aria-valuetext={`Adım ${index + 1} / ${KITCHEN_STEPS.length}: ${step.title}`}>
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
          <ol className="mt-4 flex gap-1.5 overflow-x-auto pb-1 lg:mt-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:border lg:border-gray-200 lg:bg-white lg:p-2">
            {KITCHEN_STEPS.map((item, i) => {
              const current = i === index;
              const filled = isStepFilled(item.key, profile);
              const unsaved = !current && isStepDirty(item.key, draft, profile);
              const reachable = editor || i <= reached;
              const ItemIcon = STEP_ICONS[item.key];
              return (
                <li key={item.key} className="shrink-0 lg:shrink">
                  <button type="button" disabled={!reachable || saving} onClick={() => goTo(i)}
                    aria-current={current ? "step" : undefined}
                    aria-label={`${i + 1}. ${item.title}${filled ? ", dolduruldu" : ""}${unsaved ? ", kaydedilmemiş değişiklik var" : ""}`}
                    className={`flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition lg:h-auto lg:w-full lg:rounded-2xl lg:border-transparent lg:px-3 lg:py-3 ${FOCUS} ${current
                      ? "border-slate-900 bg-slate-900 text-white lg:border-transparent"
                      : "kp-step-idle border-gray-200 bg-white text-slate-600 enabled:hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 lg:bg-transparent"}`}>
                    <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold lg:h-8 lg:w-8 ${current
                      ? "bg-white/15 text-white" : filled ? "kp-tint bg-[#fdf1ea] text-[#a8362b]" : "bg-gray-100 text-slate-500"}`}>
                      {filled && !current ? <Check className="h-3.5 w-3.5" /> : <ItemIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />}
                    </span>
                    <span className="whitespace-nowrap lg:hidden">{item.short}</span>
                    <span className="hidden min-w-0 flex-1 text-left lg:block">
                      <span className="block truncate">{item.title}</span>
                    </span>
                    {unsaved && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 hidden px-2 text-xs leading-relaxed text-gray-500 lg:block">
            Hepsi isteğe bağlı. Bilgilerini istediğin zaman buradan değiştirebilir ya da silebilirsin.
          </p>
        </div>
      </nav>

      {/* Step */}
      <section aria-labelledby={ids.heading} className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8 lg:col-span-8">
        <div className="flex items-start gap-4">
          <span aria-hidden className="kp-tint hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fdf1ea] text-[#a8362b] sm:grid">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
              Adım {index + 1} / {KITCHEN_STEPS.length}
            </p>
            <h2 id={ids.heading} ref={headingRef} tabIndex={-1} className="mt-1 font-heading text-2xl font-bold tracking-[-0.02em] text-slate-900 outline-none sm:text-[28px]">
              {step.title}
            </h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{step.hint}</p>
          </div>
        </div>

        <div className="mt-7 space-y-8">
          {step.key === "household" && (
            <>
              <div>
                <FieldLabel id={ids.household} hint={`${min}–${max} kişi arası`}>Kaç kişilik pişiriyorsun?</FieldLabel>
                <div role="group" aria-labelledby={ids.household} className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-white p-1">
                    <button type="button" aria-label="Kişi sayısını azalt"
                      disabled={draft.household_size !== null && draft.household_size <= min}
                      onClick={() => edit({ household_size: clampHousehold((draft.household_size ?? min + 1) - 1, options.household_size) })}
                      className={`grid h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}>
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <output aria-live="polite" className="min-w-[5.5rem] text-center font-heading text-xl font-semibold tabular-nums text-slate-900">
                      {draft.household_size === null ? "–" : `${draft.household_size} kişi`}
                    </output>
                    <button type="button" aria-label="Kişi sayısını artır"
                      disabled={draft.household_size !== null && draft.household_size >= max}
                      onClick={() => edit({ household_size: clampHousehold(draft.household_size === null ? Math.max(min, 2) : draft.household_size + 1, options.household_size) })}
                      className={`grid h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}>
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                  {draft.household_size !== null && (
                    <button type="button" onClick={() => edit({ household_size: null })}
                      className={`rounded-lg px-2 py-1 text-sm text-gray-500 underline-offset-4 hover:text-slate-900 hover:underline ${FOCUS}`}>
                      Belirtmek istemiyorum
                    </button>
                  )}
                </div>
                {fieldError("household_size") && <InlineError message={fieldError("household_size")} />}
              </div>
              <div>
                <FieldLabel id={ids.time} hint="Hafta içi bir akşam için düşün.">
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-gray-400" aria-hidden /> Yemeğe ne kadar vakit ayırırsın?</span>
                </FieldLabel>
                <ChoiceGrid label="Zaman tercihi" options={options.time_preference} value={draft.time_preference}
                  onChange={value => edit({ time_preference: value as KitchenDraft["time_preference"] })} />
                {fieldError("time_preference") && <InlineError message={fieldError("time_preference")} />}
              </div>
            </>
          )}

          {step.key === "diets" && (
            <div>
              <FieldLabel id={ids.diets} hint={draft.diets.length ? `${draft.diets.length} seçili` : "Hiçbiri sana uymuyorsa boş bırak."}>Beslenme şeklin</FieldLabel>
              <div role="group" aria-labelledby={ids.diets} className="flex flex-wrap gap-2">
                {options.diets.map(option => (
                  <Chip key={option.value} selected={draft.diets.includes(option.value)}
                    onClick={() => edit({ diets: toggleValue(draft.diets, option.value) })}>{option.label}</Chip>
                ))}
              </div>
              {fieldError("diets") && <InlineError message={fieldError("diets")} />}
            </div>
          )}

          {step.key === "dislikes" && (
            <div>
              <FieldLabel hint={<span id={ids.tagHint}>Enter ya da virgülle ekle. En fazla {options.dislikes.max_items} malzeme, her biri en fazla {options.dislikes.max_length} karakter.</span>}>
                <label htmlFor={ids.tags}>Sevmediğin malzemeler</label>
              </FieldLabel>
              <div className={`rounded-2xl border bg-gray-50 p-2 transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10 ${tagError || fieldError("dislikes") ? "border-red-300" : "border-gray-200"}`}>
                {draft.dislikes.length > 0 && (
                  <ul aria-label="Eklenen malzemeler" className="flex flex-wrap gap-1.5 p-1">
                    {draft.dislikes.map(tag => (
                      <li key={tag} className="inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1 text-sm text-slate-800">
                        <span className="truncate">{tag}</span>
                        <button type="button" aria-label={`${tag} kaldır`} onClick={() => edit({ dislikes: removeTag(draft.dislikes, tag) })}
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-black/5 hover:text-slate-900 ${FOCUS}`}>
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2">
                  <input id={ids.tags} type="text" value={tagInput} autoComplete="off" enterKeyHint="enter"
                    maxLength={options.dislikes.max_length * 4}
                    aria-describedby={`${ids.tagHint}${tagError ? ` ${ids.tagError}` : ""}`}
                    aria-invalid={tagError || fieldError("dislikes") ? true : undefined}
                    placeholder={draft.dislikes.length ? "Bir tane daha…" : "ör. kişniş, bamya, ciğer"}
                    disabled={draft.dislikes.length >= options.dislikes.max_items}
                    onChange={event => {
                      const value = event.target.value;
                      setTagError("");
                      if (/[,\n]/.test(value)) {
                        const result = addTags(draft.dislikes, value, options.dislikes);
                        if (result.added.length) edit({ dislikes: result.tags });
                        setTagError(result.error);
                        setTagInput("");
                      } else setTagInput(value);
                    }}
                    onKeyDown={event => {
                      if (event.key === "Enter") { event.preventDefault(); commitTagInput(); }
                      else if (event.key === "Backspace" && !tagInput && draft.dislikes.length) {
                        edit({ dislikes: draft.dislikes.slice(0, -1) });
                      }
                    }}
                    className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-[15px] text-slate-800 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed" />
                  <button type="button" onClick={commitTagInput} disabled={!tagInput.trim()}
                    className={`inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-40 ${FOCUS}`}>
                    <Plus className="h-3.5 w-3.5" aria-hidden /> Ekle
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
                <span aria-live="polite">{draft.dislikes.length} / {options.dislikes.max_items}</span>
                {draft.dislikes.length >= options.dislikes.max_items && <span>Liste doldu; eklemek için birini kaldır.</span>}
              </div>
              {tagError && <InlineError id={ids.tagError} message={tagError} />}
              {fieldError("dislikes") && <InlineError message={fieldError("dislikes")} />}
            </div>
          )}

          {step.key === "kitchen" && (
            <>
              <div>
                <FieldLabel id={ids.equipment} hint="Sahip olduklarını seç; tariflerde buna göre yol gösterelim.">Mutfağında neler var?</FieldLabel>
                <div role="group" aria-labelledby={ids.equipment} className="flex flex-wrap gap-2">
                  {options.equipment.map(option => (
                    <Chip key={option.value} selected={draft.equipment.includes(option.value)}
                      onClick={() => edit({ equipment: toggleValue(draft.equipment, option.value) })}>{option.label}</Chip>
                  ))}
                </div>
                {fieldError("equipment") && <InlineError message={fieldError("equipment")} />}
              </div>
              <div>
                <FieldLabel id={ids.experience}>Mutfakta kendini nasıl tarif edersin?</FieldLabel>
                <ChoiceGrid label="Mutfak deneyimi" options={options.experience} value={draft.experience}
                  onChange={value => edit({ experience: value as KitchenDraft["experience"] })} />
                {fieldError("experience") && <InlineError message={fieldError("experience")} />}
              </div>
            </>
          )}

          {step.key === "allergens" && (
            <>
              <div>
                <FieldLabel id={ids.allergens} hint={draft.allergens.length ? `${draft.allergens.length} seçili` : "Yoksa boş bırakman yeterli."}>Hangi besinlere dikkat etmeliyiz?</FieldLabel>
                <div role="group" aria-labelledby={ids.allergens} className="flex flex-wrap gap-2">
                  {options.allergens.map(option => (
                    <Chip key={option.value} selected={draft.allergens.some(item => item.key === option.value)}
                      onClick={() => edit({ allergens: toggleAllergen(draft.allergens, option.value) })}>{option.label}</Chip>
                  ))}
                </div>
                {fieldError("allergens") && <InlineError message={fieldError("allergens")} />}
              </div>

              {draft.allergens.length > 0 && (
                <div>
                  <FieldLabel hint="Her biri için tepkinin türünü seç.">Alerji mi, intolerans mı?</FieldLabel>
                  <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200">
                    {draft.allergens.map(item => {
                      const name = options.allergens.find(option => option.value === item.key)?.label ?? item.key;
                      return (
                        <li key={item.key} className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3">
                          <span className="text-[15px] font-medium text-slate-800">{name}</span>
                          <div role="group" aria-label={`${name} için tepki türü`} className="inline-flex rounded-xl bg-gray-100 p-1">
                            {options.reactions.map(reaction => {
                              const active = item.type === reaction.value;
                              return (
                                <button key={reaction.value} type="button" aria-pressed={active}
                                  onClick={() => edit({ allergens: setAllergenReaction(draft.allergens, item.key, reaction.value === "intolerance" ? "intolerance" : "allergy") })}
                                  className={`h-9 rounded-lg px-3 text-sm font-semibold transition ${FOCUS} ${active ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                                  {reaction.label}
                                </button>
                              );
                            })}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {profile.allergen_consent_at ? (
                <div className="kp-ok flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Onay verildi · {formatTrDate(profile.allergen_consent_at)}
                  </span>
                  {confirmErase === "allergens" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-emerald-950">Alerji bilgilerin ve onayın silinsin mi?</span>
                      <button type="button" onClick={() => setConfirmErase(null)} disabled={saving}
                        className={`kp-ok-btn h-9 rounded-xl border border-emerald-300 bg-[#fff] px-3 text-sm font-semibold text-emerald-900 ${FOCUS}`}>Vazgeç</button>
                      <button type="button" onClick={eraseAllergens} disabled={saving}
                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 ${FOCUS}`}>
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Trash2 className="h-3.5 w-3.5" aria-hidden />} Sil
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmErase("allergens")}
                      className={`kp-ok-btn kp-danger inline-flex h-9 items-center gap-1.5 self-start rounded-xl border border-emerald-300 bg-[#fff] px-3 text-sm font-semibold text-red-700 hover:border-red-300 sm:self-auto ${FOCUS}`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Alerji bilgimi sil
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor={ids.consent}
                    className={`kp-consent flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${consentChecked ? "border-brand/50 bg-[#fdf1ea]" : fieldError("allergen_consent") ? "border-red-300 bg-[#fffaf8]" : "border-[#eadfd7] bg-[#fffaf8]"}`}>
                    <input id={ids.consent} type="checkbox" checked={consentChecked}
                      aria-describedby={ids.consentHint} aria-invalid={fieldError("allergen_consent") ? true : undefined}
                      onChange={event => { setConsentChecked(event.target.checked); if (error?.field === "allergen_consent") setError(null); }}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-300 accent-[#db4c3f]" />
                    <span className="min-w-0">
                      <span className="kp-consent-title block text-sm font-semibold text-stone-900">Alerji bilgimin saklanmasına onay veriyorum.</span>
                      {options.allergen_notice && <span className="kp-consent-body mt-1 block text-[13px] leading-relaxed text-stone-600">{options.allergen_notice}</span>}
                    </span>
                  </label>
                  <span id={ids.consentHint} className="sr-only">Alerji kaydetmek için bu onay gereklidir.</span>
                  {consentMissing && !fieldError("allergen_consent") && (
                    <div className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-amber-700">
                      <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden /> Seçtiğin alerjileri kaydetmek için yukarıdaki onayı işaretle.
                    </div>
                  )}
                  {fieldError("allergen_consent") && <InlineError message={fieldError("allergen_consent")} />}
                </div>
              )}
            </>
          )}
        </div>

        {generalError && <InlineError message={generalError} />}

        {/* Actions */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button type="button" onClick={() => goTo(index - 1)} disabled={saving}
                className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900 ${FOCUS}`}>
                <ArrowLeft className="h-4 w-4" aria-hidden /> Geri
              </button>
            )}
            {editor ? (
              !last && (
                <button type="button" onClick={() => goTo(index + 1)} disabled={saving}
                  className={`inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900 ${FOCUS}`}>
                  Sonraki adım <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )
            ) : (
              <button type="button" onClick={handleSkip} disabled={saving}
                className={`inline-flex h-11 items-center rounded-xl px-3 text-sm font-semibold text-gray-500 underline-offset-4 transition hover:text-slate-900 hover:underline ${FOCUS}`}>
                Şimdilik atla
              </button>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <span aria-live="polite" className="text-center text-sm sm:text-right">
              {savedStep === step.key && !dirty && (
                <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700"><Check className="h-4 w-4" aria-hidden /> Kaydedildi</span>
              )}
            </span>
            <button type="button" onClick={handlePrimary}
              disabled={saving || consentMissing || (editor && !dirty)}
              aria-describedby={consentMissing ? ids.consentHint : undefined}
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Kaydediliyor…</>
                : editor ? <><Save className="h-4 w-4" aria-hidden /> {primaryLabel}</>
                  : last ? <><Check className="h-4 w-4" aria-hidden /> {primaryLabel}</>
                    : <>{primaryLabel} <ArrowRight className="h-4 w-4" aria-hidden /></>}
            </button>
          </div>
        </div>

        {editor && erase && (
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            {confirmErase === "all" ? (
              <>
                <span>Tüm mutfak profilin silinsin mi?</span>
                <button type="button" onClick={() => setConfirmErase(null)} disabled={saving}
                  className={`rounded-lg px-2 py-1 font-semibold text-slate-700 hover:text-slate-900 ${FOCUS}`}>Vazgeç</button>
                <button type="button" onClick={eraseAll} disabled={saving}
                  className={`rounded-lg px-2 py-1 font-semibold text-red-700 hover:text-red-800 ${FOCUS}`}>Evet, sıfırla</button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmErase("all")}
                className={`inline-flex items-center gap-1.5 rounded-lg py-1 underline-offset-4 hover:text-slate-900 hover:underline ${FOCUS}`}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Mutfak profilimi sıfırla
              </button>
            )}
          </div>
        )}
      </section>

      {!editor && (
        <p className="text-center text-xs text-gray-500 lg:col-span-12">
          Acelen mi var? <Link href="/profile" className="font-semibold text-slate-700 underline-offset-4 hover:text-brand hover:underline">Daha sonra tamamla</Link>
        </p>
      )}
    </div>
  );
}
