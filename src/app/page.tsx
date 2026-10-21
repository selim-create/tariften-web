import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { getRecipes } from "@/lib/api";
import type { Recipe } from "@/types";
import Hero from "@/components/home/Hero";
import HomeCTA from "@/components/home/HomeCTA";
import MenuShowcase from "@/components/home/MenuShowcase";
import BlogShowcase from "@/components/home/BlogShowcase";
import SectionHeading from "@/components/home/SectionHeading";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { lokmaDishName } from "@/lib/lokma-emoji";
import { isPlaceholderImage } from "@/lib/utils";

export const dynamic = 'force-dynamic';

// Links use the live taxonomy names (GET /tariften/v1/terms).
const ASIAN = ['Çin Mutfağı', 'Japon Mutfağı', 'Kore Mutfağı', 'Hint Mutfağı'];
const CUISINES = [
  { name: "Türk Mutfağı", terms: ["Türk Mutfağı"], icon: "domates", note: "Zeytinyağlılar, hamur işleri, tencere yemekleri" },
  { name: "İtalyan Mutfağı", terms: ["İtalyan Mutfağı", "İtalyan"], icon: "makarna", note: "Makarna, risotto, fırın" },
  { name: "Asya Mutfağı", terms: ASIAN, icon: "pirinç", note: "Çin, Japon, Kore, Hint" },
  { name: "Meksika Mutfağı", terms: ["Meksika Mutfağı"], icon: "avokado", note: "Tortilla, salsa, acı sos" },
];

const MOODS = [
  { label: "Fit & Sağlıklı", line: "Hafif ama doyurucu", icon: "brokoli", href: `/recipes?diet=${encodeURIComponent("Düşük Karbonhidrat")}` },
  { label: "Üşengeç Şef", line: "Az emek, az bulaşık", icon: "yumurta", href: "/recipes?difficulty=Kolay" },
  { label: "Ziyafet", line: "Misafire göster", icon: "dana eti", href: `/recipes?difficulty=${encodeURIComponent("Şef")}` },
  { label: "Tatlı Krizi", line: "Bir dilim yeter mi?", icon: "çikolata", href: `/recipes?meal_type=${encodeURIComponent("Tatlı")}` },
  { label: "Acı Sever", line: "Biberi eksik olmasın", icon: "acı biber", href: `/recipes?q=${encodeURIComponent("acı biber")}` },
  { label: "Pazar Kahvaltısı", line: "Uzun, sıcak, kalabalık", icon: "bal", href: `/recipes?meal_type=${encodeURIComponent("Kahvaltı")}` },
];

function minutesOf(recipe: Recipe): number {
  const total = (Number(recipe.prep_time) || 0) + (Number(recipe.cook_time) || 0);
  return total > 0 ? total : 0;
}

