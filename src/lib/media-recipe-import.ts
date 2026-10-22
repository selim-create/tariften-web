/**
 * Browser view model and transport for the three media recipe flows:
 *
 * - "Fotoğraftan tarif" (mode=dish): one dish photo -> AI Tahmini Tarif preview.
 * - "Defterden tarif" (mode=notebook): 1–4 notebook pages -> faithful transcription.
 * - "Kendi videondan tarif": the member's own MP4/MOV -> existing video job pipeline.
 *
 * Every call goes straight to the JWT-protected Tariften Core endpoint from the
 * browser (like large recipe image uploads), never through a Next.js Route
 * Handler: photos (4 × 8 MB) and videos (200 MB) are far above the serverless
 * request-body limit, and a preview may take up to ~60 seconds.
 *
 * Nothing here saves a recipe by itself. A preview is only saved after the
 * member reviews it and presses save; saved photo/notebook recipes are private
 * unless the member explicitly chooses "Herkese açık".
 *
 * This module has no runtime imports so it can be unit-tested offline.
 */

export const CORE_API = "https://api.tariften.com/wp-json/tariften/v1";
export const PHOTO_PREVIEW_URL = `${CORE_API}/ai/photo-recipe`;
export const PHOTO_SAVE_URL = `${CORE_API}/ai/photo-recipe/save`;
export const RECIPE_VISIBILITY_URL = `${CORE_API}/recipes/visibility`;
export const VIDEO_UPLOAD_URL = `${CORE_API}/ai/video-upload`;
export const RECIPE_LOOKUP_URL = `${CORE_API}/recipes/search`;

export type PhotoMode = "dish" | "notebook";
export type RecipeVisibility = "private" | "public";
export const DEFAULT_VISIBILITY: RecipeVisibility = "private";

/* ------------------------------------------------------------------ */
/* Photo selection                                                     */
/* ------------------------------------------------------------------ */

export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
export const PHOTO_NOTE_MAX = 300;
export const PHOTO_MAX_FILES: Readonly<Record<PhotoMode, number>> = { dish: 1, notebook: 4 };
/** Long edge the browser scales photos down to before upload (Core recommendation). */
export const PHOTO_TARGET_EDGE = 2500;

const PHOTO_TYPES: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heic",
};

type FileLike = { name: string; type: string; size: number };

function photoExtension(file: FileLike): string | null {
  if (Object.hasOwn(PHOTO_TYPES, file.type)) return PHOTO_TYPES[file.type];
  // Some browsers report HEIC photos with an empty MIME type.
  if (!file.type && /\.(heic|heif)$/i.test(file.name)) return "heic";
  return null;
}

export function validatePhotoFile(file: FileLike): string | null {
  if (!photoExtension(file)) return "JPG, PNG, WebP veya HEIC biçiminde bir fotoğraf seç.";
  if (file.size < 1) return "Fotoğraf okunamadı. Başka bir fotoğraf seç.";
  if (file.size > PHOTO_MAX_BYTES) return "Fotoğraf en fazla 8 MB olabilir.";
  return null;
}

/** Large phone photos are scaled down in the browser first, so picking allows more than 8 MB. */
export const PHOTO_PICK_MAX_BYTES = 40 * 1024 * 1024;
export function validatePhotoPick(file: FileLike): string | null {
  if (!photoExtension(file)) return "JPG, PNG, WebP veya HEIC biçiminde bir fotoğraf seç.";
  if (file.size < 1) return "Fotoğraf okunamadı. Başka bir fotoğraf seç.";
  if (file.size > PHOTO_PICK_MAX_BYTES) return "Bu fotoğraf çok büyük. Daha küçük bir fotoğraf seç.";
  return null;
}

export function validatePhotoSelection(mode: PhotoMode, files: readonly FileLike[]): string | null {
  if (files.length < 1) return mode === "dish" ? "Bir yemek fotoğrafı seç." : "En az bir defter sayfası ekle.";
  if (files.length > PHOTO_MAX_FILES[mode]) {
    return mode === "dish" ? "Yemek fotoğrafı için tek bir fotoğraf seç." : "En fazla 4 sayfa ekleyebilirsin.";
  }
  for (const file of files) {
    const invalid = validatePhotoFile(file);
    if (invalid) return invalid;
  }
  return null;
}

/** Notebook pages keep the member's order; these helpers never mutate the input. */
export function movePage<T>(pages: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= pages.length || to >= pages.length) return [...pages];
  const next = [...pages];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
export function removePage<T>(pages: readonly T[], index: number): T[] {
  return pages.filter((_, i) => i !== index);
}

/** ASCII transport name; Core detects the real type from the file contents. */
export function photoTransportName(mode: PhotoMode, index: number, file: FileLike): string {
  const ext = photoExtension(file) || "jpg";
  return mode === "dish" ? `yemek.${ext}` : `sayfa-${index + 1}.${ext}`;
}

