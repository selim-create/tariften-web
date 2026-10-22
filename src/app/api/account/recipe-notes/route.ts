import { NextRequest } from "next/server";
import { CORE, bearer, forward, respond } from "./upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Notlarım": GET /me/notes?page=&per_page= (newest first, per_page ≤ 50). */
export async function GET(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Notların için giriş yapmalısın.", "rest_not_logged_in");
  const params = request.nextUrl.searchParams;
  const page = Number(params.get("page") || "1");
  const perPage = Number(params.get("per_page") || "20");
  if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(perPage) || perPage < 1 || perPage > 50) {
    return respond(400, "Sayfa bilgisi geçersiz.");
  }
  return forward(`${CORE}/me/notes?page=${page}&per_page=${perPage}`, authorization, "GET");
}