/** Image-led card with the title over the photo; cream + Lokma art when there is no photo. */
function FeatureCard({ recipe, large = false, sizes }: { recipe: Recipe; large?: boolean; sizes: string }) {
  const photo = !isPlaceholderImage(recipe.image);
  const minutes = minutesOf(recipe);
  const kicker = recipe.cuisine?.[0] || recipe.meal_type?.[0];
  return (
    <Link href={`/recipe/${recipe.slug}`}
      className={`group relative block h-full overflow-hidden rounded-3xl ring-1 ring-black/5 ${photo ? "bg-slate-900" : "bg-[#f6efe8]"} ${large ? "min-h-[360px] lg:min-h-[520px]" : "min-h-[240px]"}`}>
      {photo ? (
        <>
          <Image src={recipe.image} alt="" fill unoptimized sizes={sizes}
            className="object-cover transition duration-700 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center pb-16">
          <span className="scale-[1.6]"><LokmaIngredientIcon name={lokmaDishName(recipe.title)} size="xl" /></span>
        </div>
      )}
      <div className={`absolute inset-x-0 bottom-0 p-5 sm:p-6 ${photo ? "text-white" : "text-slate-900"}`}>
        {kicker && <p className={`mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${photo ? "text-white/80" : "text-brand"}`}>{kicker}</p>}
        <h3 className={`font-heading font-bold leading-[1.12] tracking-[-0.015em] ${large ? "text-2xl sm:text-[32px]" : "text-lg sm:text-xl"} line-clamp-3`}>
          {recipe.title}
        </h3>
        {minutes > 0 && (
          <p className={`mt-2 inline-flex items-center gap-1.5 text-xs tabular-nums ${photo ? "text-white/80" : "text-slate-500"}`}>
            <Clock3 className="h-3.5 w-3.5" aria-hidden /> {minutes} dk
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function Home() {
  const [featured, editors, ...cuisineResults] = await Promise.all([
    getRecipes({ collection: ['Popüler'] }),
    getRecipes({ collection: ['Editörün Seçimi'] }),
    ...CUISINES.map(cuisine => getRecipes({ cuisine: cuisine.terms })),
  ]);
  const featuredRecipes = (featured?.data || []).slice(0, 3);
  const editorRecipes = (editors?.data || []).slice(0, 4);
  const cuisines = CUISINES.map((cuisine, i) => {
    const result = cuisineResults[i];
    const cover = (result?.data || []).find(r => !isPlaceholderImage(r.image));
    return { ...cuisine, cover: cover?.image || null, count: result?.count || 0 };
  });

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#fcfcfc] pb-8">
      <Hero />

      {featuredRecipes.length > 0 && (
        <section className="px-4 pt-16 sm:pt-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeading kicker="Öne çıkanlar" title="Bu hafta bunları *pişiriyoruz*" href="/recipes" linkLabel="Tüm tarifler">
              Mutfak ekibinin bu hafta masaya koyduğu tarifler.
            </SectionHeading>
            <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <FeatureCard recipe={featuredRecipes[0]} large sizes="(min-width: 1024px) 58vw, 100vw" />
              </div>
              {featuredRecipes.length > 1 && (
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:col-span-5 lg:grid-cols-1">
                  {featuredRecipes.slice(1).map(recipe => (
                    <FeatureCard key={recipe.id} recipe={recipe} sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pt-16 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading kicker="Mutfaklar" title="Vizesiz *dünya turu*">
            Pasaport gerekmez; tava yeter.
          </SectionHeading>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {cuisines.map(cuisine => (
              <Link key={cuisine.name} href={`/recipes?cuisine=${encodeURIComponent(cuisine.terms.join(","))}`}
                className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-3xl p-4 ring-1 ring-black/5 sm:p-5 ${cuisine.cover ? "bg-slate-900 text-white" : "bg-[#f6efe8] text-slate-900"}`}>
                {cuisine.cover ? (
                  <>
                    <Image src={cuisine.cover} alt="" fill unoptimized sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.05]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  </>
                ) : (
                  <span className="absolute inset-0 grid place-items-center pb-12"><LokmaIngredientIcon name={cuisine.icon} size="xl" /></span>
                )}
                <ArrowUpRight className="absolute right-4 top-4 h-5 w-5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                <div className="relative">
                  <h3 className="font-heading text-lg font-bold leading-tight sm:text-2xl">{cuisine.name}</h3>
                  <p className={`mt-1 text-xs sm:text-sm ${cuisine.cover ? "text-white/80" : "text-slate-500"}`}>
                    {cuisine.count > 0 ? `${cuisine.count} tarif · ` : ""}{cuisine.note}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {editorRecipes.length > 0 && (
        <section className="px-4 pt-16 sm:pt-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeading kicker="Şefin tavsiyesi" title="Editörün *seçtikleri*" href="/recipes" linkLabel="Daha fazlası">
              Denedik, beğendik, buraya koyduk.
            </SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
              {editorRecipes.map(recipe => (
                <div key={recipe.id} className="h-[300px]">
                  <FeatureCard recipe={recipe} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mt-16 bg-[#f8f1ea] px-4 py-16 sm:mt-24 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading kicker="Ruh haline göre" title="Hangi *moddasın?*" align="center">
            Bazı günler ziyafet, bazı günler tek tava. İkisi de tamam.
          </SectionHeading>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {MOODS.map(mood => (
              <Link key={mood.label} href={mood.href}
                className="group flex flex-col items-center rounded-3xl bg-white px-3 pb-5 pt-6 text-center ring-1 ring-[#eadfd5] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(120,72,48,0.12)]">
                <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#f6efe8] transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">
                  <LokmaIngredientIcon name={mood.icon} size="lg" className="scale-[1.35]" />
                </span>
                <span className="font-heading text-[15px] font-bold text-slate-900">{mood.label}</span>
                <span className="mt-1 text-xs text-slate-500">{mood.line}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <BlogShowcase />
      </Suspense>

      <MenuShowcase />

      <HomeCTA />
    </main>
  );
}
