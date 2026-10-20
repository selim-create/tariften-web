import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-social/video/history";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization");
  if (!token || !/^Bearer\s+\S+$/i.test(token))
    return NextResponse.json({ success: false, message: "Giriş yapmalısın." }, { status: 401, headers: NO_STORE });
  try {
    const upstream = await fetch(UPSTREAM, {
      headers: { Authorization: token, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data && typeof data === "object" && !Array.isArray(data)
      ? data : { success: false, message: "Geçmiş kayıtları alınamadı." }, {
        status: data && typeof data === "object" && !Array.isArray(data) ? upstream.status : 502,
        headers: NO_STORE,
      });
  } catch {
    return NextResponse.json({ success: false, message: "Tarif analiz geçmişi şu anda alınamıyor." },
      { status: 503, headers: NO_STORE });
  }
}
