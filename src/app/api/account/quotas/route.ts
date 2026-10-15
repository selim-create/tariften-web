import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export async function GET(request: NextRequest) {
  const token = request.headers.get("authorization");
  if (!token || !/^Bearer\s+\S+$/i.test(token)) {
    return NextResponse.json({ success: false, message: "Kullanım haklarınızı görmek için giriş yapmalısınız." }, { status: 401, headers: NO_STORE });
  }
  try {
    const upstream = await fetch("https://api.tariften.com/wp-json/tariften/v1/account/quotas", {
      headers: { Authorization: token, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const raw = await upstream.text();
    let data: unknown = null;
    try { data = JSON.parse(raw); } catch { /* Unavailable WordPress server. */ }
    if (!data || typeof data !== "object") {
      return NextResponse.json({ success: false, message: "Kota servisi şu anda yanıt vermiyor." }, { status: 502, headers: NO_STORE });
    }
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch {
    return NextResponse.json({ success: false, message: "Kullanım hakları şu anda alınamadı." }, { status: 503, headers: NO_STORE });
  }
}
