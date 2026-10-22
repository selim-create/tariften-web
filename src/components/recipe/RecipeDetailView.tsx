import Link from "next/link";
import { ChevronRight, Clock3, CookingPot, Flame, Gauge, Users } from "lucide-react";
import RecipeDetailClient from "@/components/recipe/RecipeDetailClient";
import SocialRecipeSourceCard from "@/components/recipe/SocialRecipeSourceCard";
import PilotEntryButton from "@/components/pilot/PilotEntryButton";
import RecipeActions from "@/components/recipe/RecipeActions";
import RecipeKitchenActions from "@/components/recipe/RecipeKitchenActions";
import EditButton from "@/components/recipe/EditButton";
import RecipeReviewNotice from "@/components/recipe/RecipeReviewNotice";
import RecipeAllergenNotice from "@/components/recipe/RecipeAllergenNotice";
import RecipeCover from "@/components/recipe/RecipeCover";
import RecipeStatusBadges from "@/components/recipe/RecipeStatusBadges";
import SocialPlatformBadge from "@/components/recipe/SocialPlatformBadge";
import SocialHeroSourceButton from "@/components/recipe/SocialHeroSourceButton";
import RecipeJsonLd from '@/components/RecipeJsonLd';
import { isPlaceholderImage } from "@/lib/utils";
import RejindeBanner from '@/components/RejindeBanner';
import ContentSafetyMenu from "@/components/safety/ContentSafetyMenu";
import BlockedRecipeGate from "@/components/safety/BlockedRecipeGate";
import { recipeAuthorId } from "@/lib/ugc-safety";
import type { Recipe } from "@/types";

function getYoutubeVideoId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/** Positive whole number from API data, or null. Never a default. */
function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

/** Phone columns by number of facts, so no row ends with a lone cell. */
const FACT_COLS: Record<number, string> = {
  1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2", 5: "grid-cols-3",
};

/**
 * The full recipe page body. Rendered on the server for public recipes and in
 * the browser (with the owner's token) for private photo/notebook recipes,
 * which the public, cacheable server fetch can never see.
 */
