/**
 * Personal recipe notes ("Notum" / "Notlarım", Core 1.0.59 · P11,
 * docs/RECIPE_NOTES.md). A member's note is private: it is fetched only in
 * the browser with the member's JWT through a same-origin, no-store route,
 * never during server rendering, never with ISR and never cached locally.
 *
 * No imports on purpose: scripts/check-recipe-notes-household-web.test.cjs
 * transpiles and runs this module directly.
 */

export const NOTE_MAX_LENGTH = 2000;
export const NOTES_PER_PAGE = 20;

/** Same-origin routes (src/app/api/account/recipe-notes) → Core tariften/v1. */
export const NOTES_ENDPOINT = "/api/account/recipe-notes";

export type RecipeNote = {
  recipeId: number;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteListItem = {
  recipeId: number;
  available: boolean;
  slug: string | null;
  title: string | null;
  image: string | null;
  excerpt: string;
  updatedAt: string;
};

export type NotesPage = { notes: NoteListItem[]; page: number; perPage: number; total: number; pages: number };

/* ---------------------------------------------------------------- helpers */

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const positiveInt = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;

/** Characters as Core counts them (mb_strlen): Turkish letters and emoji count once. */
export function noteLength(value: string): number {
  return [...value].length;
}

/** What Core would store: CRLF → LF, trimmed. Used for the counter limit check. */
export function normalizeNoteInput(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function isNoteTooLong(value: string): boolean {
  return noteLength(normalizeNoteInput(value)) > NOTE_MAX_LENGTH;
}

export function isValidRecipeId(id: unknown): id is number {
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0;
}

export function formatNoteDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/** "45 saniye", "3 dakika", "1 saat 5 dakika" for 429 retry_after. */
export function formatRetryAfter(seconds: number): string {
  const total = Math.max(1, Math.ceil(Number.isFinite(seconds) ? seconds : 60));
  if (total < 60) return `${total} saniye`;
  const minutes = Math.ceil(total / 60);
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} saat ${rest} dakika` : `${hours} saat`;
}

/* ---------------------------------------------------------------- parsing */

export function parseNote(raw: unknown): RecipeNote | null {
  if (!isRecord(raw) || typeof raw.note !== "string") return null;
  return {
    recipeId: positiveInt(raw.recipe_id, 0),
    note: raw.note,
    createdAt: text(raw.created_at),
    updatedAt: text(raw.updated_at),
  };
}

const httpsOrNull = (value: unknown): string | null =>
  typeof value === "string" && /^https:\/\//i.test(value) ? value : null;

export function parseNoteListItem(raw: unknown): NoteListItem | null {
  if (!isRecord(raw) || !isValidRecipeId(raw.recipe_id)) return null;
  const available = raw.available === true && typeof raw.slug === "string" && raw.slug !== "";
  return {
    recipeId: raw.recipe_id,
    available,
    slug: available ? (raw.slug as string) : null,
    title: available ? text(raw.title) || null : null,
    image: available ? httpsOrNull(raw.image) : null,
    excerpt: text(raw.note_excerpt),
    updatedAt: text(raw.updated_at),
  };
}

export function parseNotesPage(raw: unknown): NotesPage {
  if (!isRecord(raw) || !Array.isArray(raw.notes)) throw new RecipeNoteError("Notların alınamadı.", 502);
  const notes = raw.notes.flatMap(item => { const parsed = parseNoteListItem(item); return parsed ? [parsed] : []; });
  return {
    notes,
    page: positiveInt(raw.page, 1),
    perPage: positiveInt(raw.per_page, NOTES_PER_PAGE),
    total: typeof raw.total === "number" && raw.total >= 0 ? raw.total : notes.length,
    pages: typeof raw.pages === "number" && raw.pages >= 0 ? raw.pages : 1,
  };
}

/* ----------------------------------------------------------------- errors */

export class RecipeNoteError extends Error {
  status: number;
  code: string;
  retryAfter: number | null;
  constructor(message: string, status = 0, code = "", retryAfter: number | null = null) {
    super(message);
    this.name = "RecipeNoteError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** WordPress error body → Turkish message. Core's own message is preferred. */
export function noteErrorFrom(status: number, payload: unknown): RecipeNoteError {
  const data = isRecord(payload) ? payload : {};
  const code = text(data.code);
  const inner = isRecord(data.data) ? data.data : {};
  const raw = text(data.message).trim();
  const coreMessage = raw && !/<\/?[a-z][\s\S]*>/i.test(raw) ? raw : "";

  if (status === 401) {
    return new RecipeNoteError("Oturumunun süresi dolmuş. Notunu görmek için yeniden giriş yap.", 401, code);
  }
  if (status === 429) {
    const retry = typeof inner.retry_after === "number" && inner.retry_after > 0 ? inner.retry_after : null;
    const wait = retry ? ` ${formatRetryAfter(retry)} sonra tekrar dene.` : " Biraz sonra tekrar dene.";
    return new RecipeNoteError(`Kısa sürede çok fazla not kaydettin.${wait}`, 429, code, retry);
  }
  if (status === 400 && code === "recipe_note_too_long") {
    const max = typeof inner.max_length === "number" ? inner.max_length : NOTE_MAX_LENGTH;
    return new RecipeNoteError(coreMessage || `Not en fazla ${max.toLocaleString("tr-TR")} karakter olabilir.`, 400, code);
  }
  if (status === 409) {
    return new RecipeNoteError(coreMessage || "Not sınırına ulaştın. Yeni not eklemek için eski notlarından birini sil.", 409, code);
  }
  if (status === 404) {
    return new RecipeNoteError(coreMessage || "Bu tarif bulunamadı.", 404, code);
  }
  return new RecipeNoteError(coreMessage || "Not şu anda kaydedilemedi. Biraz sonra tekrar dene.", status, code);
}

/* -------------------------------------------------------------- transport */

type Method = "GET" | "PUT" | "DELETE";

async function call(token: string, method: Method, url: string, body?: unknown): Promise<Record<string, unknown>> {
  if (!token) throw new RecipeNoteError("Not eklemek için giriş yapmalısın.", 401);
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined
        ? { Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new RecipeNoteError("Bağlantı kurulamadı. İnternet bağlantını kontrol et.");
  }
  let payload: unknown = null;
  try { payload = await res.json(); } catch { /* handled below */ }
  if (!res.ok || !isRecord(payload) || payload.success !== true) {
    throw noteErrorFrom(res.ok ? 502 : res.status, payload);
  }
  return payload;
}

export function noteUrl(recipeId: number): string {
  if (!isValidRecipeId(recipeId)) throw new RecipeNoteError("Tarif numarası geçersiz.", 400);
  return `${NOTES_ENDPOINT}/${recipeId}`;
}

export function notesListUrl(page: number, perPage = NOTES_PER_PAGE): string {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePer = Number.isInteger(perPage) && perPage > 0 ? Math.min(perPage, 50) : NOTES_PER_PAGE;
  return `${NOTES_ENDPOINT}?page=${safePage}&per_page=${safePer}`;
}

/** GET /recipes/{id}/my-note — null when the member has no note (200, note: null). */
export async function getMyNote(token: string, recipeId: number): Promise<RecipeNote | null> {
  const data = await call(token, "GET", noteUrl(recipeId));
  return parseNote(data.note);
}

/** DELETE /recipes/{id}/my-note — idempotent. */
export async function deleteMyNote(token: string, recipeId: number): Promise<void> {
  await call(token, "DELETE", noteUrl(recipeId));
}

/**
 * PUT /recipes/{id}/my-note. An empty (or whitespace-only) text deletes the
 * note instead and resolves null. Show the returned note: Core cleans it.
 */
export async function saveMyNote(token: string, recipeId: number, value: string): Promise<RecipeNote | null> {
  if (normalizeNoteInput(value) === "") {
    await deleteMyNote(token, recipeId);
    return null;
  }
  if (isNoteTooLong(value)) {
    throw new RecipeNoteError(`Not en fazla ${NOTE_MAX_LENGTH.toLocaleString("tr-TR")} karakter olabilir.`, 400, "recipe_note_too_long");
  }
  const data = await call(token, "PUT", noteUrl(recipeId), { note: value });
  return parseNote(data.note);
}

/** GET /me/notes — newest first. */
export async function listMyNotes(token: string, page = 1, perPage = NOTES_PER_PAGE): Promise<NotesPage> {
  return parseNotesPage(await call(token, "GET", notesListUrl(page, perPage)));
}
