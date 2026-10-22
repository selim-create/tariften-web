import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/me/kitchen-profile";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
const MAX_BODY = 16000;
const respond = (status: number, message: string) => NextResponse.json(
  { success: false, message }, { status, headers: NO_STORE }
);

function bearer(request: NextRequest): string | null {
  const value = request.headers.get("authorization");
  return value && /^Bearer\s+\S+$/i.test(value) ? value : null;
}

/** Same-origin kitchen profile transport; the JWT never reaches a Server Action. */
async function forward(authorization: string, method: "GET" | "PUT" | "DELETE", body?: string) {
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
      return respond(502, "Mutfak profili servisi şu anda yanıt vermiyor.");
    }
    const result = data as Record<string, unknown>;
    if (upstream.status === 404 && result.code === "rest_no_route") {
      return respond(503, "Mutfak profili servisi şu anda kullanılamıyor.");
    }
    return NextResponse.json(result, { status: upstream.status, headers: NO_STORE });
  } catch {
    return respond(503, "Mutfak profili şu anda alınamadı. Bağlantını kontrol edip tekrar dene.");
  }
}

export async function GET(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Mutfak profilin için giriş yapmalısın.");
  return forward(authorization, "GET");
}

export async function PUT(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Mutfak profilin için giriş yapmalısın.");
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return respond(415, "Geçersiz istek biçimi.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY) return respond(413, "Mutfak profili bilgisi çok uzun.");
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return respond(400, "Mutfak profili bilgisi okunamadı."); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond(400, "Mutfak profili bilgisi geçersiz.");
  }
  return forward(authorization, "PUT", JSON.stringify(input));
}

export async function DELETE(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Mutfak profilin için giriş yapmalısın.");
  return forward(authorization, "DELETE");
}
