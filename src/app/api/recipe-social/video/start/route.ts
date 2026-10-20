import { NextRequest, NextResponse } from "next/server";
import { isInstagramReelLink } from "@/lib/video-recipe-import";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const BASE = "https://api.tariften.com/wp-json/tariften/v1/ai/recipe-social/video";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };
function auth(req: NextRequest) {
  const header = req.headers.get("authorization");
  return header && /^Bearer\s+\S+$/i.test(header) ? header : null;
}
function send(value: unknown, status: number) { return NextResponse.json(value, { status, headers: NO_STORE }); }
export async function POST(request: NextRequest) {
  const token = auth(request);
  if (!token) return send({ success: false, message: "Tarif aktarmak için giriş yapmalısın." }, 401);
  if (!request.headers.get("content-type")?.includes("application/json")) return send({ success: false, message: "Geçersiz içerik türü." }, 415);
  let params: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 2500) return send({ success: false, message: "Bağlantı çok uzun." }, 413);
    params = JSON.parse(raw);
  } catch { return send({ success: false, message: "Bağlantı okunamadı." }, 400); }
  if (!params || Array.isArray(params) || typeof params !== "object") return send({ success: false, message: "Geçersiz istek." }, 400);
  const p = params as Record<string, unknown>;
  const instagram = typeof p.source_url === "string" && isInstagramReelLink(p.source_url);
  const expectedKeys = instagram ? "request_id,rights_confirmed,source_url" : "request_id,source_url";
  if (Object.keys(p).sort().join(",") !== expectedKeys ||
      (instagram && p.rights_confirmed !== true) ||
      typeof p.source_url !== "string" || p.source_url.length > 2048 ||
      !/^https:\/\/[^\s]+$/.test(p.source_url) || typeof p.request_id !== "string" ||
      !/^[A-Za-z0-9-]{16,80}$/.test(p.request_id)) return send({ success: false, message: "Geçersiz video bağlantısı veya istek kimliği." }, 400);
  try {
    const upstream = await fetch(BASE + "/start", {
      method: "POST", headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(p), cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const data: unknown = await upstream.json().catch(() => null);
    if (!data || typeof data !== "object" || Array.isArray(data)) return send({ success: false, message: "Video sunucusundan geçerli yanıt alınamadı." }, 502);
    if (upstream.status === 404 && "code" in data && data.code === "rest_no_route") {
      return send({ success: false, code: "video_job_route_missing", message: "Video analizi sunucuda henüz etkinleştirilmedi." }, 503);
    }
    return send(data, upstream.status);
  } catch {
    // POST may have reached WordPress; retrying with SAME request_id is idempotent.
    return send({ success: false, code: "video_job_start_uncertain",
      message: "İşin başlatılıp başlatılmadığını doğrulayamadık. Aynı bağlantıyla yeniden kontrol edebilirsin." }, 503);
  }
}
