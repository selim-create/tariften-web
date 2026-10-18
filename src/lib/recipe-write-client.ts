/** Browser-only transport for AI generation, recipe publication and editor changes.
 * JSON through a same-origin Next route; never a React Server Action. */
export type RecipeWriteResult = {
  success?: boolean;
  message?: string;
  status?: string;
  pending_review?: boolean;
  id?: number;
  slug?: string;
  recipe?: unknown;
  existing_recipe_id?: number;
};

async function writeRecipe(
  token: string,
  action: "generate" | "create" | "update",
  payload: Record<string, unknown>,
): Promise<RecipeWriteResult> {
  let res: Response;
  try {
    res = await fetch("/api/recipes/write", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
      cache: "no-store",
    });
  } catch {
    throw new Error("Bağlantı kurulamadı. İnternet bağlantını kontrol et.");
  }
  let json: unknown;
  try { json = await res.json(); } catch {
    throw new Error("Tarif servisi geçerli yanıt göndermedi.");
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Tarif servisi beklenmeyen yanıt verdi.");
  }
  const data = json as RecipeWriteResult;
  if (!res.ok) {
    const detail = typeof data.message === "string" ? data.message : "";
    throw new Error(detail && !/React error|Server Components render|minified|digest:/i.test(detail)
      ? detail : "İşlem tamamlanamadı. Biraz sonra tekrar dene.");
  }
  return data;
}
export async function generateRecipeClient(token: string, query: string) {
  return writeRecipe(token, "generate", { ingredients: query, type: "suggest" });
}
export async function createRecipeClient(token: string, payload: Record<string, unknown>) {
  return writeRecipe(token, "create", payload);
}
export async function updateRecipeClient(token: string, payload: Record<string, unknown>) {
  return writeRecipe(token, "update", payload);
}
