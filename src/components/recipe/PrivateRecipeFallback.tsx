"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import RecipeDetailView from "@/components/recipe/RecipeDetailView";
import { fetchOwnerRecipe } from "@/lib/media-recipe-import";
import { parseIngredients, parseSteps } from "@/lib/recipeUtils";
import type { Recipe } from "@/types";

type State = { key: string; recipe: Recipe | null };

/** "/recipe/evde-adana-kebap" → "evde-adana-kebap"; null for anything else. */
export function recipeSlugFromPath(pathname: string | null): string | null {
  const match = /^\/recipe\/([^/?#]+)\/?$/.exec(pathname || "");
  if (!match) return null;
  try { return decodeURIComponent(match[1]); } catch { return null; }
}

/**
 * Client fallback for a recipe the server could not see: only the owner of a
 * private recipe gets it (Core answers with the member's token, no-store).
 */
export default function PrivateRecipeFallback({ fallback }: { fallback: ReactNode }) {
  const pathname = usePathname();
  const slug = recipeSlugFromPath(pathname);
  const { user, loading } = useAuth();
  const token = user?.token;
  const key = `${user?.id || 0}:${slug || ""}`;
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!token || !slug) return;
    const controller = new AbortController();
    void fetchOwnerRecipe<Recipe>(token, slug, controller.signal).then(found => {
      if (controller.signal.aborted) return;
      const recipe = found && Number.isSafeInteger(found.id) ? {
        ...found,
        image: typeof found.image === "string" ? found.image : "",
        ingredients: parseIngredients(found.ingredients),
        steps: parseSteps(found.steps),
      } : null;
      if (recipe) document.title = `${recipe.title} | Tariften`;
      setState({ key, recipe });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ key, recipe: null });
    });
    return () => controller.abort();
  }, [token, slug, key]);

  const settled = state?.key === key;
  if (!slug || (!loading && !token) || (settled && !state?.recipe)) return <>{fallback}</>;
  if (loading || !settled || !state?.recipe) {
    return (
      <main className="grid min-h-[60vh] place-items-center text-slate-500">
        <LoaderCircle className="h-7 w-7 animate-spin" aria-label="Tarif yükleniyor" />
      </main>
    );
  }
  return <RecipeDetailView recipe={state.recipe} />;
}
