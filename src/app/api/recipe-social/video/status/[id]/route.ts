import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BASE = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-social/video/status/";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = request.headers.get("authorization");
  if (!token || !/^Bearer\s+\S+$/i.test(token)) {
    return NextResponse.json({ success: false, message: "Giriş yapmalısın." }, { status: 401, headers: NO_STORE });
  }
  const { id } = await context.params;
  if (!/^[1-9]\d{0,14}$/.test(id)) {
    return NextResponse.json({ success: false, message: "Geçersiz iş kimliği." }, { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(BASE + id, {
      headers: { Authorization: token, Accept: "application/json" },
      cache: "no-store", signal: AbortSignal.timeout(12000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json({ success: false, message: "İş durumu alınamadı." }, { status: 502, headers: NO_STORE });
    }
    return NextResponse.json(data, { status: upstream.status, headers: NO_STORE });
  } catch {
    return NextResponse.json({ success: false, message: "İş durumu geçici olarak alınamadı. Yeniden kontrol edebilirsin." },
      { status: 503, headers: NO_STORE });
  }
}