export function buildPhotoPreviewForm(
  mode: PhotoMode,
  files: readonly (Blob & FileLike)[],
  note: string,
  keepCover = true,
): FormData {
  const invalid = validatePhotoSelection(mode, files);
  if (invalid) throw new Error(invalid);
  const trimmed = note.trim();
  if (trimmed.length > PHOTO_NOTE_MAX) throw new Error("Not en fazla 300 karakter olabilir.");
  const form = new FormData();
  form.append("mode", mode);
  files.forEach((file, index) => form.append("images[]", file, photoTransportName(mode, index, file)));
  if (trimmed) form.append("note", trimmed);
  if (mode === "dish") form.append("keep_cover", keepCover ? "1" : "0");
  return form;
}

/* ------------------------------------------------------------------ */
/* Photo preview parsing                                               */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const text = (v: unknown, limit = 2000): string =>
  typeof v === "string" ? v.trim().slice(0, limit)
    : typeof v === "number" && Number.isFinite(v) ? String(v) : "";
const strings = (v: unknown, max = 20, limit = 300): string[] =>
  Array.isArray(v) ? v.filter(isString).map(s => s.trim().slice(0, limit)).filter(Boolean).slice(0, max) : [];

export type UncertainItem = {
  field: "ingredients" | "steps";
  index: number;
  note: string;
};

export type AllergenHit = { key: string; label: string; ingredients: string[] };

export type PhotoPreview = {
  mode: PhotoMode;
  aiEstimated: boolean;
  label: string;
  detected: { dish: string; confidence: number; level: string; alternatives: string[] } | null;
  recipe: {
    title: string; excerpt: string; prep_time: string; cook_time: string; calories: string; servings: string;
    cuisine: string[]; meal_type: string[]; difficulty: string[]; diet: string[];
    ingredients: { name: string; amount: string; unit: string; uncertain: boolean; note: string; original_text: string; page: number | null }[];
    steps: string[];
    chef_tip: string;
    seo: { title: string; description: string; focus_keywords: string };
  };
  sourceNotes: string;
  assumptions: string[];
  uncertain: UncertainItem[];
  illegible: string[];
  warnings: string[];
  needsConfirmation: string[];
  allergens: { contains: string[]; possible: string[] };
  allergenConflicts: AllergenHit[];
  allergenCautions: AllergenHit[];
  allergenWarning: string;
  previewToken: string;
  expiresAt: string;
  pageCount: number;
  coverAvailable: boolean;
  defaultVisibility: RecipeVisibility;
  sourceKind: "photo" | "notebook";
};

function allergenHits(v: unknown): AllergenHit[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObject).map(hit => ({
    key: text(hit.key, 40),
    label: text(hit.label, 80) || text(hit.key, 40),
    ingredients: strings(hit.ingredients, 10, 120),
  })).filter(hit => hit.label).slice(0, 14);
}

