import { LockKeyhole, Sparkles } from "lucide-react";
import type { Recipe } from "@/types";

/**
 * Decorative chips over a recipe card photo. Private recipes are only ever
 * returned to their owner, so "Sadece sen" needs no viewer check here.
 */
export default function RecipeCardBadges({ recipe }: { recipe?: Pick<Recipe, "ai_estimated" | "visibility"> | null }) {
  if (!recipe || (recipe.ai_estimated !== true && recipe.visibility !== "private")) return null;
  return (
    <span className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
      {recipe.ai_estimated === true && (
        <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white/90 px-2.5 text-[11px] font-semibold text-[#c2463a] ring-1 ring-black/5 backdrop-blur">
          <Sparkles className="h-3 w-3" aria-hidden /> AI Tahmini Tarif
        </span>
      )}
      {recipe.visibility === "private" && (
        <span className="inline-flex h-7 items-center gap-1 rounded-full bg-slate-900/80 px-2.5 text-[11px] font-semibold text-white backdrop-blur">
          <LockKeyhole className="h-3 w-3" aria-hidden /> Sadece sen
        </span>
      )}
    </span>
  );
}
