import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-social/video/publish";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization");
  if (!token || !/^Bearer\s+\S+$/i.test(token))
    return NextResponse.json({ success: false, message: "Giriş yapmalısın." }, { status: 401, headers: NO_STORE });
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 60000) throw new Error("too_large");
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, message: "Tarif verisi geçersiz." }, { status: 400, headers: NO_STORE });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).sort().join(",") !== "job_id,recipe" ||
      !("job_id" in body) || !Number.isSafeInteger(body.job_id) || Number(body.job_id) < 1 ||
      !("recipe" in body) || !body.recipe || typeof body.recipe !== "object" || Array.isArray(body.recipe)) {
    return NextResponse.json({ success: false, message: "Tarif veya video iş kimliği geçersiz." },
      { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data && typeof data === "object" && !Array.isArray(data)
      ? data : { success: false, message: "Yayımlama yanıtı doğrulanamadı. Tekrar denemeden önce sonucu kontrol et." }, {
        status: data && typeof data === "object" && !Array.isArray(data) ? upstream.status : 502,
        headers: NO_STORE,
      });
  } catch {
    return NextResponse.json({ success: false, message: "Yayın sonucu belirsiz. Yeniden yayımlamadan önce mevcut tarifleri kontrol et." },
      { status: 503, headers: NO_STORE });
  }
}