export function parsePhotoPreview(value: unknown, expectedMode: PhotoMode): PhotoPreview {
  if (!isObject(value) || value.success !== true || value.mode !== expectedMode
    || value.generation_status !== "needs_review" || value.requires_approval !== true
    || !isObject(value.recipe) || !isString(value.preview_token) || !/^[A-Za-z0-9]{32}$/.test(value.preview_token)) {
    throw new Error("Önizleme sunucudan beklenen biçimde gelmedi. Yeniden deneyebilirsin.");
  }
  const r = value.recipe;
  if (!Array.isArray(r.ingredients) || !Array.isArray(r.steps)
    || r.ingredients.length > 40 || r.steps.length > 40) {
    throw new Error("Önizlemedeki tarif alanları eksik geldi.");
  }
  const ingredients = r.ingredients.filter(isObject).map(row => ({
    name: text(row.name, 120),
    amount: text(row.amount, 30),
    unit: text(row.unit, 45),
    uncertain: row.uncertain === true,
    note: text(row.note, 200),
    original_text: text(row.original_text, 200),
    page: Number.isInteger(row.page) && Number(row.page) >= 1 && Number(row.page) <= 4 ? Number(row.page) : null,
  }));
  const steps = r.steps.map(step => isString(step) ? step.trim().slice(0, 2000)
    : isObject(step) ? text(step.content ?? step.instruction, 2000) : "");
  const uncertain: UncertainItem[] = Array.isArray(value.uncertain)
    ? value.uncertain.filter(isObject).flatMap(item => {
      const field = item.field === "ingredients" || item.field === "steps" ? item.field : null;
      const index = Number(item.index);
      const size = field === "ingredients" ? ingredients.length : steps.length;
      return field && Number.isInteger(index) && index >= 0 && index < size
        ? [{ field, index, note: text(item.note, 200) }] : [];
    }) : [];
  // An ingredient flagged only inline still needs the member's attention.
  ingredients.forEach((row, index) => {
    if (row.uncertain && !uncertain.some(u => u.field === "ingredients" && u.index === index)) {
      uncertain.push({ field: "ingredients", index, note: row.note });
    }
  });
  const detected = isObject(value.detected) ? {
    dish: text(value.detected.dish, 110),
    confidence: Math.max(0, Math.min(1, Number(value.detected.confidence) || 0)),
    level: text(value.detected.confidence_level, 20),
    alternatives: strings(value.detected.alternatives, 3, 110),
  } : null;
  const seo = isObject(r.seo) ? r.seo : {};
  const keywords = Array.isArray(seo.focus_keywords) ? strings(seo.focus_keywords, 5, 60).join(", ") : text(seo.focus_keywords, 120);
  const allergens = isObject(value.allergens) ? value.allergens : {};
  return {
    mode: expectedMode,
    // The label is never hidden for a dish estimate, whatever a field says.
    aiEstimated: expectedMode === "dish" || value.ai_estimated === true,
    label: text(value.label, 40) || (expectedMode === "dish" ? "AI Tahmini Tarif" : ""),
    detected,
    recipe: {
      title: text(r.title, 180),
      excerpt: text(r.excerpt, 450),
      prep_time: text(r.prep_time, 4),
      cook_time: text(r.cook_time, 4),
      calories: text(r.calories, 4),
      servings: text(r.servings, 2),
      cuisine: strings(r.cuisine, 3, 80),
      meal_type: strings(r.meal_type, 3, 80),
      difficulty: strings(r.difficulty, 1, 40),
      diet: strings(r.diet, 6, 80),
      ingredients,
      steps,
      chef_tip: text(r.chef_tip, 650),
      seo: { title: text(seo.title, 70), description: text(seo.description, 170), focus_keywords: keywords },
    },
    sourceNotes: text(value.source_notes, 500),
    assumptions: strings(value.assumptions, 5, 200),
    uncertain,
    illegible: strings(value.illegible, 10, 200),
    warnings: strings(value.warnings, 20, 60),
    needsConfirmation: strings(value.needs_confirmation, 10, 60),
    allergens: { contains: strings(allergens.contains, 14, 40), possible: strings(allergens.possible, 14, 40) },
    allergenConflicts: allergenHits(value.allergen_conflicts),
    allergenCautions: allergenHits(value.allergen_cautions),
    allergenWarning: text(value.allergen_warning, 400),
    previewToken: value.preview_token,
    expiresAt: text(value.expires_at, 40),
    pageCount: Number.isInteger(value.page_count) ? Number(value.page_count) : 1,
    coverAvailable: expectedMode === "dish" && value.cover_available === true,
    // Private is the default even if a server field is missing or unexpected.
    defaultVisibility: value.default_visibility === "public" ? "public" : DEFAULT_VISIBILITY,
    sourceKind: expectedMode === "dish" ? "photo" : "notebook",
  };
}

/* ------------------------------------------------------------------ */
/* Editable state and confirmations                                    */
/* ------------------------------------------------------------------ */

export type PhotoEditorIngredient = {
  name: string; amount: string; unit: string;
  /** Flagged by Core as an uncertain reading; cleared once the member checks or edits it. */
  uncertain: boolean; note: string; original_text: string; page: number | null;
};
export type PhotoEditorStep = { content: string; uncertain: boolean; note: string };

export type PhotoEditor = {
  title: string; excerpt: string;
  servings: string; prepTime: string; cookTime: string; calories: string;
  cuisine: string; mealType: string; difficulty: string; diet: string[];
  ingredients: PhotoEditorIngredient[];
  steps: PhotoEditorStep[];
  chefTip: string;
  seoTitle: string; seoDescription: string; seoKeywords: string;
};

export function photoEditorFromPreview(p: PhotoPreview): PhotoEditor {
  const flagged = (field: UncertainItem["field"], index: number) =>
    p.uncertain.find(u => u.field === field && u.index === index);
  return {
    title: p.recipe.title,
    excerpt: p.recipe.excerpt,
    servings: p.recipe.servings,
    prepTime: p.recipe.prep_time,
    cookTime: p.recipe.cook_time,
    calories: p.recipe.calories,
    cuisine: p.recipe.cuisine[0] || "",
    mealType: p.recipe.meal_type[0] || "",
    difficulty: p.recipe.difficulty[0] || "",
    diet: [...p.recipe.diet],
    ingredients: p.recipe.ingredients.map((row, index) => {
      const mark = flagged("ingredients", index);
      return { ...row, uncertain: row.uncertain || !!mark, note: row.note || mark?.note || "" };
    }),
    steps: p.recipe.steps.map((content, index) => {
      const mark = flagged("steps", index);
      return { content, uncertain: !!mark, note: mark?.note || "" };
    }),
    chefTip: p.recipe.chef_tip,
    seoTitle: p.recipe.seo.title,
    seoDescription: p.recipe.seo.description,
    seoKeywords: p.recipe.seo.focus_keywords,
  };
}

/** What the member has confirmed on the review screen. */
export type PhotoConfirmations = {
  /** Low-confidence dish: the member confirmed (or picked) the dish name. */
  dish: boolean;
  /** Allergen conflict with the member's own profile was acknowledged. */
  allergens: boolean;
};

