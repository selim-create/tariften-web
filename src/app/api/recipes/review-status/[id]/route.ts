import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

/** Private owner/admin status. Never expose unpublished notes to public users. */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return NextResponse.json({ status: "error", message: "Giriş gerekli." }, { status: 401, headers: NO_STORE });
  }
  const { id } = await context.params;
  if (!/^[1-9]\d{0,9}$/.test(id)) {
    return NextResponse.json({ status: "error", message: "Tarif numarası geçersiz." }, { status: 400, headers: NO_STORE });
  }
  try {
    const upstream = await fetch(`https://api.tariften.com/wp-json/tariften/v1/recipes/edit-review/${id}`, {
      headers: { Authorization: authorization, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    if (!upstream.ok) {
      return NextResponse.json({ status: "error", message: "Tarif değerlendirme durumu alınamadı." },
        { status: upstream.status, headers: NO_STORE });
    }
    const data: unknown = await upstream.json();
    if (!data || typeof data !== "object" || Array.isArray(data)
      || !("status" in data) || !["none", "pending", "approved", "rejected"].includes(String(data.status))) {
      return NextResponse.json({ status: "error", message: "Yanıt geçersiz." }, { status: 502, headers: NO_STORE });
    }
    const result = data as { status: string; note?: unknown; updated_at?: unknown };
    return NextResponse.json({
      status: result.status,
      note: typeof result.note === "string" ? result.note : "",
      updated_at: typeof result.updated_at === "string" ? result.updated_at : "",
    }, { status: 200, headers: NO_STORE });
  } catch {
    return NextResponse.json({ status: "error", message: "Durum servisine ulaşılamadı." },
      { status: 503, headers: NO_STORE });
  }
}
