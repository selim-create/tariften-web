import { NextRequest } from "next/server";

const CORE_BASE = "https://api.tariften.com/wp-json/tariften/v1/voice";
const VOICES = new Set([
  "tr-TR-Chirp3-HD-Enceladus",
  "tr-TR-Chirp3-HD-Zephyr",
  "tr-TR-Chirp3-HD-Aoede",
  "tr-TR-Chirp3-HD-Kore",
  "tr-TR-Chirp3-HD-Puck",
  "tr-TR-Chirp3-HD-Charon",
]);

function reply(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

function bearer(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  return /^Bearer [A-Za-z0-9._~-]{10,4096}$/.test(authorization) ? authorization : null;
}

async function relay(url: string, authorization: string, body?: string) {
  try {
    const response = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body }),
      cache: "no-store",
      signal: AbortSignal.timeout(28000),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return reply({ code: "voice_unavailable", message: "Ses servisine ulaşılamıyor." }, 502);
    }
    const text = await response.text();
    if (text.length > 2_100_000) {
      return reply({ code: "voice_response_large", message: "Ses yanıtı çok büyük." }, 502);
    }
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    return reply({ code: "voice_unavailable", message: "Ses servisine ulaşılamıyor." }, 502);
  }
}

// A same-origin gateway avoids browser CORS dependencies. It forwards only the
// signed-in user's WordPress bearer token, never Google or Cloud Run secrets.
export async function GET(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return reply({ code: "voice_auth", message: "Giriş yapmanız gerekiyor." }, 401);
  return relay(CORE_BASE + "/status", authorization);
}

export async function POST(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return reply({ code: "voice_auth", message: "Giriş yapmanız gerekiyor." }, 401);
  let payload: unknown;
  try { payload = await request.json(); } catch { return reply({ code: "voice_parameters" }, 400); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return reply({ code: "voice_parameters" }, 400);
  const { recipe_id, step_index, voice } = payload as Record<string, unknown>;
  if (!Number.isSafeInteger(recipe_id) || (recipe_id as number) < 1
      || !Number.isInteger(step_index) || (step_index as number) < 0 || (step_index as number) > 100
      || typeof voice !== "string" || !VOICES.has(voice)) {
    return reply({ code: "voice_parameters", message: "Geçersiz seslendirme isteği." }, 400);
  }
  return relay(CORE_BASE + "/synthesize", authorization, JSON.stringify({ recipe_id, step_index, voice }));
}
