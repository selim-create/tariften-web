import { MAX_RECIPE_IMAGE_BYTES, safeRecipeImageFilename, validateRecipeImage } from "./recipe-media";

export type ImageUploadResult =
  | { success: true; id: number; url: string }
  | { success: false; message: string };

/**
 * Use a same-origin Route Handler, NOT a Server Action: recipe photos may
 * exceed Next.js's default Server Action body limit.
 */
export async function uploadRecipeImage(token: string, file: File): Promise<ImageUploadResult> {
  const invalid = validateRecipeImage(file);
  if (invalid) return { success: false, message: invalid };
  if (file.size > MAX_RECIPE_IMAGE_BYTES) {
    return { success: false, message: "Görselin boyutu 8 MB'ı geçemez." };
  }

  // Vercel Function requests may be capped near 4.5 MB. Larger permitted
  // files go straight to the same JWT-protected WordPress Core endpoint.
  // Never try both routes automatically: an upload may already have succeeded.
  const directToCore = file.size > 4 * 1024 * 1024;
  const endpoint = directToCore
    ? "https://api.tariften.com/wp-json/tariften/v1/recipes/image/upload"
    : "/api/recipes/image/upload";
  const body = new FormData();
  body.append("file", file, safeRecipeImageFilename(file.name, file.type));
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
      cache: "no-store",
    });
    const json: unknown = await response.json().catch(() => null);
    const data = json && typeof json === "object" ? json as Record<string, unknown> : {};
    if (response.ok && data.success === true && Number.isSafeInteger(data.id) && Number(data.id) > 0) {
      return {
        success: true,
        id: Number(data.id),
        url: typeof data.url === "string" && /^https:\/\//i.test(data.url) ? data.url : "",
      };
    }
    let message = "Görsel yüklenemedi. Lütfen tekrar dene.";
    if (data.code === "rest_no_route") {
      message = "Görsel yükleme servisi henüz güncellenmedi. Core güncellemesi gerekiyor.";
    } else if (response.status === 401 || response.status === 403) {
      message = "Görsel yükleme yetkisi doğrulanamadı. Yeniden giriş yapıp dene.";
    } else if (response.status === 413 || response.status === 415 || response.status === 429) {
      message = typeof data.message === "string" && data.message.length < 250 ? data.message : message;
    } else if (!directToCore && typeof data.message === "string" && data.message.length < 250) {
      message = data.message;
    }
    return { success: false, message };
  } catch {
    return { success: false, message: "Görsel gönderilemedi. İnternet bağlantını kontrol et; büyük dosyalarda JPG olarak küçültmeyi deneyebilirsin." };
  }
}
