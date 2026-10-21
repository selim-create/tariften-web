import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getRecipes } from "@/lib/api";
import Hero from "@/components/home/Hero";
import HomeCTA from "@/components/home/HomeCTA";
import MenuShowcase from "@/components/home/MenuShowcase";
import BlogShowcase from "@/components/home/BlogShowcase";
import RecipeCard from "@/components/recipes/RecipeCard";
import { Suspense } from "react";

export const dynamic = 'force-dynamic';

// Links use the live taxonomy names (GET /tariften/v1/terms).
const ASIAN = ['Çin Mutfağı', 'Japon Mutfağı', 'Kore Mutfağı', 'Hint Mutfağı'];
const CUISINES = [
  { name: "Türk Mutfağı", note: "Ev yemekleri, zeytinyağlılar, hamur işleri", href: `/recipes?cuisine=${encodeURIComponent("Türk Mutfağı")}` },
  { name: "İtalyan Mutfağı", note: "Makarna, risotto, fırın yemekleri", href: `/recipes?cuisine=${encodeURIComponent("İtalyan Mutfağı,İtalyan")}` },
  { name: "Asya Mutfağı", note: "Çin, Japon, Kore ve Hint mutfakları", href: `/recipes?cuisine=${encodeURIComponent(ASIAN.join(","))}` },
  { name: "Meksika Mutfağı", note: "Tortilla, salsa, baharatlı tencere", href: `/recipes?cuisine=${encodeURIComponent("Meksika Mutfağı")}` },
];
const SHORTCUTS = [
  { label: "Kolay tarifler", href: "/recipes?difficulty=Kolay" },
  { label: "Düşük karbonhidrat", href: `/recipes?diet=${encodeURIComponent("Düşük Karbonhidrat")}` },
  { label: "Kahvaltı", href: `/recipes?meal_type=${encodeURIComponent("Kahvaltı")}` },
  { label: "Çorbalar", href: `/recipes?meal_type=${encodeURIComponent("Çorba")}` },
  { label: "Tatlılar", href: `/recipes?meal_type=${encodeURIComponent("Tatlı")}` },
  { label: "Vegan", href: "/recipes?diet=Vegan" },
  { label: "Özel gün", href: `/recipes?difficulty=${encodeURIComponent("Şef")}` },
];

function SectionHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-heading text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[28px]">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
          {linkLabel} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default async function Home() {
  const [featured, editors] = await Promise.all([
    getRecipes({ collection: ['Popüler'] }),
    getRecipes({ collection: ['Editörün Seçimi'] }),
  ]);
  const featuredRecipes = (featured?.data || []).slice(0, 3);
  const editorRecipes = (editors?.data || []).slice(0, 4);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col bg-[#fcfcfc]">
      <Hero />

      {featuredRecipes.length > 0 && (
        <section className="px-4 pt-14 sm:pt-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeader title="Öne çıkan tarifler" href="/recipes" linkLabel="Tüm tarifler" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {featuredRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pt-14 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Mutfaklara göz at" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CUISINES.map(cuisine => (
              <Link key={cuisine.name} href={cuisine.href}
                className="group flex min-h-[128px] flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <span className="flex items-start justify-between gap-3">
                  <span className="font-heading text-lg font-semibold text-slate-900">{cuisine.name}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-brand" aria-hidden />
                </span>
                <span className="text-sm leading-snug text-gray-500">{cuisine.note}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {editorRecipes.length > 0 && (
        <section className="px-4 pt-14 sm:pt-16">
          <div className="mx-auto max-w-6xl">
            <SectionHeader title="Editörün seçimi" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {editorRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />)}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pt-14 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <SectionHeader title="Ne arıyorsun?" />
          <div className="flex flex-wrap gap-2">
            {SHORTCUTS.map(item => (
              <Link key={item.label} href={item.href}
                className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-gray-300 hover:text-slate-900">
                {item.label}
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
