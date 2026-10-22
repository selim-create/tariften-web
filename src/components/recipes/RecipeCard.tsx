import Link from "next/link";
import Image from "next/image";
import { Clock3, Flame } from "lucide-react";
import type { Recipe } from "@/types";
import { isPlaceholderImage } from "@/lib/utils";
import RecipeCover from "@/components/recipe/RecipeCover";
import SocialPlatformBadge from "@/components/recipe/SocialPlatformBadge";
import RecipeCardBadges from "@/components/recipes/RecipeCardBadges";
import HideIfBlocked from "@/components/safety/HideIfBlocked";
import { recipeAuthorId } from "@/lib/ugc-safety";

/** Positive whole number from API data, or null. Never a default. */
function positive(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

/**
 * One recipe card for every list (home, library, similar recipes).
 * Shows only facts the recipe has: no "0 dk", no bare calorie number.
 * Disappears for a member who blocked its author (Core 1.0.67).
 */
export default function RecipeCard({ recipe, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" }: { recipe: Recipe; sizes?: string }) {
  const minutes = (positive(recipe.prep_time) ?? 0) + (positive(recipe.cook_time) ?? 0);
  const calories = positive(recipe.calories);
  const verified = recipe.nutrition_status === "verified";
  const kicker = recipe.cuisine?.[0] || recipe.meal_type?.[0];

  return (
    <HideIfBlocked authorId={recipeAuthorId(recipe)}>
    <Link href={`/recipe/${recipe.slug}`} className="group block">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
        {isPlaceholderImage(recipe.image) ? (
          <RecipeCover title={recipe.title} compact />
        ) : (
          <Image src={recipe.image} alt="" fill unoptimized sizes={sizes}
            className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        )}
        <SocialPlatformBadge source={recipe.social_source} />
        <RecipeCardBadges recipe={recipe} />
      </div>
      {kicker && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{kicker}</p>}
      <h3 className="line-clamp-2 font-heading text-[17px] font-semibold leading-snug text-slate-900 transition group-hover:text-brand">{recipe.title}</h3>
      {(minutes > 0 || calories) && (
        <p className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 tabular-nums">
          {minutes > 0 && <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden /> {minutes} dk</span>}
          {calories && <span className="inline-flex items-center gap-1" title={verified ? "Doğrulanmış" : "Tahmini"}><Flame className="h-3.5 w-3.5" aria-hidden /> {verified ? "" : "≈"}{calories} kcal</span>}
        </p>
      )}
    </Link>
    </HideIfBlocked>
  );
}
