import { NextRequest } from "next/server";
import { CORE, bearer, forward, respond } from "../upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 2,000 characters can be up to ~8 KB of UTF-8 plus JSON escaping.
const MAX_BODY = 24000;
type Context = { params: Promise<{ id: string }> };

async function target(request: NextRequest, context: Context) {
  const authorization = bearer(request);
  if (!authorization) return { error: respond(401, "Not için giriş yapmalısın.", "rest_not_logged_in") };
  const { id } = await context.params;
  if (!/^[1-9]\d{0,9}$/.test(id)) return { error: respond(400, "Tarif numarası geçersiz.") };
  return { authorization, url: `${CORE}/recipes/${id}/my-note` };
}

/** The member's own note for this recipe; `note: null` when there is none. */
export async function GET(request: NextRequest, context: Context) {
  const t = await target(request, context);
  if ("error" in t) return t.error;
  return forward(t.url, t.authorization, "GET");
}

/** Create or replace. Core cleans the text, enforces 2,000 chars and the rate limit. */
export async function PUT(request: NextRequest, context: Context) {
  const t = await target(request, context);
  if ("error" in t) return t.error;
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return respond(415, "Geçersiz istek biçimi.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY) {
    return respond(400, "Not en fazla 2.000 karakter olabilir.", "recipe_note_too_long");
  }
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return respond(400, "Not okunamadı.", "recipe_note_invalid"); }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return respond(400, "Not geçersiz.", "recipe_note_invalid");
  }
  const note = (input as Record<string, unknown>).note;
  if (note !== null && typeof note !== "string") return respond(400, "Not geçersiz.", "recipe_note_invalid");
  return forward(t.url, t.authorization, "PUT", JSON.stringify({ note }));
}

export async function DELETE(request: NextRequest, context: Context) {
  const t = await target(request, context);
  if ("error" in t) return t.error;
  return forward(t.url, t.authorization, "DELETE");
}
