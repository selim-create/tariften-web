import type { Menu, Recipe } from "@/types";

/**
 * Personal collections are read with the user's WordPress JWT, never with the
 * public feed and never cached. Public Core menu search ignores author=me on
 * old deployments; require explicit owner scope to fail closed.
 */
const API_ROOT = "https://api.tariften.com/wp-json/tariften/v1";

export type KitchenKind = "recipes" | "menus";
export interface OwnedLibraryPage<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
}

export async function getOwnedLibraryPage<T extends Recipe | Menu>(
  kind: KitchenKind,
  token: string,
  userId: number,
  page: number,
  signal?: AbortSignal,
): Promise<OwnedLibraryPage<T>> {
  if (!token || !Number.isSafeInteger(userId) || userId < 1) {
    throw new Error("Tariflerini ve sofralarını görmek için giriş yapmalısın.");
  }
  const pageNo = Number.isFinite(page) ? Math.max(1, Math.min(10000, Math.floor(page))) : 1;
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}/${kind}/search?author=me&page=${pageNo}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error("İçeriklerine ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.");
  }
  const raw: unknown = await response.json().catch(() => null);
  const payload = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Oturumunu yenileyip tekrar denemelisin.");
    }
    throw new Error("İçeriklerin şu anda yüklenemiyor. Birazdan tekrar dene.");
  }
  if (!Array.isArray(payload.data) || !Number.isInteger(payload.count)
      || !Number.isInteger(payload.pages) || Number(payload.count) < 0
      || Number(payload.pages) < 0) {
    throw new Error("İçerik listesi eksik geldi. Tekrar dene.");
  }
  if (kind === "menus" && payload.scope !== "owner") {
    throw new Error("Sofralarım servisi güncelleniyor. Biraz sonra tekrar dene.");
  }

  // Extra client-side guard: a personal library must not show someone else's
  // items, even when Core/public API or authentication is misconfigured.
  const items = payload.data as T[];
  for (const item of items) {
    const entry = item as T & { author_id?: number; author?: { id?: number } };
    const owner = kind === "menus" ? Number(entry.author_id)
      : Number(entry.author?.id ?? entry.author_id);
    if (!Number.isSafeInteger(owner) || owner !== userId) {
      throw new Error("Hesabına ait olmayan bir içerik döndü. Tekrar dene.");
    }
  }
  return {
    items,
    page: pageNo,
    pages: Number(payload.pages),
    total: Number(payload.count),
  };
}
