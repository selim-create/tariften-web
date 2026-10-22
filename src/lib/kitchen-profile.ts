/**
 * Kitchen profile ("Mutfağını tanıyalım") — types, pure helpers and the
 * browser transport. No imports on purpose: this module is transpiled and
 * exercised directly by scripts/check-kitchen-profile-web.test.cjs.
 *
 * Every option label comes from the Core `options` payload; nothing here
 * hardcodes a diet, allergen or equipment list.
 */

export type KitchenOption = { value: string; label: string };
export type AllergenReaction = "allergy" | "intolerance";
export type KitchenAllergen = { key: string; type: AllergenReaction };
export type KitchenExperience = "beginner" | "intermediate" | "pro";
export type KitchenTimePreference = "under_20" | "under_45" | "no_limit";

export type KitchenProfile = {
  version: number;
  household_size: number | null;
  diets: string[];
  dislikes: string[];
  equipment: string[];
  experience: KitchenExperience | null;
  time_preference: KitchenTimePreference | null;
  allergens: KitchenAllergen[];
  allergen_consent_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

export type KitchenOptions = {
  household_size: { min: number; max: number };
  diets: KitchenOption[];
  equipment: KitchenOption[];
  experience: KitchenOption[];
  time_preference: KitchenOption[];
  allergens: KitchenOption[];
  reactions: KitchenOption[];
  dislikes: { max_items: number; max_length: number };
  allergen_notice: string;
};

/** What the form edits; saved step by step with partial PUTs. */
export type KitchenDraft = {
  household_size: number | null;
  time_preference: KitchenTimePreference | null;
  diets: string[];
  dislikes: string[];
  equipment: string[];
  experience: KitchenExperience | null;
  allergens: KitchenAllergen[];
};

export type KitchenPatch = Partial<KitchenDraft> & { allergen_consent?: boolean; complete?: true };

export type KitchenStepKey = "household" | "diets" | "dislikes" | "kitchen" | "allergens";

export const KITCHEN_STEPS: ReadonlyArray<{
  key: KitchenStepKey; title: string; short: string; hint: string; fields: ReadonlyArray<keyof KitchenDraft>;
}> = [
  { key: "household", title: "Hane ve zaman", short: "Hane", hint: "Kaç kişiye pişirdiğini ve mutfağa ne kadar vakit ayırabildiğini bilelim.", fields: ["household_size", "time_preference"] },
  { key: "diets", title: "Beslenme", short: "Beslenme", hint: "Uyduğun beslenme şekillerini seç. Birden fazla olabilir.", fields: ["diets"] },
  { key: "dislikes", title: "Sevmediklerin", short: "Sevmedikler", hint: "Tabağında görmek istemediğin malzemeleri yaz; önerilerde geri plana atalım.", fields: ["dislikes"] },
  { key: "kitchen", title: "Ekipman ve deneyim", short: "Ekipman", hint: "Mutfağında neler var, kendini ne kadar rahat hissediyorsun?", fields: ["equipment", "experience"] },
  { key: "allergens", title: "Alerjiler", short: "Alerjiler", hint: "Alerjin ya da intoleransın olan besinleri işaretle. Tamamen isteğe bağlı.", fields: ["allergens"] },
];

const EXPERIENCES: readonly KitchenExperience[] = ["beginner", "intermediate", "pro"];
const TIMES: readonly KitchenTimePreference[] = ["under_20", "under_45", "no_limit"];
const DEFAULT_DISLIKES = { max_items: 30, max_length: 40 };

/* ---------------------------------------------------------------- parsing */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const stringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
const nullableString = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

export function emptyKitchenProfile(): KitchenProfile {
  return {
    version: 1, household_size: null, diets: [], dislikes: [], equipment: [], experience: null,
    time_preference: null, allergens: [], allergen_consent_at: null, completed_at: null, updated_at: null,
  };
}

export function parseKitchenProfile(raw: unknown): KitchenProfile {
  if (!isRecord(raw)) throw new Error("Mutfak profili yanıtı eksik.");
  const size = typeof raw.household_size === "number" && Number.isInteger(raw.household_size) ? raw.household_size : null;
  const experience = EXPERIENCES.includes(raw.experience as KitchenExperience) ? raw.experience as KitchenExperience : null;
  const time = TIMES.includes(raw.time_preference as KitchenTimePreference) ? raw.time_preference as KitchenTimePreference : null;
  const allergens = Array.isArray(raw.allergens)
    ? raw.allergens.flatMap(item => isRecord(item) && typeof item.key === "string" && item.key
      ? [{ key: item.key, type: item.type === "intolerance" ? "intolerance" as const : "allergy" as const }] : [])
    : [];
  return {
    version: typeof raw.version === "number" ? raw.version : 1,
    household_size: size,
    diets: stringList(raw.diets),
    dislikes: stringList(raw.dislikes),
    equipment: stringList(raw.equipment),
    experience,
    time_preference: time,
    allergens,
    allergen_consent_at: nullableString(raw.allergen_consent_at),
    completed_at: nullableString(raw.completed_at),
    updated_at: nullableString(raw.updated_at),
  };
}

const optionList = (value: unknown): KitchenOption[] => Array.isArray(value)
  ? value.flatMap(item => isRecord(item) && typeof item.value === "string" && typeof item.label === "string"
    ? [{ value: item.value, label: item.label }] : [])
  : [];

export function parseKitchenOptions(raw: unknown): KitchenOptions {
  if (!isRecord(raw)) throw new Error("Mutfak profili seçenekleri alınamadı.");
  const size = isRecord(raw.household_size) ? raw.household_size : {};
  const dislikes = isRecord(raw.dislikes) ? raw.dislikes : {};
  const min = typeof size.min === "number" ? size.min : 1;
  const max = typeof size.max === "number" ? size.max : 12;
  return {
    household_size: { min, max: Math.max(min, max) },
    diets: optionList(raw.diets),
    equipment: optionList(raw.equipment),
    experience: optionList(raw.experience),
    time_preference: optionList(raw.time_preference),
    allergens: optionList(raw.allergens),
    reactions: optionList(raw.reactions),
    dislikes: {
      max_items: typeof dislikes.max_items === "number" ? dislikes.max_items : DEFAULT_DISLIKES.max_items,
      max_length: typeof dislikes.max_length === "number" ? dislikes.max_length : DEFAULT_DISLIKES.max_length,
    },
    allergen_notice: typeof raw.allergen_notice === "string" ? raw.allergen_notice : "",
  };
}

export function optionLabel(options: KitchenOption[], value: string | null | undefined): string {
  if (!value) return "";
  return options.find(option => option.value === value)?.label ?? value;
}

/* ------------------------------------------------------------ draft logic */

export function draftFromProfile(profile: KitchenProfile): KitchenDraft {
  return {
    household_size: profile.household_size,
    time_preference: profile.time_preference,
    diets: [...profile.diets],
    dislikes: [...profile.dislikes],
    equipment: [...profile.equipment],
    experience: profile.experience,
    allergens: profile.allergens.map(item => ({ ...item })),
  };
}

export function clampHousehold(value: number, range: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return range.min;
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

/** Toggle a value in a multi-select list, keeping the original order of the rest. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

export function toggleAllergen(list: KitchenAllergen[], key: string): KitchenAllergen[] {
  return list.some(item => item.key === key)
    ? list.filter(item => item.key !== key)
    : [...list, { key, type: "allergy" }];
}

export function setAllergenReaction(list: KitchenAllergen[], key: string, type: AllergenReaction): KitchenAllergen[] {
  return list.map(item => (item.key === key ? { key, type } : item));
}

/* ---------------------------------------------------------- dislike tags */

export function normalizeTag(raw: string): string {
  return raw.replace(/[,\n\r\t]+/g, " ").replace(/\s+/g, " ").trim();
}

const tagKey = (tag: string) => tag.toLocaleLowerCase("tr-TR");

export type TagAddResult = { tags: string[]; added: string[]; error: string };

/**
 * Splits on commas/new lines, trims, de-duplicates (Turkish case folding) and
 * enforces Core's limits. Too-long or over-limit entries are reported, never
 * silently truncated.
 */
export function addTags(existing: string[], input: string, limits: { max_items: number; max_length: number }): TagAddResult {
  const tags = [...existing];
  const added: string[] = [];
  let error = "";
  for (const piece of input.split(/[,\n\r]+/)) {
    const tag = normalizeTag(piece);
    if (!tag) continue;
    if ([...tag].length > limits.max_length) {
      error = `Her malzeme en fazla ${limits.max_length} karakter olabilir.`;
      continue;
    }
    if (tags.some(item => tagKey(item) === tagKey(tag))) continue;
    if (tags.length >= limits.max_items) {
      error = `En fazla ${limits.max_items} malzeme ekleyebilirsin.`;
      break;
    }
    tags.push(tag);
    added.push(tag);
  }
  return { tags, added, error };
}

export function removeTag(list: string[], tag: string): string[] {
  return list.filter(item => item !== tag);
}

/* ------------------------------------------------------- payload building */

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((item, i) => item === b[i]);
const sameAllergens = (a: KitchenAllergen[], b: KitchenAllergen[]) =>
  a.length === b.length && a.every((item, i) => item.key === b[i].key && item.type === b[i].type);

function sameField(field: keyof KitchenDraft, draft: KitchenDraft, profile: KitchenProfile): boolean {
  const left = draft[field];
  const right = profile[field];
  if (field === "allergens") return sameAllergens(left as KitchenAllergen[], right as KitchenAllergen[]);
  if (Array.isArray(left) && Array.isArray(right)) return sameList(left as string[], right as string[]);
  return left === right;
}

export function stepFields(step: KitchenStepKey): ReadonlyArray<keyof KitchenDraft> {
  return KITCHEN_STEPS.find(item => item.key === step)?.fields ?? [];
}

export function isStepDirty(step: KitchenStepKey, draft: KitchenDraft, profile: KitchenProfile): boolean {
  return stepFields(step).some(field => !sameField(field, draft, profile));
}

/** True when the member has chosen anything for this step. */
export function isStepFilled(step: KitchenStepKey, profile: KitchenProfile | KitchenDraft): boolean {
  switch (step) {
    case "household": return profile.household_size !== null || profile.time_preference !== null;
    case "diets": return profile.diets.length > 0;
    case "dislikes": return profile.dislikes.length > 0;
    case "kitchen": return profile.equipment.length > 0 || profile.experience !== null;
    case "allergens": return profile.allergens.length > 0;
  }
}

export function filledStepCount(profile: KitchenProfile): number {
  return KITCHEN_STEPS.filter(step => isStepFilled(step.key, profile)).length;
}

/** Saving any allergen needs explicit consent unless Core already recorded it. */
export function allergenConsentMissing(draft: KitchenDraft, profile: KitchenProfile, consentChecked: boolean): boolean {
  return draft.allergens.length > 0 && !profile.allergen_consent_at && !consentChecked;
}

/**
 * Partial PUT body for one step: only that step's keys. The first non-empty
 * allergen save carries `allergen_consent: true`; `complete` marks the end.
 */
export function buildStepPatch(
  step: KitchenStepKey,
  draft: KitchenDraft,
  profile: KitchenProfile,
  extra: { consentChecked?: boolean; complete?: boolean } = {},
): KitchenPatch {
  const patch: KitchenPatch = {};
  for (const field of stepFields(step)) {
    if (sameField(field, draft, profile)) continue;
    const value = draft[field];
    (patch as Record<string, unknown>)[field] = Array.isArray(value)
      ? value.map(item => (typeof item === "object" ? { ...item } : item))
      : value;
  }
  if (step === "allergens" && patch.allergens && patch.allergens.length > 0
      && !profile.allergen_consent_at && extra.consentChecked) {
    patch.allergen_consent = true;
  }
  if (extra.complete) patch.complete = true;
  return patch;
}

/** After a save, take the server's values for this step only; keep other unsaved edits. */
export function mergeSavedStep(step: KitchenStepKey, draft: KitchenDraft, saved: KitchenProfile): KitchenDraft {
  const fresh = draftFromProfile(saved);
  const next = { ...draft } as Record<keyof KitchenDraft, unknown>;
  for (const field of stepFields(step)) next[field] = fresh[field];
  return next as KitchenDraft;
}

export function formatTrDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/* ------------------------------------------------------------- transport */

export class KitchenProfileError extends Error {
  status: number;
  code: string;
  field: string;
  constructor(message: string, status = 0, code = "", field = "") {
    super(message);
    this.name = "KitchenProfileError";
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export function kitchenErrorFrom(status: number, payload: unknown): KitchenProfileError {
  const data = isRecord(payload) ? payload : {};
  const code = typeof data.code === "string" ? data.code : "";
  const inner = isRecord(data.data) ? data.data : {};
  let field = typeof inner.field === "string" ? inner.field : "";
  if (!field && code === "allergen_consent_required") field = "allergen_consent";
  const raw = typeof data.message === "string" ? data.message.trim() : "";
  const message = raw && !/<\/?[a-z][\s\S]*>/i.test(raw) ? raw
    : status === 401 ? "Oturumunun süresi dolmuş. Lütfen yeniden giriş yap."
      : status === 400 ? "Bazı bilgiler kaydedilemedi. Lütfen kontrol et."
        : "Mutfak profili şu anda kaydedilemedi. Biraz sonra tekrar dene.";
  return new KitchenProfileError(message, status, code, field);
}

const ENDPOINT = "/api/account/kitchen-profile";

async function call(token: string, method: "GET" | "PUT" | "DELETE", body?: KitchenPatch): Promise<Record<string, unknown>> {
  if (!token) throw new KitchenProfileError("Mutfak profilin için giriş yapmalısın.", 401);
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method,
      headers: body
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new KitchenProfileError("Bağlantı kurulamadı. İnternet bağlantını kontrol et.");
  }
  let payload: unknown = null;
  try { payload = await res.json(); } catch { /* handled below */ }
  if (!res.ok || !isRecord(payload) || payload.success !== true) {
    throw kitchenErrorFrom(res.ok ? 502 : res.status, payload);
  }
  return payload;
}

export async function getKitchenProfile(token: string): Promise<{ profile: KitchenProfile; options: KitchenOptions }> {
  const data = await call(token, "GET");
  return { profile: parseKitchenProfile(data.profile), options: parseKitchenOptions(data.options) };
}

export async function updateKitchenProfile(token: string, patch: KitchenPatch): Promise<{ profile: KitchenProfile }> {
  const data = await call(token, "PUT", patch);
  return { profile: parseKitchenProfile(data.profile) };
}

export async function deleteKitchenProfile(token: string): Promise<{ profile: KitchenProfile }> {
  const data = await call(token, "DELETE");
  return { profile: parseKitchenProfile(data.profile) };
}

/* ------------------------------------------------- per-tab memory cache */

/**
 * The recipe page reads the member's allergens on every recipe; one GET per
 * signed-in token per tab is enough. Memory only (never browser storage): this
 * is health data. A failed request is not cached, so a later page retries.
 * The kitchen profile screen refreshes the cache after every save.
 */
export type KitchenProfileData = { profile: KitchenProfile; options: KitchenOptions };
const profileCache = new Map<string, { promise: Promise<KitchenProfileData>; value: KitchenProfileData | null }>();

export function peekKitchenProfile(token: string): KitchenProfileData | null {
  return (token && profileCache.get(token)?.value) || null;
}

export function loadKitchenProfile(token: string): Promise<KitchenProfileData> {
  const hit = profileCache.get(token);
  if (hit) return hit.promise;
  const entry: { promise: Promise<KitchenProfileData>; value: KitchenProfileData | null } = {
    promise: Promise.resolve(null as unknown as KitchenProfileData), value: null,
  };
  entry.promise = getKitchenProfile(token).then(
    data => { entry.value = data; return data; },
    reason => { if (profileCache.get(token) === entry) profileCache.delete(token); throw reason; },
  );
  profileCache.set(token, entry);
  return entry.promise;
}

/** After a save: keep Core's options, take the saved profile. */
export function rememberKitchenProfile(token: string, profile: KitchenProfile, options?: KitchenOptions): void {
  if (!token) return;
  const known = options ?? peekKitchenProfile(token)?.options;
  if (!known) { profileCache.delete(token); return; }
  const value = { profile, options: known };
  profileCache.set(token, { promise: Promise.resolve(value), value });
}

export function forgetKitchenProfiles(): void {
  profileCache.clear();
}