/** Messages for everything that still needs the member before save; empty = ready. */
export function pendingConfirmations(preview: PhotoPreview, editor: PhotoEditor, confirmed: PhotoConfirmations): string[] {
  const pending: string[] = [];
  const asked = new Set(preview.needsConfirmation);
  if (asked.has("dish") && !confirmed.dish) pending.push("Fotoğraftaki yemeğin doğru tanındığını onayla.");
  if ((asked.has("allergens") || preview.allergenConflicts.length > 0) && !confirmed.allergens) {
    pending.push("Alerjen uyarısını okuduğunu onayla.");
  }
  const ingredients = editor.ingredients.filter(i => i.uncertain).length;
  const steps = editor.steps.filter(s => s.uncertain).length;
  if (ingredients) pending.push(`${ingredients} belirsiz malzemeyi kontrol et.`);
  if (steps) pending.push(`${steps} belirsiz adımı kontrol et.`);
  return pending;
}

const POSITIVE = /^[1-9]\d*$/;

export function photoSaveValidation(editor: PhotoEditor): string | null {
  if (!editor.title.trim()) return "Tarifine bir isim ver.";
  if (editor.title.trim().length > 180) return "Tarif adı en fazla 180 karakter olabilir.";
  if (!editor.ingredients.length || editor.ingredients.some(i => !i.name.trim())) {
    return "En az bir malzeme ekle ve tüm malzeme adlarını tamamla.";
  }
  if (!editor.steps.length || editor.steps.some(s => !s.content.trim())) {
    return "En az bir hazırlanış adımı ekle ve tüm adımları tamamla.";
  }
  if (editor.ingredients.length > 40 || editor.steps.length > 40) return "En fazla 40 malzeme ve 40 adım eklenebilir.";
  // A notebook page may not state servings or times: they stay empty, never invented.
  if (editor.servings.trim() && (!POSITIVE.test(editor.servings.trim()) || Number(editor.servings) > 36)) {
    return "Kişi sayısı 1–36 arasında olmalı veya boş bırakılmalı.";
  }
  for (const [label, value] of [["Hazırlık süresi", editor.prepTime], ["Pişirme süresi", editor.cookTime]] as const) {
    if (value.trim() && (!POSITIVE.test(value.trim()) || Number(value) > 720)) return `${label} 1–720 dakika olmalı veya boş bırakılmalı.`;
  }
  if (editor.calories.trim() && (!POSITIVE.test(editor.calories.trim()) || Number(editor.calories) > 3000)) {
    return "Kalori 1–3000 arasında olmalı veya boş bırakılmalı.";
  }
  return null;
}

export type PhotoSaveOptions = {
  visibility: RecipeVisibility;
  useCover: boolean;
};

/**
 * Body for POST /ai/photo-recipe/save. Server-owned fields (image, ai_estimated,
 * source_kind, status, author) are never sent; visibility stays top-level.
 */
export function buildPhotoSavePayload(preview: PhotoPreview, editor: PhotoEditor, options: PhotoSaveOptions) {
  const invalid = photoSaveValidation(editor);
  if (invalid) throw new Error(invalid);
  const visibility: RecipeVisibility = options.visibility === "public" ? "public" : "private";
  return {
    preview_token: preview.previewToken,
    recipe: {
      title: editor.title.trim(),
      excerpt: editor.excerpt.trim(),
      prep_time: editor.prepTime.trim(),
      cook_time: editor.cookTime.trim(),
      servings: editor.servings.trim(),
      calories: editor.calories.trim(),
      cuisine: editor.cuisine.trim() ? [editor.cuisine.trim()] : [],
      meal_type: editor.mealType.trim() ? [editor.mealType.trim()] : [],
      difficulty: editor.difficulty.trim() ? [editor.difficulty.trim()] : [],
      diet: editor.diet.map(d => d.trim()).filter(Boolean),
      ingredients: editor.ingredients.map(i => ({ name: i.name.trim(), amount: i.amount.trim(), unit: i.unit.trim() })),
      steps: editor.steps.map(s => s.content.trim()),
      chef_tip: editor.chefTip.trim(),
      seo: {
        title: editor.seoTitle.trim() || editor.title.trim(),
        description: editor.seoDescription.trim() || editor.excerpt.trim(),
        focus_keywords: editor.seoKeywords.split(",").map(k => k.trim()).filter(Boolean).slice(0, 5).join(", "),
      },
    },
    visibility,
    use_photo_as_cover: preview.mode === "dish" && preview.coverAvailable && options.useCover === true,
  };
}

/* ------------------------------------------------------------------ */
/* Friendly errors                                                     */
/* ------------------------------------------------------------------ */

export type ApiFailure = { status: number; code: string; message: string };

