import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/content-reports";
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const type = request.headers.get("content-type") || "";
  if (!type.includes("application/json")) {
    return NextResponse.json({ success: false, message: "Geçersiz veri türü." }, { status: 415, headers: NO_STORE });
  }
  let raw: string;
  let params: unknown;
  try {
    raw = await request.text();
    if (new TextEncoder().encode(raw).length > 7000) throw new Error("too_large");
    params = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, message: "Başvuru çok uzun veya geçersiz." }, { status: 400, headers: NO_STORE });
  }
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    return NextResponse.json({ success: false, message: "Başvuru geçersiz." }, { status: 400, headers: NO_STORE });
  }
  try {
    const response = await fetch(UPSTREAM, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params), cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const result: unknown = await response.json().catch(() => null);
    return NextResponse.json(result && typeof result === "object" && !Array.isArray(result)
      ? result : { success: false, message: "Başvuru yanıtı alınamadı." }, {
      status: result && typeof result === "object" && !Array.isArray(result) ? response.status : 502,
      headers: NO_STORE,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Başvuru durumu doğrulanamadı. Tekrar göndermeden önce iletişime geçebilirsin." },
      { status: 503, headers: NO_STORE });
  }
}
