import { NextRequest, NextResponse } from "next/server";
import { MAX_RECIPE_IMAGE_BYTES, safeRecipeImageFilename, validateRecipeImage } from "@/lib/recipe-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://api.tariften.com/wp-json/tariften/v1/recipes/image/upload";
const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" };

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status, headers: NO_STORE });
}

/**
 * Authenticated same-origin proxy so recipe uploads don't pass the Next.js
 * Server Action 1MB body limit, leak JWTs to logs or require WP upload_files.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return failure("Görsel yüklemek için giriş yapmalısın.", 401);
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data")) {
    return failure("Görsel için dosya seçmelisin.", 415);
  }
  const claimed = Number(request.headers.get("content-length") || 0);
  if (claimed > MAX_RECIPE_IMAGE_BYTES + 100000) {
    return failure("Görselin boyutu 8 MB'ı geçemez.", 413);
  }

  let file: File;
  try {
    const body = await request.formData();
    const candidate = body.get("file");
    if (!(candidate instanceof File)) return failure("Görsel seçilemedi.", 400);
    file = candidate;
  } catch {
    return failure("Görsel okunamadı. Yeniden dosya seç.", 400);
  }
  const validation = validateRecipeImage(file);
  if (validation) return failure(validation, file.size > MAX_RECIPE_IMAGE_BYTES ? 413 : 415);

  const upstreamBody = new FormData();
  // Important: native multipart filename ASCII, unlike the old raw Unicode
  // Content-Disposition header which can fail before reaching WordPress.
  upstreamBody.append("file", file, safeRecipeImageFilename(file.name, file.type));
  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
      body: upstreamBody,
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
    const parsed: unknown = await upstream.json().catch(() => null);
    const data = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown> : {};
    if (!upstream.ok) {
      if (upstream.status === 404 && data.code === "rest_no_route") {
        return failure("Görsel yükleme servisi henüz güncellenmedi. Tariften Core güncellemesi gerekiyor.", 503);
      }
      if (upstream.status === 401 || upstream.status === 403) {
        return failure("Görsel yükleme yetkisi doğrulanamadı. Hesabından çıkıp tekrar giriş yap.", upstream.status);
      }
      if (upstream.status === 413 || upstream.status === 415 || upstream.status === 429) {
        return failure(typeof data.message === "string" ? data.message : "Görsel kabul edilmedi.", upstream.status);
      }
      return failure("Görsel sunucuya kaydedilemedi. Birazdan tekrar dene.", 502);
    }
    if (data.success !== true || !Number.isSafeInteger(data.id) || Number(data.id) < 1) {
      return failure("Görsel yükleme yanıtı tamamlanamadı. Yeniden dene.", 502);
    }
    return NextResponse.json({ success: true, id: Number(data.id) }, { status: 201, headers: NO_STORE });
  } catch {
    return failure("Görsel sunucusuna ulaşılamadı. Birazdan tekrar dene.", 503);
  }
}