const PHOTO_ERRORS: Readonly<Record<string, string>> = {
  photo_recipe_auth_required: "Devam etmek için yeniden giriş yap.",
  photo_recipe_unavailable: "Fotoğraftan tarif çok yakında burada. Şimdilik tarifini elle yazabilir ya da metinden aktarabilirsin.",
  photo_recipe_not_food: "Bu fotoğrafta bir yemek göremedik. Tabağın net göründüğü bir fotoğrafla tekrar dene.",
  photo_recipe_not_recipe_page: "Bu sayfada bir tarif bulamadık. Malzemelerin ve yapılışın göründüğü sayfayı çek.",
  photo_recipe_unreadable: "Sayfayı okuyamadık. Işığı bol bir yerde, sayfayı düz tutarak yeniden çek.",
  photo_recipe_image_too_large: "Fotoğraf en fazla 8 MB olabilir.",
  photo_recipe_payload_too_large: "Fotoğraflar birlikte çok büyük kaldı. Daha az sayfa ya da daha küçük fotoğraflarla dene.",
  photo_recipe_image_unsupported: "Bu dosya türünü açamadık. JPG, PNG veya WebP fotoğraf seç.",
  photo_recipe_heic_unsupported: "HEIC fotoğrafı açamadık. Telefonunda JPG olarak kaydedip yeniden seç.",
  photo_recipe_decode_failed: "Fotoğraf açılamadı. Başka bir fotoğraf seç.",
  photo_recipe_image_too_small: "Fotoğraf çok küçük. Daha büyük bir fotoğraf seç.",
  photo_recipe_invalid_output: "Bu fotoğraftan bir tarif çıkaramadık. Farklı bir fotoğrafla dene.",
  photo_recipe_timeout: "İnceleme beklediğimizden uzun sürdü. Birazdan yeniden deneyebilirsin; günlük hakkından kullanım düşmüş olabilir.",
  photo_recipe_preview_expired: "Önizlemenin süresi doldu. Fotoğrafı yeniden yükleyip tekrar dene.",
  photo_recipe_save_in_progress: "Tarifin zaten kaydediliyor. Birkaç saniye bekle.",
  photo_recipe_save_uncertain: "Kaydın tamamlanıp tamamlanmadığını doğrulayamadık. Tekrar kaydetmeden önce Tariflerim'e bak.",
  tariften_quota_exceeded: "Bugünkü yapay zekâ tarif hakkını kullandın. Yarın yeniden deneyebilirsin.",
  ai_budget_exceeded: "Tarif servisimiz şu an yoğun. Biraz sonra yeniden dene.",
  ai_rate_limited: "Çok kısa sürede birkaç deneme yaptın. Biraz bekleyip yeniden dene.",
  ai_upstream_error: "Tarif servisine şu an ulaşamıyoruz. Biraz sonra yeniden dene.",
};

export function photoErrorMessage(failure: ApiFailure): string {
  if (PHOTO_ERRORS[failure.code]) return PHOTO_ERRORS[failure.code];
  if (failure.status === 413) return "Fotoğraf en fazla 8 MB olabilir.";
  if (failure.status === 401 || failure.status === 403) return PHOTO_ERRORS.photo_recipe_auth_required;
  if (failure.status === 504) return PHOTO_ERRORS.photo_recipe_timeout;
  // Core messages are written for members in Turkish; keep them if they look human.
  if (failure.message && failure.message.length <= 240 && !/<|rest_|wp_|cURL/i.test(failure.message)) return failure.message;
  return "Bir şeyler ters gitti. Birazdan yeniden dene.";
}

/** 503 photo_recipe_unavailable means the feature flag is off: show "Yakında". */
export function isPhotoFeatureOff(failure: ApiFailure): boolean {
  return failure.code === "photo_recipe_unavailable" || failure.code === "rest_no_route";
}

async function readFailure(response: Response): Promise<ApiFailure> {
  const data: unknown = await response.json().catch(() => null);
  const body = isObject(data) ? data : {};
  return {
    status: response.status,
    code: isString(body.code) ? body.code : isObject(body.data) && isString(body.data.code) ? body.data.code : "",
    message: isString(body.message) ? body.message : "",
  };
}

export class MediaRecipeError extends Error {
  readonly failure: ApiFailure;
  constructor(failure: ApiFailure, message: string) {
    super(message);
    this.name = "MediaRecipeError";
    this.failure = failure;
  }
}

/* ------------------------------------------------------------------ */
/* Photo transport                                                     */
/* ------------------------------------------------------------------ */

/** Core asks clients to wait at least 130 s for gpt-4o vision previews. */
export const PHOTO_PREVIEW_TIMEOUT_MS = 135000;

