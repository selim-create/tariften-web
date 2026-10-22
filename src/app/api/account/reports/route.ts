import { NextRequest } from "next/server";
import { CORE, bearer, forward, jsonBody, respond } from "../safety-upstream";
import { REPORT_DETAILS_MAX, REPORT_TARGET_TYPES, isReportReason, type ReportTargetType } from "@/lib/ugc-safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 1,000 characters can be up to ~4 KB of UTF-8 plus JSON escaping.
const MAX_BODY = 16000;

/** "Bildir": POST /reports { target_type, target_id, reason, details? }. Core enforces the rules. */
export async function POST(request: NextRequest) {
  const authorization = bearer(request);
  if (!authorization) return respond(401, "Bildirmek için giriş yapmalısın.", "rest_not_logged_in");
  const parsed = await jsonBody(request, MAX_BODY, "report_invalid");
  if ("error" in parsed) return parsed.error;
  const { target_type, target_id, reason, details } = parsed.body;
  if (typeof target_type !== "string" || !REPORT_TARGET_TYPES.includes(target_type as ReportTargetType)
    || typeof target_id !== "number" || !Number.isSafeInteger(target_id) || target_id <= 0
    || !isReportReason(reason)
    || (details !== undefined && details !== null && typeof details !== "string")
    || (typeof details === "string" && [...details].length > REPORT_DETAILS_MAX)) {
    return respond(400, "Bildirim bilgileri eksik ya da geçersiz.", "report_invalid");
  }
  const body: Record<string, unknown> = { target_type, target_id, reason };
  if (typeof details === "string" && details.trim()) body.details = details;
  return forward(`${CORE}/reports`, authorization, "POST", JSON.stringify(body));
}
