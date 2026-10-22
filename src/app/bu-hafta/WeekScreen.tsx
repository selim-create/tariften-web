"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import WeekPlanner, { type RecipeIngredientsLoader } from "@/components/kitchen/WeekPlanner";
import { ErrorCard, LoadingState, SignInPrompt } from "@/components/kitchen/KitchenParts";
import { useKitchen } from "@/context/KitchenContext";
import { getRecipe } from "@/lib/api";

/** Fetches the recipe at click time so the list gets its current ingredient rows. */
const loadRecipe: RecipeIngredientsLoader = async (slug) => {
  const recipe = await getRecipe(slug);
  if (!recipe) return null;
  const servings = Number(recipe.servings);
  return {
    id: recipe.id, slug: recipe.slug, title: recipe.title,
    servings: Number.isFinite(servings) && servings > 0 ? servings : null,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
  };
};

export default function WeekScreen() {
  const kitchen = useKitchen();
  const shoppingCount = kitchen.state.shopping.length;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Bu Hafta" kicker="Bu hafta" title="Haftanın *sofrası.*"
        actions={kitchen.signedIn ? (
          <Link href="/alisveris" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <ShoppingBasket className="h-4 w-4" aria-hidden /> Alışveriş listesi
            {shoppingCount > 0 && <span className="text-xs font-normal text-gray-500 tabular-nums">{shoppingCount} tarif</span>}
          </Link>
        ) : undefined}>
        Ne pişireceğini güne yerleştir, malzemeleri tek seferde listene al. Telefonda da aynı plan.
      </PageIntro>

      <div className="mx-auto max-w-4xl px-4 pt-8">
        {kitchen.authLoading ? (
          <LoadingState label="Planın açılıyor…" />
        ) : !kitchen.signedIn ? (
          <SignInPrompt icon="tabak" callbackPath="/bu-hafta" title="Haftanı planlamak için giriş yap."
            text="Plan hesabına kaydedilir; Tariften uygulamasında eklediklerin burada, burada eklediklerin uygulamada görünür." />
        ) : !kitchen.snapshot.loaded ? (
          kitchen.snapshot.status === "error"
            ? <ErrorCard message={kitchen.snapshot.error} onRetry={kitchen.refresh} />
            : <LoadingState label="Planın getiriliyor…" />
        ) : (
          <WeekPlanner kitchen={kitchen} loadRecipe={loadRecipe} />
        )}
      </div>
    </main>
  );
}

