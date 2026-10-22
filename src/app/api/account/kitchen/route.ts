import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/me/kitchen";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
// Core keeps at most 256 KB per member; a little headroom for the envelope.
const MAX_BODY = 300000;
const respond = (status: number, message: string) => NextResponse.json(
  { success: false, message }, { status, headers: NO_STORE }
);

function bearer(request: NextRequest): string | null {
  const value = request.headers.get("authorization");
  return value && /^Bearer\s+\S+$/i.test(value) ? value : null;
}

/**
 * Same-origin transport for "Bu Hafta" / "Alışveriş" (Core /me/kitchen); the
 * JWT never reaches a Server Action. 409 conflicts pass through untouched so
 * the client can merge with `data.current`.
 */
async function forward(authorization: string, method: "GET" | "PUT", body?: string) {
  try {
    const upstream = await fetch(UPSTREAM, {
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
      return respond(502, "Liste servisi şu anda yanıt vermiyor.");
    }
    const result = data as Record<string, unknown>;
    if (upstream.status === 404 && result.code === "rest_no_route") {
      return respond(503, "Liste servisi şu anda kullanılamıyor.");
    }
    return NextResponse.json(result, { status: upstream.status, headers: NO_STORE });
  } catch {
    return respond(503, "Liste şu anda alınamadı. Bağlantını kontrol edip tekrar dene.");
  }
}

export async function GET(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Planın ve listen için giriş yapmalısın.");
  return forward(authorization, "GET");
}

export async function PUT(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Planın ve listen için giriş yapmalısın.");
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return respond(415, "Geçersiz istek biçimi.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY) return respond(413, "Liste çok büyüdü; tamamlananları temizleyip yeniden dene.");
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return respond(400, "Liste bilgisi okunamadı."); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond(400, "Liste bilgisi geçersiz.");
  }
  return forward(authorization, "PUT", JSON.stringify(input));
}