export async function requestPhotoPreview(
  token: string, mode: PhotoMode, files: readonly (Blob & FileLike)[], note: string, keepCover = true,
  signal?: AbortSignal,
): Promise<PhotoPreview> {
  const body = buildPhotoPreviewForm(mode, files, note, keepCover);
  let response: Response;
  try {
    response = await fetch(PHOTO_PREVIEW_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body,
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(PHOTO_PREVIEW_TIMEOUT_MS),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    const failure = { status: 0, code: "network", message: "" };
    throw new MediaRecipeError(failure, (cause instanceof Error && cause.name === "TimeoutError")
      ? PHOTO_ERRORS.photo_recipe_timeout
      : "Fotoğraf gönderilemedi. İnternet bağlantını kontrol edip yeniden dene.");
  }
  if (!response.ok) {
    const failure = await readFailure(response);
    throw new MediaRecipeError(failure, photoErrorMessage(failure));
  }
  return parsePhotoPreview(await response.json().catch(() => null), mode);
}

export type PhotoSaveResult = { id: number; slug: string; visibility: RecipeVisibility; coverAttached: boolean };

export async function savePhotoRecipe(
  token: string, payload: ReturnType<typeof buildPhotoSavePayload>,
): Promise<PhotoSaveResult> {
  let response: Response;
  try {
    response = await fetch(PHOTO_SAVE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new MediaRecipeError({ status: 0, code: "photo_recipe_save_uncertain", message: "" }, PHOTO_ERRORS.photo_recipe_save_uncertain);
  }
  if (!response.ok) {
    const failure = await readFailure(response);
    throw new MediaRecipeError(failure, photoErrorMessage(failure));
  }
  const data: unknown = await response.json().catch(() => null);
  if (!isObject(data) || data.success !== true || !Number.isSafeInteger(data.id) || Number(data.id) < 1) {
    throw new MediaRecipeError({ status: 502, code: "photo_recipe_save_uncertain", message: "" }, PHOTO_ERRORS.photo_recipe_save_uncertain);
  }
  return {
    id: Number(data.id),
    slug: isString(data.slug) ? data.slug : "",
    visibility: data.visibility === "public" ? "public" : "private",
    coverAttached: data.cover_attached === true,
  };
}

/**
 * Free availability check: the save endpoint answers 503 photo_recipe_unavailable
 * when the feature is off and 400 photo_recipe_save_invalid for an empty body
 * when it is on. Neither path writes anything or uses a quota.
 */
export async function checkPhotoRecipeAvailable(token: string, signal?: AbortSignal): Promise<"available" | "off" | "unknown"> {
  try {
    const response = await fetch(PHOTO_SAVE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
      cache: "no-store",
      signal: signal ?? AbortSignal.timeout(10000),
    });
    if (response.status === 400) return "available";
    const failure = await readFailure(response);
    return isPhotoFeatureOff(failure) ? "off" : "unknown";
  } catch {
    return "unknown";
  }
}

/* ------------------------------------------------------------------ */
/* Visibility and badges                                               */
/* ------------------------------------------------------------------ */

export function buildVisibilityRequest(token: string, id: number, visibility: RecipeVisibility): { url: string; init: RequestInit } {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Geçersiz tarif.");
  if (visibility !== "private" && visibility !== "public") throw new Error("Geçersiz görünürlük.");
  return {
    url: RECIPE_VISIBILITY_URL,
    init: {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id, visibility }),
      cache: "no-store",
    },
  };
}

const VISIBILITY_ERRORS: Readonly<Record<string, string>> = {
  recipe_visibility_not_found: "Bu tarifi bulamadık.",
  recipe_visibility_unsupported: "Bu tarifin görünürlüğü buradan değiştirilemez.",
  recipe_visibility_invalid: "Görünürlük değiştirilemedi.",
};

export async function setRecipeVisibility(token: string, id: number, visibility: RecipeVisibility): Promise<RecipeVisibility> {
  const { url, init } = buildVisibilityRequest(token, id, visibility);
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  } catch {
    throw new Error("Görünürlük değiştirilemedi. İnternet bağlantını kontrol et.");
  }
  if (!response.ok) {
    const failure = await readFailure(response);
    throw new Error(VISIBILITY_ERRORS[failure.code] || (failure.status === 401 ? "Yeniden giriş yapmalısın." : "Görünürlük değiştirilemedi. Birazdan yeniden dene."));
  }
  const data: unknown = await response.json().catch(() => null);
  if (!isObject(data) || data.success !== true || (data.visibility !== "public" && data.visibility !== "private")) {
    throw new Error("Görünürlük yanıtı doğrulanamadı. Sayfayı yenileyip kontrol et.");
  }
  return data.visibility;
}

type BadgeRecipe = { ai_estimated?: unknown; visibility?: unknown; source_kind?: unknown; author?: { id?: unknown } | null };

export type RecipeBadgeState = {
  /** "AI Tahmini Tarif" — shown to everyone. */
  aiEstimated: boolean;
  /** "Sadece sen görüyorsun" — the private recipe's owner only. */
  privateForOwner: boolean;
  /** The owner may switch public/private (photo and notebook recipes only). */
  canToggleVisibility: boolean;
  visibility: RecipeVisibility;
};

