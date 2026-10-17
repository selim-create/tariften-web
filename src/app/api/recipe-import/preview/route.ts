import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-import/preview";

/**
 * Same-origin, authenticated proxy. No recipe text or JWT is logged, cached,
 * stored or forwarded to third parties other than the existing Tariften Core.
 * The Core feature flag defaults OFF; this route does not override it.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return NextResponse.json(
      { success: false, message: "Tarif aktarmak için giriş yapmalısın." },
      { status: 401, headers: NO_STORE }
    );
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { success: false, message: "Geçersiz içerik türü." },
      { status: 415, headers: NO_STORE }
    );
  }
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > 24000) {
    return NextResponse.json(
      { success: false, message: "Tarif metni en fazla 20 KB olabilir." },
      { status: 413, headers: NO_STORE }
    );
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 24000) throw new Error("too-large");
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { success: false, message: "Tarif metnini kontrol et; istek biçimi geçersiz." },
      { status: 400, headers: NO_STORE }
    );
  }
  const source = payload && typeof payload === "object" && !Array.isArray(payload)
    && "source_text" in payload ? (payload as { source_text: unknown }).source_text : null;
  if (typeof source !== "string" || new TextEncoder().encode(source).length > 20000
      || source.trim().length < 25) {
    return NextResponse.json(
      { success: false, message: "Malzeme ve adımları içeren 25 karakterden uzun, en fazla 20 KB metin gir." },
      { status: 400, headers: NO_STORE }
    );
  }
  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ source_text: source }),
      cache: "no-store",
      signal: AbortSignal.timeout(110000),
    });
    const raw = await upstream.text();
    let data: unknown = null;
    try { data = JSON.parse(raw); } catch { /* Core may be temporarily unavailable. */ }
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, message: "Tariften sunucusu şu anda geçerli bir yanıt göndermiyor." },
        { status: 502, headers: NO_STORE }
      );
    }
    // WordPress rest_no_route is NOT the feature flag. The newer Core plugin
    // route has not been registered on the live server (likely not deployed).
    // Never forward the generic, confusing WordPress 'no matching route' text.
    if (upstream.status === 404 && "code" in data && data.code === "rest_no_route") {
      return NextResponse.json({
        success: false,
        code: "recipe_import_route_missing",
        message: "Tarif aktarma servisi sunucuda henüz kurulu değil. Core güncellemesi gerekiyor.",
      }, { status: 503, headers: NO_STORE });
    }
    if (upstream.status === 503 && "code" in data && data.code === "recipe_import_unavailable") {
      return NextResponse.json({
        success: false,
        code: "recipe_import_unavailable",
        message: "Akıllı Tarif Aktarımı beta özelliği henüz etkinleştirilmedi.",
      }, { status: 503, headers: NO_STORE });
    }
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { success: false, message: "Sunucuya ulaşılamadı. Lütfen bağlantını kontrol ederek yeniden dene." },
      { status: 503, headers: NO_STORE }
    );
  }
}
