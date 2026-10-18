import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-social/preview";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

/** Only the fixed Tariften Core endpoint receives social links and JWT. */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return NextResponse.json({ success: false, message: "Tarif oluşturmak için giriş yapmalısın." },
      { status: 401, headers: NO_STORE });
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return NextResponse.json({ success: false, message: "Geçersiz içerik türü." },
      { status: 415, headers: NO_STORE });
  }
  if (Number(request.headers.get("content-length") || 0) > 3000) {
    return NextResponse.json({ success: false, message: "Bağlantı çok uzun." },
      { status: 413, headers: NO_STORE });
  }
  let data: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 3000) throw new Error("too-large");
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, message: "Bağlantı okunamadı." },
      { status: 400, headers: NO_STORE });
  }
  const link = data && typeof data === "object" && !Array.isArray(data) && "source_url" in data
    ? (data as { source_url: unknown }).source_url : null;
  if (typeof link !== "string" || link.length > 2048 || !/^https:\/\/[^\s]+$/i.test(link)) {
    return NextResponse.json({ success: false, message: "Geçerli bir HTTPS paylaşım bağlantısı gir." },
      { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ source_url: link }),
      cache: "no-store",
      signal: AbortSignal.timeout(110000),
    });
    const payload: unknown = await upstream.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ success: false, message: "Tariften sunucusundan geçerli yanıt alınamadı." },
        { status: 502, headers: NO_STORE });
    }
    if (upstream.status === 404 && "code" in payload && payload.code === "rest_no_route") {
      return NextResponse.json({
        success: false, code: "social_source_route_missing",
        message: "Sosyal tarif aktarımı henüz sunucuya yüklenmedi.",
      }, { status: 503, headers: NO_STORE });
    }
    return NextResponse.json(payload, { status: upstream.status, headers: NO_STORE });
  } catch {
    return NextResponse.json({ success: false, message: "Sunucuya ulaşılamadı. Bağlantını kontrol et." },
      { status: 503, headers: NO_STORE });
  }
}
