import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// This endpoint handles exactly one menu AI step. It must not attempt the
// full menu inside one Server Action or exceed Vercel's request budget.
export const maxDuration = 60;

const WORDPRESS_API = "https://api.tariften.com/wp-json/tariften/v1";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

/**
 * A narrowly allowlisted same-origin JSON transport for menu jobs.
 * WordPress always performs authentication and ownership checks; this route
 * cannot fetch arbitrary URLs or provide unauthenticated API access.
 *
 * Direct browser calls to a "use server" module become React Server Actions.
 * A slow upstream request can then surface an opaque React RSC error (#441).
 * These Next route handlers use normal JSON responses instead of RSC.
 */
type RouteContext = { params: Promise<{ route: string[] }> };
type UpstreamTarget = { path: string; operation: string };

function resolveRoute(parts: string[], method: "GET" | "POST"): UpstreamTarget | null {
  if (method === "POST" && parts.length === 1 && parts[0] === "generate") {
    return { path: "/ai/generate-menu", operation: "plan" };
  }
  if (method === "GET" && parts.length === 1 && parts[0] === "find") {
    return { path: "/ai/menu-job/find", operation: "find" };
  }
  const id = parts[0];
  if (!id || !/^[1-9]\d{0,9}$/.test(id)) return null;
  if (method === "GET" && parts.length === 1) {
    return { path: `/ai/menu-job/${id}`, operation: "status" };
  }
  if (method === "POST" && parts.length === 2 && (parts[1] === "advance" || parts[1] === "retry")) {
    return { path: `/ai/menu-job/${id}/${parts[1]}`, operation: parts[1] };
  }
  return null;
}

async function proxy(request: NextRequest, context: RouteContext, method: "GET" | "POST") {
  const parts = (await context.params).route;
  const target = resolveRoute(parts, method);
  const headers = { ...NO_STORE };
  if (!target) {
    return NextResponse.json({ success: false, message: "Geçersiz menü işlemi." }, { status: 404, headers });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return NextResponse.json({ success: false, message: "Menü işlemi için giriş yapmalısınız." }, { status: 401, headers });
  }

  const traceId = crypto.randomUUID();
  let path = target.path;
  if (target.operation === "find") {
    const requestId = request.nextUrl.searchParams.get("request_id") || "";
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
      return NextResponse.json({ success: false, message: "Geçersiz menü istek kimliği." }, { status: 400, headers });
    }
    path += `?request_id=${encodeURIComponent(requestId)}`;
  }

  let body: string | undefined;
  if (target.operation === "plan") {
    // A small JSON request only. Never accept arbitrary URLs or pass-through
    // large browser input into a paid WordPress API call.
    if (Number(request.headers.get("content-length") || "0") > 16384) {
      return NextResponse.json({ success: false, message: "Menü talebi çok büyük." }, { status: 413, headers });
    }
    try {
      const payload = await request.json() as Record<string, unknown>;
      const concept = typeof payload.concept === "string" ? payload.concept.trim() : "";
      const requestId = typeof payload.request_id === "string" ? payload.request_id : "";
      const guests = Number(payload.guest_count);
      if (!concept || concept.length > 180 || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)
        || !Number.isInteger(guests) || guests < 1 || guests > 50) {
        return NextResponse.json({ success: false, message: "Menü bilgileri eksik veya geçersiz." }, { status: 400, headers });
      }
      body = JSON.stringify({
        concept,
        guest_count: guests,
        event_type: typeof payload.event_type === "string" ? payload.event_type.slice(0, 100) : "",
        cuisine: typeof payload.cuisine === "string" ? payload.cuisine.slice(0, 80) : "",
        diet_preference: typeof payload.diet_preference === "string" ? payload.diet_preference.slice(0, 100) : "",
        async: true,
        request_id: requestId,
      });
    } catch {
      return NextResponse.json({ success: false, message: "Menü verisi okunamadı." }, { status: 400, headers });
    }
  }

  try {
    const response = await fetch(WORDPRESS_API + path, {
      method,
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(55000),
    });
    const raw = await response.text();
    let result: Record<string, unknown> | null = null;
    try { result = JSON.parse(raw) as Record<string, unknown>; } catch { /* proxy, CDN or server HTML */ }
    if (!result) {
      // No partial HTML is ever sent to the browser as a React/JSON response.
      console.error(`[menu-proxy] invalid JSON operation=${target.operation} status=${response.status} trace=${traceId}`);
      return NextResponse.json({
        success: false,
        message: "Sunucu beklenmeyen bir yanıt verdi. Kayıtlı menü durumunu kontrol edin.",
        traceId,
      }, { status: 502, headers });
    }
    return NextResponse.json(result, { status: response.status, headers });
  } catch {
    // Never print Bearer tokens, menu requests or generated content to logs.
    console.error(`[menu-proxy] upstream interrupted operation=${target.operation} trace=${traceId}`);
    return NextResponse.json({
      success: false,
      message: "Menü bağlantısı kesildi. Tamamlanan tarifler korunmuş olabilir; yeni menü açmadan mevcut işin durumunu kontrol edin.",
      traceId,
    }, { status: 504, headers });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context, "GET");
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context, "POST");
}
