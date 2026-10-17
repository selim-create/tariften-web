/**
 * Recipe pictures use a narrow media policy. Human-readable Turkish names are
 * transliterated to ASCII only for transport; the original File is unchanged.
 */
export const MAX_RECIPE_IMAGE_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateRecipeImage(file: { size: number; type: string }): string | null {
  if (!Object.hasOwn(TYPES, file.type)) {
    return "JPG, PNG veya WebP biçiminde bir görsel seç.";
  }
  if (file.size < 1 || file.size > MAX_RECIPE_IMAGE_BYTES) {
    return "Görselin boyutu 8 MB'ı geçemez.";
  }
  return null;
}

export function safeRecipeImageFilename(name: string, type: string): string {
  const ext = TYPES[type];
  if (!ext) throw new Error("Desteklenmeyen görsel türü.");
  const base = name.replace(/\\.[^.]+$/, "").normalize("NFKD")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
    .toLowerCase() || "tarif-gorseli";
  return `${base}.${ext}`;
}
