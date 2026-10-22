/**
 * Reporting content and blocking members (Core 1.0.67, App Store 1.2 UGC).
 * Contract: POST /tariften/v1/reports, GET/POST /tariften/v1/me/blocks,
 * DELETE /tariften/v1/me/blocks/{user_id}. Member-only, JWT Bearer, always
 * through the same-origin no-store routes in src/app/api/account/{reports,blocks}.
 *
 * Many pages are rendered and cached without a token, so the browser keeps
 * the member's block list in memory (src/context/SafetyContext.tsx) and hides
 * blocked authors' recipe cards and comments itself with the helpers below.
 *
 * No imports on purpose: scripts/check-ugc-report-block-web.test.cjs
 * transpiles and runs this module directly.
 */

/* ---------------------------------------------------------------- reasons */

/** Contract order and Turkish labels. Never reorder: clients must match. */
export const REPORT_REASONS = [
  { key: "spam", label: "Spam veya reklam" },
  { key: "offensive", label: "Hakaret veya taciz" },
  { key: "hate", label: "Nefret söylemi" },
  { key: "sexual", label: "Cinsel içerik" },
  { key: "violence", label: "Şiddet" },
  { key: "dangerous", label: "Tehlikeli veya sağlığa zararlı" },
  { key: "copyright", label: "Telif hakkı ihlali" },
  { key: "misinformation", label: "Yanlış veya yanıltıcı bilgi" },
  { key: "other", label: "Diğer" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["key"];
export type ReportTargetType = "recipe" | "comment" | "user";

export const REPORT_TARGET_TYPES: readonly ReportTargetType[] = ["recipe", "comment", "user"];
export const REPORT_DETAILS_MAX = 1000;
export const REPORT_OTHER_MIN = 10;

/** The community account deleted members' recipes move to; it cannot be blocked. */
export const COMMUNITY_AUTHOR_NAME = "Tariften Topluluğu";

/** Same-origin routes → Core tariften/v1. */
export const REPORTS_ENDPOINT = "/api/account/reports";
export const BLOCKS_ENDPOINT = "/api/account/blocks";
/** Where "Engellenen üyeler" lives on the web (Hesap ayarları). */
export const BLOCKED_MEMBERS_HREF = "/profile/edit#engellenen-uyeler";

export function isReportReason(value: unknown): value is ReportReason {
  return typeof value === "string" && REPORT_REASONS.some(r => r.key === value);
}

export function reportReasonLabel(key: string): string {
  return REPORT_REASONS.find(r => r.key === key)?.label || "";
}

/** Characters as Core counts them (mb_strlen). */
export function charCount(value: string): number {
  return [...value].length;
}

/**
 * Client-side mirror of Core's rules so the member hears about a problem
 * before sending. Returns a Turkish message, or null when the report is valid.
 */
export function reportDetailsError(reason: string, details: string): string | null {
  if (!isReportReason(reason)) return "Bir neden seç.";
  const text = details.trim();
  if (charCount(text) > REPORT_DETAILS_MAX) return `Açıklama en fazla ${REPORT_DETAILS_MAX.toLocaleString("tr-TR")} karakter olabilir.`;
  if (reason === "other" && charCount(text) < REPORT_OTHER_MIN) return `"Diğer" için kısaca ne olduğunu yaz (en az ${REPORT_OTHER_MIN} karakter).`;
  return null;
}

/* ------------------------------------------------------------------ copy */

/** Turkish accusative suffix with vowel harmony: Selim'i, Burak'ı, Ayşe'yi, Onur'u, Gül'ü. */
export function accusativeName(name: string): string | null {
  const clean = name.trim().replace(/\s+/g, " ");
  if (!clean) return null;
  const lower = clean.toLocaleLowerCase("tr-TR");
  const vowels = lower.match(/[aeıioöuü]/g);
  if (!vowels || !/[a-zçğıöşüâîû]$/i.test(lower)) return null;
  const last = vowels[vowels.length - 1];
  const suffix = "aı".includes(last) ? "ı" : "ei".includes(last) ? "i" : "ou".includes(last) ? "u" : "ü";
  const buffer = /[aeıioöuüâîû]$/.test(lower) ? "y" : "";
  return `${clean}'${buffer}${suffix}`;
}

/** Menu item: "<Ad>'ı engelle" with the right suffix, or a neutral fallback. */
export function blockActionLabel(name: string): string {
  const acc = accusativeName(name);
  return acc ? `${acc} engelle` : "Bu üyeyi engelle";
}

/** Contract confirmation text, verbatim. */
export function blockConfirmText(name: string): string {
  const who = name.trim() || "Bu üye";
  return `${who} engellensin mi? Tariflerini ve yorumlarını artık görmeyeceksin. İstediğin zaman Ayarlar'dan kaldırabilirsin.`;
}

/** The same text as dialog heading ("<Ad> engellensin mi?") and body. */
export function blockConfirmParts(name: string): { title: string; body: string } {
  const full = blockConfirmText(name);
  const title = `${name.trim() || "Bu üye"} engellensin mi?`;
  return { title, body: full.slice(title.length + 1) };
}

export const BLOCKED_PLACEHOLDER_TITLE = "Bu üyeyi engelledin.";

/* ------------------------------------------------------------- filtering */

export type BlockedMember = { userId: number; name: string; avatar: string; blockedAt: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** A positive member id from API data (WordPress sends post_author as a string). */
export function memberId(value: unknown): number {
  const n = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value) : value;
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : 0;
}

type AuthoredRecipe = { author_id?: unknown; author?: { id?: unknown } | null };
type AuthoredComment = { id?: unknown; author?: { id?: unknown } | null };

/** `author.id`, else `author_id`; 0 when unknown. */
export function recipeAuthorId(recipe: AuthoredRecipe | null | undefined): number {
  if (!recipe) return 0;
  return memberId(recipe.author?.id) || memberId(recipe.author_id);
}

export function commentAuthorId(comment: AuthoredComment | null | undefined): number {
  return comment ? memberId(comment.author?.id) : 0;
}

export type BlockedIds = { has(id: number): boolean };

export function isAuthorBlocked(authorId: unknown, blocked: BlockedIds): boolean {
  const id = memberId(authorId);
  return id > 0 && blocked.has(id);
}

export function filterBlockedRecipes<T extends AuthoredRecipe>(recipes: readonly T[], blocked: BlockedIds): T[] {
  return recipes.filter(r => !isAuthorBlocked(recipeAuthorId(r), blocked));
}

/** Leaves out comments by blocked members and comments this member reported. */
export function filterVisibleComments<T extends AuthoredComment>(
  comments: readonly T[], blocked: BlockedIds, reported: BlockedIds = new Set<number>(),
): T[] {
  return comments.filter(c => !isAuthorBlocked(commentAuthorId(c), blocked) && !reported.has(memberId(c.id)));
}

/**
 * Recipe detail: "placeholder" when the author is blocked (Core's
 * `author_blocked: true` or the local list) and the member has not chosen
 * "Yine de göster"; otherwise "show".
 */
export function recipeBlockView(
  recipe: AuthoredRecipe & { author_blocked?: unknown }, blocked: BlockedIds, revealed: boolean,
): "placeholder" | "show" {
  if (revealed) return "show";
  return recipe.author_blocked === true || isAuthorBlocked(recipeAuthorId(recipe), blocked) ? "placeholder" : "show";
}

/**
 * Whether to offer "engelle" for this author: a real member who is not the
 * viewer and not the community account. Staff accounts look like members in
 * the payload; Core answers 403 block_not_allowed for them.
 */
export function canOfferBlock(author: { id?: unknown; name?: unknown } | null | undefined, viewerId: unknown): boolean {
  const id = memberId(author?.id);
  if (!id || id === memberId(viewerId)) return false;
  return text(author?.name).trim() !== COMMUNITY_AUTHOR_NAME;
}

/** The ⋯ menu shows only on content the viewer did not write. */
export function isOwnContent(authorId: unknown, viewerId: unknown): boolean {
  const a = memberId(authorId);
  return a > 0 && a === memberId(viewerId);
}

export function formatBlockDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso.includes("T") || iso.includes("Z") ? iso : iso.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

/** "45 saniye", "3 dakika", "2 saat" for 429 retry_after. */
export function formatRetryAfter(seconds: number): string {
  const total = Math.max(1, Math.ceil(Number.isFinite(seconds) ? seconds : 60));
  if (total < 60) return `${total} saniye`;
  const minutes = Math.ceil(total / 60);
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} saat ${rest} dakika` : `${hours} saat`;
}

/* ---------------------------------------------------------------- errors */

export class SafetyError extends Error {
  status: number;
  code: string;
  retryAfter: number | null;
  constructor(message: string, status = 0, code = "", retryAfter: number | null = null) {
    super(message);
    this.name = "SafetyError";
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

/** WordPress error body → Turkish message for the report and block flows. */
export function safetyErrorFrom(status: number, payload: unknown, action: "report" | "block" | "unblock" | "list"): SafetyError {
  const data = isRecord(payload) ? payload : {};
  const code = text(data.code);
  const inner = isRecord(data.data) ? data.data : {};
  const raw = text(data.message).trim();
  const core = raw && !/<\/?[a-z][\s\S]*>/i.test(raw) ? raw : "";
  const retryRaw = typeof data.retry_after === "number" ? data.retry_after : inner.retry_after;
  const retry = typeof retryRaw === "number" && retryRaw > 0 ? retryRaw : null;

  if (status === 401) return new SafetyError("Oturumunun süresi dolmuş. Yeniden giriş yapıp tekrar dene.", 401, code);
  if (code === "report_rate_limited" || (action === "report" && status === 429)) {
    const wait = retry ? ` ${formatRetryAfter(retry)} sonra tekrar dene.` : " Yarın tekrar deneyebilirsin.";
    return new SafetyError(`Bugün çok fazla bildirim gönderdin.${wait}`, 429, code || "report_rate_limited", retry);
  }
  if (code === "report_target_not_found" || (action === "report" && status === 404)) {
    return new SafetyError("Bu içerik artık yayında değil ya da kaldırılmış.", 404, code);
  }
  if (code === "report_self" || (action === "report" && status === 422)) {
    return new SafetyError("Kendi içeriğini bildiremezsin.", 422, code);
  }
  if (code === "report_invalid") return new SafetyError(core || "Bildirim bilgileri eksik ya da geçersiz.", 400, code);
  if (code === "block_not_allowed" || ((action === "block") && status === 403)) {
    return new SafetyError("Bu hesap engellenemez. Uygunsuz bir içerik gördüysen Bildir'i kullanabilirsin.", 403, code || "block_not_allowed");
  }
  if (code === "block_self" || (action === "block" && status === 422)) return new SafetyError("Kendini engelleyemezsin.", 422, code);
  if (code === "block_user_not_found" || ((action === "block" || action === "unblock") && status === 404)) {
    return new SafetyError("Bu üye bulunamadı.", 404, code);
  }
  if (code === "block_limit" || status === 409) {
    return new SafetyError("En fazla 500 üyeyi engelleyebilirsin. Yenisi için listeden birinin engelini kaldır.", 409, code || "block_limit");
  }
  if (code === "block_invalid") return new SafetyError(core || "Üye bilgisi geçersiz.", 400, code);
  if (status === 429) {
    const wait = retry ? ` ${formatRetryAfter(retry)} sonra tekrar dene.` : " Biraz sonra tekrar dene.";
    return new SafetyError(`Kısa sürede çok fazla istek gönderdin.${wait}`, 429, code, retry);
  }
  const fallback = action === "report" ? "Bildirim şu anda gönderilemedi. Biraz sonra tekrar dene."
    : action === "list" ? "Engellenen üyeler şu anda yüklenemedi."
      : action === "unblock" ? "Engel şu anda kaldırılamadı. Biraz sonra tekrar dene."
        : "Üye şu anda engellenemedi. Biraz sonra tekrar dene.";
  return new SafetyError(core || fallback, status, code);
}

/* ------------------------------------------------------------- transport */

type Method = "GET" | "POST" | "DELETE";

async function call(token: string, method: Method, url: string, action: "report" | "block" | "unblock" | "list", body?: unknown) {
  if (!token) throw new SafetyError("Bu işlem için giriş yapmalısın.", 401);
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
    throw new SafetyError("Bağlantı kurulamadı. İnternet bağlantını kontrol et.");
  }
  let payload: unknown = null;
  try { payload = await res.json(); } catch { /* handled below */ }
  if (!res.ok || !isRecord(payload) || payload.success !== true) {
    throw safetyErrorFrom(res.ok ? 502 : res.status, payload, action);
  }
  return payload;
}

export type ReportInput = { targetType: ReportTargetType; targetId: number; reason: ReportReason; details?: string };
export type ReportResult = { reference: number | string | null; alreadyReported: boolean; message: string };

/** Request body exactly as Core expects; `details` only when the member wrote some. */
export function reportBody(input: ReportInput): Record<string, unknown> {
  const details = (input.details || "").trim();
  return {
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason,
    ...(details ? { details } : {}),
  };
}

/** POST /reports → 201 new / 200 already reported. Shows Core's own message. */
export async function submitReport(token: string, input: ReportInput): Promise<ReportResult> {
  if (!REPORT_TARGET_TYPES.includes(input.targetType) || !memberId(input.targetId)) {
    throw new SafetyError("Bildirilecek içerik bulunamadı.", 400, "report_invalid");
  }
  const invalid = reportDetailsError(input.reason, input.details || "");
  if (invalid) throw new SafetyError(invalid, 400, "report_invalid");
  const data = await call(token, "POST", REPORTS_ENDPOINT, "report", reportBody(input));
  const already = data.already_reported === true;
  const reference = typeof data.reference === "number" || typeof data.reference === "string" ? data.reference : null;
  return {
    reference,
    alreadyReported: already,
    message: text(data.message) || (already ? "Bu içeriği zaten bildirdin." : "Bildirimin alındı. Ekibimiz en geç 24 saat içinde inceleyecek."),
  };
}

export function parseBlockedMember(raw: unknown): BlockedMember | null {
  if (!isRecord(raw)) return null;
  const userId = memberId(raw.user_id);
  if (!userId) return null;
  const avatar = text(raw.avatar);
  return { userId, name: text(raw.name).trim() || "Üye", avatar: /^https:\/\//i.test(avatar) ? avatar : "", blockedAt: text(raw.blocked_at) };
}

/** GET /me/blocks — newest first. */
export async function listBlocks(token: string): Promise<BlockedMember[]> {
  const data = await call(token, "GET", BLOCKS_ENDPOINT, "list");
  if (!Array.isArray(data.blocks)) throw new SafetyError("Engellenen üyeler şu anda yüklenemedi.", 502);
  return data.blocks.flatMap(item => { const parsed = parseBlockedMember(item); return parsed ? [parsed] : []; });
}

export function blockUrl(userId: number): string {
  if (!memberId(userId)) throw new SafetyError("Üye bilgisi geçersiz.", 400, "block_invalid");
  return `${BLOCKS_ENDPOINT}/${userId}`;
}

/** POST /me/blocks { user_id } — 201 new, 200 already blocked. */
export async function blockMember(token: string, userId: number): Promise<void> {
  if (!memberId(userId)) throw new SafetyError("Üye bilgisi geçersiz.", 400, "block_invalid");
  await call(token, "POST", BLOCKS_ENDPOINT, "block", { user_id: userId });
}

/** DELETE /me/blocks/{user_id} — idempotent. */
export async function unblockMember(token: string, userId: number): Promise<void> {
  await call(token, "DELETE", blockUrl(userId), "unblock");
}

/** "/recipe/x" → "/login?callbackUrl=%2Frecipe%2Fx" so a guest comes back after signing in. */
export function loginHref(returnTo: string): string {
  const path = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
}
