import { NextRequest, NextResponse } from "next/server";
import { isInstagramPostLink, isVideoRecipeLink } from "@/lib/video-recipe-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-social/video/resolve";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization");
  if (!token || !/^Bearer\s+\S+$/i.test(token))
    return NextResponse.json({ success: false, message: "Giriş yapmalısın." }, { status: 401, headers: NO_STORE });
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2400) throw new Error("too_large");
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, message: "Video bağlantısı geçersiz." }, { status: 400, headers: NO_STORE });
  }
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).join(",") !== "source_url" ||
      !("source_url" in body) || typeof body.source_url !== "string" ||
      !(isVideoRecipeLink(body.source_url) || isInstagramPostLink(body.source_url))) {
    return NextResponse.json({ success: false, message: "Desteklenen bir video bağlantısı gir." }, { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return NextResponse.json(data && typeof data === "object" && !Array.isArray(data)
      ? data : { success: false, message: "Video kayıt bilgisi alınamadı." }, {
        status: data && typeof data === "object" && !Array.isArray(data) ? upstream.status : 502,
        headers: NO_STORE,
      });
  } catch {
    return NextResponse.json({ success: false, message: "Video kaydı geçici olarak sorgulanamıyor." },
      { status: 503, headers: NO_STORE });
  }
}