export function recipeBadgeState(recipe: BadgeRecipe, viewerId?: number | null): RecipeBadgeState {
  const owner = Number(recipe.author?.id);
  const isOwner = !!viewerId && Number.isSafeInteger(owner) && owner > 0 && owner === Number(viewerId);
  const visibility: RecipeVisibility = recipe.visibility === "private" ? "private" : "public";
  return {
    aiEstimated: recipe.ai_estimated === true,
    privateForOwner: isOwner && visibility === "private",
    canToggleVisibility: isOwner && (recipe.source_kind === "photo" || recipe.source_kind === "notebook"),
    visibility,
  };
}

/** Owner-scoped lookup for a recipe the public server render could not see. */
export function buildOwnerRecipeLookup(token: string, slug: string): { url: string; init: RequestInit } | null {
  const value = slug.trim();
  if (!token || !value || value.length > 200) return null;
  const query = /^[1-9]\d*$/.test(value) ? `id=${encodeURIComponent(value)}` : `slug=${encodeURIComponent(value)}`;
  return {
    url: `${RECIPE_LOOKUP_URL}?${query}`,
    // Private recipes must never be cached: always the member's token, never ISR/CDN.
    init: { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" },
  };
}

/**
 * Reads one recipe with the member's token (Core returns private recipes only
 * to their owner). Returns the raw API row, or null when it is not visible.
 */
export async function fetchOwnerRecipe<T = Record<string, unknown>>(token: string, slug: string, signal?: AbortSignal): Promise<T | null> {
  const request = buildOwnerRecipeLookup(token, slug);
  if (!request) return null;
  const response = await fetch(request.url, { ...request.init, signal });
  if (!response.ok) return null;
  const data: unknown = await response.json().catch(() => null);
  if (!isObject(data) || !Array.isArray(data.data) || !isObject(data.data[0])) return null;
  return data.data[0] as T;
}

/* ------------------------------------------------------------------ */
/* Own video upload                                                    */
/* ------------------------------------------------------------------ */

export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;
export const VIDEO_MAX_SECONDS = 180;
export const VIDEO_NOTE_MAX = 1000;

export function validateVideoFile(file: FileLike): string | null {
  const byType = file.type === "video/mp4" || file.type === "video/quicktime";
  const byName = /\.(mp4|mov|m4v)$/i.test(file.name);
  if (!byType && !(file.type === "" && byName)) return "Yalnızca MP4 veya MOV videoları yükleyebilirsin.";
  if (file.size < 1) return "Video okunamadı. Başka bir video seç.";
  if (file.size > VIDEO_MAX_BYTES) return "Video en fazla 200 MB olabilir.";
  return null;
}

/**
 * Duration from the browser's <video> metadata. Some browsers cannot decode
 * HEVC/MOV metadata; an unknown duration is not blocked here because Core
 * checks the length itself before any paid work starts.
 */
export function validateVideoDuration(seconds: number | null | undefined): string | null {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) return null;
  // Container rounding: 3:00.4 still counts as three minutes.
  if (seconds > VIDEO_MAX_SECONDS + 0.5) return "Video en fazla 3 dakika olabilir.";
  return null;
}

export function isKnownDuration(seconds: number | null | undefined): seconds is number {
  return typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0;
}

