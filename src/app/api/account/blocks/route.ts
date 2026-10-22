import { NextRequest } from "next/server";
import { CORE, bearer, forward, jsonBody, respond } from "../safety-upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Engellenen üyeler": GET /me/blocks (newest first). */
export async function GET(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Engellediğin üyeler için giriş yapmalısın.", "rest_not_logged_in");
  return forward(`${CORE}/me/blocks`, authorization, "GET");
}

/** Block a member: POST /me/blocks { user_id }. */
export async function POST(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Engellemek için giriş yapmalısın.", "rest_not_logged_in");
  const parsed = await jsonBody(request, 1000, "block_invalid");
  if ("error" in parsed) return parsed.error;
  const userId = parsed.body.user_id;
  if (typeof userId !== "number" || !Number.isSafeInteger(userId) || userId <= 0) {
    return respond(400, "Üye bilgisi geçersiz.", "block_invalid");
  }
  return forward(`${CORE}/me/blocks`, authorization, "POST", JSON.stringify({ user_id: userId }));
}
