/**
 * Recipe allergens (Core 1.0.51, P10) — pure helpers for the recipe page band,
 * the public "Alerjen bilgisi" line and the AI generation outcomes.
 * No imports on purpose: scripts/check-allergen-ui-web.test.cjs transpiles and
 * exercises this module directly.
 *
 * Core detects allergens from ingredient NAMES only. Every message built here
 * ends with the same reminder that it does not replace reading the label.
 */

export type RecipeAllergens = { contains: string[]; possible: string[] };
export type AllergenOption = { value: string; label: string };
export type ProfileAllergen = { key: string; type?: string };
export type AllergenHit = { key: string; label: string };
export type AllergenMatch = { contains: AllergenHit[]; possible: AllergenHit[] };
export type AllergenConflict = { key: string; label: string; ingredients: string[] };
export type AllergenCaution = AllergenConflict;

/** EU Regulation 1169/2011 Annex II order; every list here follows it. */
export const EU_ALLERGEN_KEYS = [
  "gluten", "crustaceans", "eggs", "fish", "peanuts", "soy", "milk",
  "tree_nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs",
] as const;

/**
 * Short Turkish labels (Core `Tariften_Allergens::LABELS`). Used ONLY for the
 * public, signed-out "Alerjen bilgisi" line when the member's kitchen-profile
 * options are not loaded. Member-facing warnings take Core's option labels.
 */
export const PUBLIC_ALLERGEN_LABELS: Readonly<Record<string, string>> = {
  gluten: "Gluten",
  crustaceans: "Kabuklular",
  eggs: "Yumurta",
  fish: "Balık",
  peanuts: "Yer fıstığı",
  soy: "Soya",
  milk: "Süt ve süt ürünleri",
  tree_nuts: "Sert kabuklu yemişler",
  celery: "Kereviz",
  mustard: "Hardal",
  sesame: "Susam",
  sulphites: "Sülfitler",
  lupin: "Acı bakla (lupin)",
  molluscs: "Yumuşakçalar",
};

export const ALLERGEN_DISCLAIMER = "Malzeme adlarından otomatik çıkarılır; etiket okumanın yerini tutmaz.";
export const ALLERGEN_PROFILE_HREF = "/profile/kitchen";
export const ALLERGEN_ATTEMPT_NOTE = "Bu deneme günlük AI tarif hakkından sayıldı.";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const KNOWN = new Set<string>(EU_ALLERGEN_KEYS);
const euOrder = (keys: Iterable<string>) => {
  const set = new Set(keys);
  return EU_ALLERGEN_KEYS.filter(key => set.has(key)) as string[];
};
const cleanText = (value: unknown): string =>
  typeof value === "string" ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";

/**
 * `recipe.allergens` → known keys only, EU order, a key never in both lists.
 * Old cached recipes have no summary: null means "unknown", never "none".
 */
export function parseRecipeAllergens(raw: unknown): RecipeAllergens | null {
  if (!isRecord(raw)) return null;
  const list = (value: unknown) => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && KNOWN.has(item)) : [];
  if (!Array.isArray(raw.contains) && !Array.isArray(raw.possible)) return null;
  const contains = euOrder(list(raw.contains));
  const possible = euOrder(list(raw.possible)).filter(key => !contains.includes(key));
  return { contains, possible };
}

/** "Sert kabuklu yemişler (fındık, ceviz, badem…)" → "Sert kabuklu yemişler" for a sentence. */
export function shortAllergenLabel(label: string): string {
  const short = label.replace(/\s*\([^()]*\)\s*$/, "").trim();
  return short || label.trim();
}

/** Core option label first; the public fallback map; the key as a last resort. */
export function allergenLabel(key: string, options?: ReadonlyArray<AllergenOption> | null): string {
  const option = options?.find(item => item.value === key)?.label;
  if (option && option.trim()) return shortAllergenLabel(option);
  return PUBLIC_ALLERGEN_LABELS[key] ?? key;
}

/**
 * Member band: recipe summary ∩ declared allergens. Nothing without explicit
 * consent (Core ignores unconsented allergens too) or without a summary.
 */
export function matchProfileAllergens(
  recipe: RecipeAllergens | null,
  declared: ReadonlyArray<ProfileAllergen> | null | undefined,
  consentAt: string | null | undefined,
  options?: ReadonlyArray<AllergenOption> | null,
): AllergenMatch {
  const none: AllergenMatch = { contains: [], possible: [] };
  if (!recipe || !consentAt || !declared || declared.length === 0) return none;
  const mine = new Set(declared.map(item => item.key));
  const hit = (keys: string[]) => keys.filter(key => mine.has(key)).map(key => ({ key, label: allergenLabel(key, options) }));
  return { contains: hit(recipe.contains), possible: hit(recipe.possible) };
}

export const hasAllergenMatch = (match: AllergenMatch) => match.contains.length > 0 || match.possible.length > 0;

