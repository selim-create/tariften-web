import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CORE = "https://api.tariften.com/wp-json/tariften/v1";
const ACTIONS = {
  generate: "/ai/generate",
  create: "/recipes/create",
  update: "/recipes/update",
} as const;
type Action = keyof typeof ACTIONS;
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
const respond = (status: number, message: string) => NextResponse.json(
  { success: false, message }, { status, headers: NO_STORE }
);

/** Same-origin recipe writes. No Server Action/RSC error payloads exposed in a modal. */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return respond(401, "Tarif işlemi için giriş yapmalısın.");
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return respond(415, "Geçersiz istek biçimi.");
  }
  if (Number(request.headers.get("content-length") || 0) > 220000) {
    return respond(413, "Tarif bilgisi çok uzun.");
  }
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 220000) return respond(413, "Tarif bilgisi çok uzun.");
    input = JSON.parse(raw);
  } catch {
    return respond(400, "Tarif bilgisi okunamadı.");
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond(400, "Tarif bilgisi geçersiz.");
  }
  const { action, payload } = input as { action?: unknown; payload?: unknown };
  if (typeof action !== "string" || !Object.prototype.hasOwnProperty.call(ACTIONS, action)) {
    return respond(400, "Bilinmeyen tarif işlemi.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return respond(400, "Tarif bilgisi eksik.");
  }
  const kind = action as Action;
  if (kind === "generate") {
    const source = (payload as Record<string, unknown>).ingredients;
    if (typeof source !== "string" || !source.trim() || source.length > 2000) {
      return respond(400, "Tarif adını veya malzemeleri kontrol et.");
    }
    // Household adaptation is opt-in: forward the flag only as a literal true.
    const generatePayload = payload as Record<string, unknown>;
    if ("adapt_household" in generatePayload && generatePayload.adapt_household !== true) {
      delete generatePayload.adapt_household;
    }
  }
  try {
    const upstream = await fetch(CORE + ACTIONS[kind], {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(kind === "generate" ? 110000 : 30000),
    });
    const raw = await upstream.text();
    let result: unknown;
    try { result = JSON.parse(raw); } catch { return respond(502, "Tarif servisi geçerli yanıt göndermedi."); }
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      return respond(502, "Tarif servisinin yanıtı geçersiz.");
    }
    const data = result as Record<string, unknown>;
    if (upstream.status === 404 && data.code === "rest_no_route") {
      return respond(503, "Tarif servisi şu anda kullanılamıyor.");
    }
    if (!upstream.ok && typeof data.message !== "string") {
      data.message = "Tarif işlemi tamamlanamadı. Lütfen tekrar dene.";
    }
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch {
    return respond(503, "Tarif servisine bağlanılamadı. Bağlantını kontrol edip tekrar dene.");
  }
}