export function formatDuration(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("tr-TR")} KB`;
}

export function isRequestId(value: string): boolean {
  return /^[A-Za-z0-9-]{16,80}$/.test(value);
}

export function buildVideoUploadForm(file: Blob & FileLike, note: string, requestId: string): FormData {
  const invalid = validateVideoFile(file);
  if (invalid) throw new Error(invalid);
  if (!isRequestId(requestId)) throw new Error("İstek kimliği geçersiz.");
  const trimmed = note.trim();
  if (trimmed.length > VIDEO_NOTE_MAX) throw new Error("Not en fazla 1000 karakter olabilir.");
  const form = new FormData();
  const ext = file.type === "video/quicktime" || /\.mov$/i.test(file.name) ? "mov" : "mp4";
  form.append("video", file, `video.${ext}`);
  if (trimmed) form.append("note", trimmed);
  form.append("request_id", requestId);
  return form;
}

const VIDEO_ERRORS: Readonly<Record<string, string>> = {
  video_upload_auth_required: "Video yüklemek için yeniden giriş yap.",
  video_upload_too_large: "Video en fazla 200 MB olabilir.",
  video_upload_type: "Yalnızca MP4 veya MOV videoları yükleyebilirsin.",
  video_upload_codec: "Bu videonun biçimini açamadık. Telefonunun kamerasıyla çekilmiş bir MP4/MOV video seç.",
  video_upload_too_long: "Video en fazla 3 dakika olabilir.",
  video_upload_invalid: "Video okunamadı. Başka bir video seç.",
  video_upload_no_video: "Bu dosyada görüntü bulamadık. Başka bir video seç.",
  video_upload_busy: "Şu anda işlenen iki videon var. Biri bitince yenisini yükleyebilirsin.",
  video_upload_unavailable: "Kendi videondan tarif çok yakında burada.",
  video_upload_worker_offline: "Video işleme servisimiz şu an yeni video kabul etmiyor. Hakkından bir şey düşmedi; biraz sonra yeniden dene.",
  video_upload_storage: "Videon kaydedilemedi. Biraz sonra yeniden dene.",
  video_job_storage: "Videon kaydedilemedi. Biraz sonra yeniden dene.",
  video_upload_failed: "Yükleme yarıda kaldı. Yeniden dene.",
  video_upload_missing: "Video sunucuya ulaşmadı. Yeniden dene.",
  video_upload_note_too_long: "Not en fazla 1000 karakter olabilir.",
  video_job_request_conflict: "Bu yükleme tanınmadı. Videoyu yeniden seçip tekrar dene.",
  tariften_quota_exceeded: "Bugünkü yapay zekâ tarif hakkını kullandın.",
};

export function videoUploadErrorMessage(failure: ApiFailure): string {
  if (VIDEO_ERRORS[failure.code]) return VIDEO_ERRORS[failure.code];
  // A web server/proxy limit can answer 413 before WordPress (HTML, no code).
  if (failure.status === 413) return VIDEO_ERRORS.video_upload_too_large;
  if (failure.status === 401 || failure.status === 403) return VIDEO_ERRORS.video_upload_auth_required;
  if (failure.status === 429) return "Kısa sürede çok fazla deneme yaptın. Biraz bekleyip yeniden dene.";
  if (failure.message && failure.message.length <= 240 && !/<|rest_|wp_/i.test(failure.message)) return failure.message;
  return "Video yüklenemedi. Biraz sonra yeniden dene.";
}

export type VideoUploadAccepted = { jobId: number; status: string; message: string; errorCode: string };

export function parseVideoUploadResponse(value: unknown): VideoUploadAccepted {
  if (!isObject(value) || value.success !== true) throw new Error("Yükleme yanıtı doğrulanamadı.");
  const id = Number(value.job_id ?? value.id);
  if (!Number.isSafeInteger(id) || id < 1 || !isString(value.status)) throw new Error("Yükleme yanıtı doğrulanamadı.");
  return {
    jobId: id,
    status: value.status,
    message: isString(value.message) ? value.message : "",
    errorCode: isString(value.error_code) ? value.error_code : "",
  };
}

type XhrLike = {
  open(method: string, url: string): void;
  setRequestHeader(name: string, value: string): void;
  send(body: FormData): void;
  abort(): void;
  status: number;
  responseText: string;
  timeout: number;
  upload: { onprogress: ((event: { lengthComputable: boolean; loaded: number; total: number }) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  onabort: (() => void) | null;
};

/**
 * Multipart upload with progress (fetch has no upload progress). The caller
 * keeps the same request_id for every retry of the same file: Core then returns
 * the existing job instead of storing a second file or using a second quota.
 */
export function uploadOwnVideo(options: {
  token: string; file: Blob & FileLike; note: string; requestId: string;
  onProgress?: (fraction: number) => void; signal?: AbortSignal;
}): Promise<VideoUploadAccepted> {
  const body = buildVideoUploadForm(options.file, options.note, options.requestId);
  return new Promise((resolve, reject) => {
    const Xhr = (globalThis as unknown as { XMLHttpRequest: new () => XhrLike }).XMLHttpRequest;
    const xhr = new Xhr();
    xhr.open("POST", VIDEO_UPLOAD_URL);
    xhr.setRequestHeader("Authorization", `Bearer ${options.token}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.timeout = 15 * 60 * 1000;
    xhr.upload.onprogress = event => {
      if (event.lengthComputable && event.total > 0) options.onProgress?.(Math.min(1, event.loaded / event.total));
    };
    const failUnknown = (message: string) => reject(new MediaRecipeError({ status: 0, code: "network", message: "" }, message));
    xhr.onerror = () => failUnknown("Bağlantı koptu. Aynı videoyla yeniden denersen ikinci kez hak düşmez.");
    xhr.ontimeout = () => failUnknown("Yükleme çok uzun sürdü. Aynı videoyla yeniden denersen ikinci kez hak düşmez.");
    xhr.onabort = () => reject(new MediaRecipeError({ status: 0, code: "aborted", message: "" }, "Yükleme iptal edildi."));
    xhr.onload = () => {
      let data: unknown = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* HTML 413 from a proxy, etc. */ }
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(parseVideoUploadResponse(data)); } catch (error) { reject(error); }
        return;
      }
      const raw = isObject(data) ? data : {};
      const failure = { status: xhr.status, code: isString(raw.code) ? raw.code : "", message: isString(raw.message) ? raw.message : "" };
      reject(new MediaRecipeError(failure, videoUploadErrorMessage(failure)));
    };
    if (options.signal) {
      if (options.signal.aborted) { reject(new MediaRecipeError({ status: 0, code: "aborted", message: "" }, "Yükleme iptal edildi.")); return; }
      options.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(body);
  });
}

/** Own-upload job references are opaque ids ("upload:<hex>"), never links. */
export function isUploadSourceUrl(value: unknown): boolean {
  return typeof value === "string" && /^upload:[A-Za-z0-9]{8,64}$/.test(value);
}