/** "A", "A ve B", "A, B ve C". */
export function joinTr(items: ReadonlyArray<string>): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} ve ${items[items.length - 1]}`;
}

/** A sentence as text runs so labels can be bold without HTML strings. */
export type NoticeRun = { text: string; strong?: boolean };

function labelRuns(hits: ReadonlyArray<AllergenHit>): NoticeRun[] {
  const runs: NoticeRun[] = [];
  hits.forEach((hit, index) => {
    if (index > 0) runs.push({ text: index === hits.length - 1 ? " ve " : ", " });
    runs.push({ text: hit.label, strong: true });
  });
  return runs;
}

const allergenWord = (count: number) => (count > 1 ? "alerjenlerini" : "alerjenini");

/**
 * contains → "Bu tarif profilindeki **Yer fıstığı** alerjenini içeriyor."
 * possible → "Bu tarif profilindeki **Hardal** alerjenini içerebilir."
 * both     → the contains sentence, then "**Hardal** alerjenini de içerebilir."
 */
export function allergenNoticeSentences(match: AllergenMatch): NoticeRun[][] {
  const sentences: NoticeRun[][] = [];
  if (match.contains.length > 0) {
    sentences.push([{ text: "Bu tarif profilindeki " }, ...labelRuns(match.contains),
      { text: ` ${allergenWord(match.contains.length)} içeriyor.` }]);
  }
  if (match.possible.length > 0) {
    sentences.push(match.contains.length > 0
      ? [...labelRuns(match.possible), { text: ` ${allergenWord(match.possible.length)} de içerebilir.` }]
      : [{ text: "Bu tarif profilindeki " }, ...labelRuns(match.possible),
        { text: ` ${allergenWord(match.possible.length)} içerebilir.` }]);
  }
  return sentences;
}

export const sentenceText = (runs: ReadonlyArray<NoticeRun>) => runs.map(run => run.text).join("");

/** Public, collapsed "Alerjen bilgisi": only when `contains` is non-empty. */
export function publicAllergenSummary(
  recipe: RecipeAllergens | null,
  options?: ReadonlyArray<AllergenOption> | null,
): { contains: string[]; possible: string[] } | null {
  if (!recipe || recipe.contains.length === 0) return null;
  return {
    contains: recipe.contains.map(key => allergenLabel(key, options)),
    possible: recipe.possible.map(key => allergenLabel(key, options)),
  };
}

/* ------------------------------------------------- AI generation outcomes */

function parseAllergenItems(raw: unknown): AllergenConflict[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (!isRecord(item) || typeof item.key !== "string" || !item.key) return [];
    const label = cleanText(item.label) || allergenLabel(item.key);
    const ingredients = Array.isArray(item.ingredients)
      ? item.ingredients.map(cleanText).filter(Boolean).slice(0, 12) : [];
    return [{ key: item.key, label, ingredients }];
  });
}

const CONFLICT_FALLBACK = "Bu tarif alerji listendeki malzemeler olmadan hazırlanamadı. Güvenliğin için tarifi göstermiyoruz; farklı bir istekle tekrar dene.";

/** POST /ai/generate 422: the recipe was refused, there is nothing to save. */
export class AllergenConflictError extends Error {
  code: "ai_allergen_conflict";
  conflicts: AllergenConflict[];
  constructor(message: string, conflicts: AllergenConflict[]) {
    super(message || CONFLICT_FALLBACK);
    this.name = "AllergenConflictError";
    this.code = "ai_allergen_conflict";
    this.conflicts = conflicts;
  }
}

/** The 422 body → an AllergenConflictError, or null for any other failure. */
export function allergenConflictFrom(status: number, payload: unknown): AllergenConflictError | null {
  if (!isRecord(payload) || payload.code !== "ai_allergen_conflict") return null;
  if (status !== 422 && payload.success !== false) return null;
  const message = cleanText(payload.message);
  return new AllergenConflictError(message, parseAllergenItems(payload.allergen_conflicts));
}

export function isAllergenConflict(error: unknown): error is AllergenConflictError {
  return error instanceof AllergenConflictError
    || (isRecord(error) && (error as { code?: unknown }).code === "ai_allergen_conflict"
      && Array.isArray((error as { conflicts?: unknown }).conflicts));
}

/** A successful generation's "possible" matches, shown before saving. */
export function allergenCautionsFrom(recipe: unknown): { warning: string; cautions: AllergenCaution[] } | null {
  if (!isRecord(recipe)) return null;
  const warning = cleanText(recipe.allergen_warning);
  const cautions = parseAllergenItems(recipe.allergen_cautions);
  if (!warning && cautions.length === 0) return null;
  return {
    warning: warning || "Bazı malzemeler alerji listendekileri içerebilir. Etiketini kontrol et; uyarılar etiket okumanın yerini tutmaz.",
    cautions,
  };
}