export default function RecipeDetailView({ recipe }: { recipe: Recipe }) {
  const videoId = getYoutubeVideoId(recipe.image);
  const hasPhoto = !videoId && !isPlaceholderImage(recipe.image);
  // Social imports have a real source; only unsourced stock/placeholder
  // recipes are labelled as an AI suggestion.
  // Photo estimates carry their own "AI Tahmini Tarif" badge next to the title.
  const isAiRecipe = !recipe.social_source && !recipe.ai_estimated && (
    recipe.image.includes("placehold.co") ||
    recipe.image.includes("images.unsplash.com") ||
    recipe.image.includes("pexels.com"));

  const authorId = recipeAuthorId(recipe);

  const prep = positiveNumber(recipe.prep_time);
  const cook = positiveNumber(recipe.cook_time);
  const servings = positiveNumber(recipe.servings);
  const calories = positiveNumber(recipe.calories);
  const caloriesVerified = recipe.nutrition_status === 'verified';
  const difficulty = recipe.difficulty?.[0] || null;

  const facts = [
    prep && { icon: Clock3, label: "Hazırlık", value: `${prep} dk` },
    cook && { icon: CookingPot, label: "Pişirme", value: `${cook} dk` },
    servings && { icon: Users, label: "Porsiyon", value: `${servings} kişilik` },
    calories && {
      icon: Flame,
      label: "Kalori",
      onPhoto: true,
      value: `${caloriesVerified ? "" : "≈"}${calories} kcal`,
      note: caloriesVerified ? undefined : "tahmini",
      hint: caloriesVerified ? "Doğrulanmış besin analizi" : "AI tahmini; besin veritabanıyla doğrulanmadı",
    },
    difficulty && { icon: Gauge, label: "Zorluk", value: difficulty, onPhoto: true },
  ].filter(Boolean) as { icon: typeof Clock3; label: string; value: string; hint?: string; note?: string; onPhoto?: boolean }[];
  // Phones: Kalori and Zorluk ride on the photo so the strip below keeps one tidy row.
  const photoFacts = hasPhoto ? facts.filter(f => f.onPhoto) : [];
  const phoneFactCount = facts.length - photoFacts.length;

  const taxonomy = [
    ...(recipe.meal_type || []).map(m => ({ label: m, href: `/recipes?meal_type=${encodeURIComponent(m)}` })),
    ...(recipe.cuisine || []).map(c => ({ label: c, href: `/recipes?cuisine=${encodeURIComponent(c)}` })),
    ...(recipe.diet || []).map(d => ({ label: d, href: `/recipes?diet=${encodeURIComponent(d)}` })),
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24 font-sans text-slate-800">
      {/* Private recipes are never offered to search engines. */}
      {recipe.visibility !== "private" && <RecipeJsonLd recipe={recipe} />}

      <div className="container mx-auto flex max-w-6xl items-center gap-3 px-4 pt-6">
        <nav aria-label="Sayfa konumu" className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <Link href="/recipes" className="transition hover:text-brand">Tarifler</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <span className="truncate font-medium text-slate-700">{recipe.title}</span>
        </nav>
        {/* "⋯": Bildir / engelle on recipes the viewer did not write (Core 1.0.67). */}
        <ContentSafetyMenu targetType="recipe" targetId={recipe.id} label="Tarif seçenekleri"
          author={recipe.author ? { id: authorId, name: recipe.author.name, avatar: recipe.author.avatar } : authorId ? { id: authorId } : null}
          className="-my-2 -mr-2 shrink-0" />
      </div>

      <div className="container mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
        <BlockedRecipeGate recipeId={recipe.id} authorId={authorId} authorName={recipe.author?.name || ""} authorBlocked={recipe.author_blocked === true}>
        <RecipeReviewNotice recipeId={recipe.id} authorId={recipe.author?.id ?? 0} />
        <RejindeBanner recipeId={recipe.id} />

        <header className="mb-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:mb-14 lg:gap-14">
          {/* Without a photo the typographic cover would repeat the H1 directly below it on phones. */}
          <div className={`group relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5 ${!videoId && !hasPhoto ? "hidden md:block" : ""}`}>
            <EditButton authorId={recipe.author?.id} recipeId={recipe.id} />

            {videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={recipe.title}
              />
            ) : hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={recipe.image}
                alt={recipe.title}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
              />
            ) : (
              <RecipeCover title={recipe.title} kicker={recipe.cuisine?.[0]} />
            )}

            {photoFacts.length > 0 && (
              <dl className="absolute left-4 top-4 z-20 flex max-w-[calc(100%-5rem)] flex-wrap gap-1.5 md:hidden">
                {photoFacts.map(({ icon: Icon, label, value, note, hint }) => (
                  <div key={label} title={hint}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[rgba(31,26,23,0.72)] px-3 text-[12.5px] font-semibold text-white backdrop-blur-md">
                    <dt className="flex items-center"><Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2} /><span className="sr-only">{label}</span></dt>
                    <dd className="whitespace-nowrap tabular-nums">
                      {value}{note && <span className="ml-1 font-normal text-[rgb(255_255_255/0.7)]">{note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Over a real photo the creator pill plays the original video, as in the app. */}
            {recipe.social_source && hasPhoto
              ? <SocialHeroSourceButton source={recipe.social_source} />
              : <SocialPlatformBadge source={recipe.social_source} />}
            {!videoId && isAiRecipe && (
              <span className="absolute bottom-4 left-4 z-10 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-black/5 backdrop-blur">
                AI önerisi
              </span>
            )}
          </div>

          <div className="flex flex-col">
            {taxonomy.length > 0 && (
              <ul className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                {taxonomy.map((t, i) => (
                  <li key={`${t.href}`} className="flex items-center gap-2">
                    {i > 0 && <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden />}
                    <Link href={t.href} className="text-brand transition hover:text-brand-dark">{t.label}</Link>
                  </li>
                ))}
              </ul>
            )}

            <RecipeStatusBadges recipe={recipe} />

            <h1 className="mb-5 font-heading text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 text-balance sm:text-5xl">
              {recipe.title}
            </h1>

            {recipe.excerpt && (
              <p className="mb-8 max-w-xl text-[17px] leading-relaxed text-gray-500">
                {recipe.excerpt}
              </p>
            )}

            {facts.length > 0 && (
              /* A quiet strip, not a box of cells: reads cleanly with 3 or with all 5
                 facts. Phones: Kalori/Zorluk sit on the photo when there is one, the
                 rest share one row (columns chosen by count, no orphan cell);
                 large screens: all five on one line with hairline dividers. */
              <dl className={`mb-8 grid gap-x-4 gap-y-5 border-y border-gray-200 py-5 ${FACT_COLS[Math.min(Math.max(phoneFactCount, 1), 5)]} lg:flex lg:gap-0 lg:divide-x lg:divide-gray-200`}>
                {facts.map(({ icon: Icon, label, value, hint, note, onPhoto }) => (
                  <div key={label} title={hint}
                    className={`min-w-0 lg:flex-1 lg:px-5 lg:first:pl-0 lg:last:pr-0 ${onPhoto && hasPhoto ? "hidden md:block" : ""}`}>
                    <dt className="flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-medium text-gray-500">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden strokeWidth={1.75} />
                      {label}
                    </dt>
                    <dd className="mt-1 whitespace-nowrap font-heading text-[17px] font-semibold tracking-[-0.01em] text-slate-900 tabular-nums">
                      {value}
                    </dd>
                    {note && <dd className="mt-0.5 text-[11px] leading-none text-gray-400">{note}</dd>}
                  </div>
                ))}
              </dl>
            )}

            {/* One row of round, labelled actions — the same order and look as the app. */}
            <nav aria-label="Tarif işlemleri" className="flex flex-wrap items-start justify-between gap-y-2 sm:max-w-[520px] sm:justify-start sm:gap-x-3">
              <PilotEntryButton slug={recipe.slug} variant="quick" />
              <RecipeKitchenActions variant="quick" recipe={{
                id: recipe.id, slug: recipe.slug, title: recipe.title, image: hasPhoto ? recipe.image : undefined,
                servings, ingredients: recipe.ingredients || [],
              }} />
              <RecipeActions recipeId={recipe.id} title={recipe.title} variant="quick" />
            </nav>
          </div>
        </header>

        {recipe.social_source && <SocialRecipeSourceCard source={recipe.social_source} recipeId={recipe.id} />}

        {/* Personal allergen band: directly above Malzemeler, below the first
            screen on phones, so a late profile answer never moves what the
            reader is looking at. Renders nothing for everyone else. */}
        <RecipeAllergenNotice allergens={recipe.allergens} />

        <RecipeDetailClient recipe={recipe} />
        </BlockedRecipeGate>
      </div>
    </main>
  );
}
