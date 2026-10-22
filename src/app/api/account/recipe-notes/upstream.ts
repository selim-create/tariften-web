import { NextRequest, NextResponse } from "next/server";

/**
 * Shared forwarder for personal recipe notes. Notes are private to the member:
 * every response is `private, no-store`, every upstream fetch is `no-store`,
 * and the JWT only travels browser → this route → Core (never a Server Action).
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

export async function forward(url: string, authorization: string, method: "GET" | "PUT" | "DELETE", body?: string) {
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
      return respond(502, "Not servisi şu anda yanıt vermiyor.");
    }
    const result = data as Record<string, unknown>;
    if (upstream.status === 404 && result.code === "rest_no_route") {
      return respond(503, "Notlar şu anda kullanılamıyor.");
    }
    return NextResponse.json(result, { status: upstream.status, headers: NO_STORE });
  } catch {
    return respond(503, "Notlarına şu anda ulaşılamadı. Bağlantını kontrol edip tekrar dene.");
  }
}
