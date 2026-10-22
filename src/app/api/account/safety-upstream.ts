import { NextRequest, NextResponse } from "next/server";

/**
 * Shared forwarder for reports and member blocks (Core 1.0.67). Both are
 * member-only: every response is `private, no-store`, every upstream fetch is
 * `no-store`, and the JWT only travels browser → this route → Core.
 */
export const CORE = "https://api.tariften.com/wp-json/tariften/v1";
export const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export const respond = (status: number, message: string, code = "") => NextResponse.json(
  { success: false, code: code || undefined, message }, { status, headers: NO_STORE }
);

export function bearer(request: NextRequest): string | null {
  const value = request.headers.get("authorization");
  return value && /^Bearer\s+\S+$/i.test(value) ? value : null;
}

/** Small JSON body → object, or a ready error response. */
export async function jsonBody(request: NextRequest, maxBytes: number, invalidCode: string):
  Promise<{ body: Record<string, unknown> } | { error: NextResponse }> {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return { error: respond(415, "Geçersiz istek biçimi.", invalidCode) };
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > maxBytes) return { error: respond(400, "İstek çok uzun.", invalidCode) };
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return { error: respond(400, "İstek okunamadı.", invalidCode) }; }
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: respond(400, "İstek geçersiz.", invalidCode) };
  return { body: input as Record<string, unknown> };
}

export async function forward(url: string, authorization: string, method: "GET" | "POST" | "DELETE", body?: string) {
  try {
    const upstream = await fetch(url, {
      method,
      headers: body
        ? { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" }
        : { Authorization: authorization, Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const raw = await upstream.text();
    let data: unknown = null;
    try { data = JSON.parse(raw); } catch { /* Unavailable WordPress server. */ }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return respond(502, "Sunucu şu anda yanıt vermiyor. Biraz sonra tekrar dene.");
    }
    const result = data as Record<string, unknown>;
    if (upstream.status === 404 && result.code === "rest_no_route") {
      return respond(503, "Bu özellik şu anda kullanılamıyor.");
    }
    const headers: Record<string, string> = { ...NO_STORE };
    const retryAfter = upstream.headers.get("retry-after");
    if (retryAfter && /^\d+$/.test(retryAfter)) headers["Retry-After"] = retryAfter;
    return NextResponse.json(result, { status: upstream.status, headers });
  } catch {
    return respond(503, "Sunucuya şu anda ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
  }
}
