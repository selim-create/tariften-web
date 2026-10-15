"use client";

/**
 * Browser-safe menu job transport.
 *
 * Previously these functions lived in lib/api.ts ("use server"), turning
 * every AI recipe step into a React Server Action. This client module speaks
 * plain JSON to a tightly allowlisted Next route and never parses RSC frames.
 * Authentication and recipe ownership remain checked by WordPress.
 */
const ENDPOINT = "/api/menu-jobs";

export type MenuJob = {
  success: boolean;
  id: number;
  slug: string;
  status: "generating" | "ready" | "needs_attention";
  total: number;
  completed: number;
  remaining?: number;
  message?: string;
  failures?: Array<{ name: string; error: string }>;
};

type JsonData = Record<string, unknown>;

export class MenuJobTransportError extends Error {
  status: number;
  traceId?: string;
  constructor(message: string, status = 0, traceId?: string) {
    super(message);
    this.name = "MenuJobTransportError";
    this.status = status;
    this.traceId = traceId;
  }
}

async function parseJson(res: Response): Promise<JsonData> {
  const raw = await res.text();
  let parsed: JsonData | null = null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) parsed = obj as JsonData;
  } catch { /* An error proxy sometimes sends HTML instead of JSON. */ }
  if (!parsed) {
    throw new MenuJobTransportError(
      "Menü sunucusu beklenmeyen bir yanıt verdi. Kaydedilmiş menünün durumunu kontrol edin.",
      res.status || 502
    );
  }
  if (!res.ok) {
    throw new MenuJobTransportError(
      typeof parsed.message === "string" ? parsed.message : "Menü işlemi tamamlanamadı.",
      res.status,
      typeof parsed.traceId === "string" ? parsed.traceId : undefined
    );
  }
  return parsed;
}

async function menuRequest(
  path: string,
  token: string,
  method: "GET" | "POST" = "GET",
  payload?: Record<string, unknown>
): Promise<JsonData> {
  try {
    const res = await fetch(ENDPOINT + path, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    return await parseJson(res);
  } catch (error) {
    if (error instanceof MenuJobTransportError) throw error;
    throw new MenuJobTransportError(
      "Menü bağlantısı kesildi. Aynı menünün kaldığı yerden devam edebileceği kontrol ediliyor."
    );
  }
}

function requireJob(data: JsonData): MenuJob {
  if (data.success !== true || typeof data.id !== "number"
    || typeof data.completed !== "number" || typeof data.total !== "number"
    || !["generating", "ready", "needs_attention"].includes(String(data.status))
    || typeof data.slug !== "string") {
    throw new MenuJobTransportError(
      "Menü durum yanıtı eksik. Yeni menü oluşturmadan önce mevcut kayıt incelenmeli."
    );
  }
  return data as MenuJob;
}

export async function generateAIMenu(
  token: string,
  params: { concept: string; guest_count: number; event_type: string; diet?: string; cuisine?: string },
  requestId: string
): Promise<MenuJob> {
  const data = await menuRequest("/generate", token, "POST", {
    ...params,
    diet_preference: params.diet,
    request_id: requestId,
    async: true,
  });
  return requireJob(data);
}

export async function findMenuJob(token: string, requestId: string): Promise<MenuJob | null> {
  const data = await menuRequest(`/find?request_id=${encodeURIComponent(requestId)}`, token);
  if (!data.found && !data.id) return null;
  return requireJob(data);
}

export async function fetchMenuJob(token: string, id: number): Promise<MenuJob> {
  return requireJob(await menuRequest(`/${id}`, token));
}

export async function advanceMenuJob(token: string, id: number): Promise<MenuJob> {
  return requireJob(await menuRequest(`/${id}/advance`, token, "POST"));
}

export async function retryMenuJob(token: string, id: number): Promise<MenuJob> {
  return requireJob(await menuRequest(`/${id}/retry`, token, "POST"));
}
