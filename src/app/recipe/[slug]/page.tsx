import { getRecipe } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock3, CookingPot, Flame, Gauge, Users } from "lucide-react";
import RecipeDetailClient from "@/components/recipe/RecipeDetailClient";
import SocialRecipeSourceCard from "@/components/recipe/SocialRecipeSourceCard";
import PilotEntryButton from "@/components/pilot/PilotEntryButton";
import RecipeActions from "@/components/recipe/RecipeActions";
import RecipeKitchenActions from "@/components/recipe/RecipeKitchenActions";
import EditButton from "@/components/recipe/EditButton";
import RecipeReviewNotice from "@/components/recipe/RecipeReviewNotice";
import RecipeCover from "@/components/recipe/RecipeCover";
import SocialPlatformBadge from "@/components/recipe/SocialPlatformBadge";
import SocialHeroSourceButton from "@/components/recipe/SocialHeroSourceButton";
import { Metadata } from 'next';
import RecipeJsonLd from '@/components/RecipeJsonLd';
import { isPlaceholderImage } from "@/lib/utils";
import RejindeBanner from '@/components/RejindeBanner';

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

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) {
    return {
      title: 'Tarif Bulunamadı',
    };
  }

  const seoTitle = recipe.seo?.title || recipe.title;
  const seoDescription = recipe.seo?.description || recipe.excerpt;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      url: `https://tariften.com/recipe/${recipe.slug}`,
      images: [
        {
          url: recipe.image,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [recipe.image],
    },
    alternates: {
      canonical: `https://tariften.com/recipe/${recipe.slug}`,
    },
  };
}

export default async function RecipeDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) {
    notFound();
  }

  const videoId = getYoutubeVideoId(recipe.image);
  const hasPhoto = !videoId && !isPlaceholderImage(recipe.image);
  // Social imports have a real source; only unsourced stock/placeholder
  // recipes are labelled as an AI suggestion.
  const isAiRecipe = !recipe.social_source && (
    recipe.image.includes("placehold.co") ||
    recipe.image.includes("images.unsplash.com") ||
    recipe.image.includes("pexels.com"));

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
      value: `${caloriesVerified ? "" : "≈"}${calories} kcal`,
      note: caloriesVerified ? undefined : "tahmini",
      hint: caloriesVerified ? "Doğrulanmış besin analizi" : "AI tahmini; besin veritabanıyla doğrulanmadı",
    },
    difficulty && { icon: Gauge, label: "Zorluk", value: difficulty },
  ].filter(Boolean) as { icon: typeof Clock3; label: string; value: string; hint?: string; note?: string }[];

  const taxonomy = [
    ...(recipe.meal_type || []).map(m => ({ label: m, href: `/recipes?meal_type=${encodeURIComponent(m)}` })),
    ...(recipe.cuisine || []).map(c => ({ label: c, href: `/recipes?cuisine=${encodeURIComponent(c)}` })),
    ...(recipe.diet || []).map(d => ({ label: d, href: `/recipes?diet=${encodeURIComponent(d)}` })),
  ];

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24 font-sans text-slate-800">
      <RecipeJsonLd recipe={recipe} />

      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <nav aria-label="Sayfa konumu" className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <Link href="/recipes" className="transition hover:text-brand">Tarifler</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <span className="truncate font-medium text-slate-700">{recipe.title}</span>
        </nav>
      </div>

      <div className="container mx-auto max-w-6xl px-4 pt-6 sm:pt-8">
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

            <h1 className="mb-5 font-heading text-[34px] font-bold leading-[1.08] tracking-[-0.025em] text-slate-900 text-balance sm:text-5xl">
              {recipe.title}
            </h1>

            {recipe.excerpt && (
              <p className="mb-8 max-w-xl text-[17px] leading-relaxed text-gray-500">
                {recipe.excerpt}
              </p>
            )}

            {facts.length > 0 && (
              <dl className="mb-8 grid grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-white sm:flex sm:divide-x sm:divide-gray-100">
                {facts.map(({ icon: Icon, label, value, hint, note }, i) => (
                  <div key={label} title={hint}
                    className={`flex flex-1 flex-col gap-1 px-4 py-3.5 ${i % 2 === 1 ? "border-l border-gray-100 sm:border-l-0" : ""} ${i > 1 ? "border-t border-gray-100 sm:border-t-0" : ""}`}>
                    <dt className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-gray-500">
                      <Icon className="h-3.5 w-3.5 text-gray-400" aria-hidden strokeWidth={1.75} />
                      {label}
                    </dt>
                    <dd className="whitespace-nowrap text-[15px] font-semibold text-slate-900 tabular-nums">
                      {value}
                      {note && <span className="ml-1 text-[11px] font-normal text-gray-500">{note}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <PilotEntryButton slug={recipe.slug} />
              <RecipeActions recipeId={recipe.id} title={recipe.title} />
            </div>

            <div className="mt-3">
              <RecipeKitchenActions recipe={{
                id: recipe.id, slug: recipe.slug, title: recipe.title, image: hasPhoto ? recipe.image : undefined,
                servings, ingredients: recipe.ingredients || [],
              }} />
            </div>
          </div>
        </header>

        {recipe.social_source && <SocialRecipeSourceCard source={recipe.social_source} recipeId={recipe.id} />}

        <RecipeDetailClient recipe={recipe} />
      </div>
    </main>
  );
}
