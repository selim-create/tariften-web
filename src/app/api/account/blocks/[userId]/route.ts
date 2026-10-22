import { NextRequest } from "next/server";
import { CORE, bearer, forward, respond } from "../../safety-upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ userId: string }> };

/** Unblock: DELETE /me/blocks/{user_id} (idempotent). */
export async function DELETE(request: NextRequest, context: Context) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Engeli kaldırmak için giriş yapmalısın.", "rest_not_logged_in");
  const { userId } = await context.params;
  if (!/^[1-9]\d{0,9}$/.test(userId)) return respond(400, "Üye bilgisi geçersiz.", "block_invalid");
  return forward(`${CORE}/me/blocks/${userId}`, authorization, "DELETE");
}
