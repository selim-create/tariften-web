import { MAX_RECIPE_IMAGE_BYTES, validateRecipeImage } from "./recipe-media";

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

  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch("/api/recipes/image/upload", {
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
    return {
      success: false,
      message: typeof data.message === "string" && data.message.length < 250
        ? data.message : "Görsel yüklenemedi. Lütfen tekrar dene.",
    };
  } catch {
    return { success: false, message: "Görsel yüklenemedi. Bağlantını kontrol ederek yeniden dene." };
  }
}
