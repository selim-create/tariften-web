import { getMenu } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ChevronRight, Users, UtensilsCrossed, CalendarDays } from "lucide-react";
import { MenuActions } from "@/components/menu/MenuClientComponents";
import AuthorCard from "@/components/AuthorCard";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeCover from "@/components/recipe/RecipeCover";
import { isPlaceholderImage } from "@/lib/utils";
import type { Recipe } from "@/types";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug);

  if (!menu) {
    return { title: "Menü Bulunamadı - Tariften" };
  }

  const title = menu.seo?.title || `${menu.title} - Tariften`;
  const description = menu.seo?.description || menu.description;
  const socialImage = menu.image && !isPlaceholderImage(menu.image)
    ? menu.image : "https://tariften.com/og-image.jpg";

  return {
    title,
    description,
    keywords: menu.seo?.keywords,
    openGraph: { title, description, images: [socialImage], type: "article" },
    twitter: { card: "summary_large_image", title, description, images: [socialImage] },
    alternates: { canonical: `https://tariften.com/menu/${menu.slug}` },
  };
}

// Course names as a printed menu would set them, with one honest line each.
const COURSES: Record<string, { title: string; line: string }> = {
  soup: { title: "Çorba", line: "Sofra sıcakla açılır." },
  starter: { title: "Başlangıç", line: "İştahı açmak için." },
  meze: { title: "Mezeler", line: "Ortaya, paylaşmalık." },
  hot_appetizer: { title: "Ara sıcak", line: "Mezeyle ana yemek arasında." },
  salad: { title: "Salata", line: "Ferah bir eşlikçi." },
  side: { title: "Eşlikçiler", line: "Ana yemeğin yanına." },
  main: { title: "Ana yemek", line: "Sofranın yıldızı." },
  dessert: { title: "Tatlı", line: "Mutlu son." },
  drink: { title: "İçecek", line: "Kadehe, bardağa." },
  breakfast_main: { title: "Kahvaltılıklar", line: "Masanın ortasına." },
  breakfast_side: { title: "Kahvaltının yanına", line: "Küçük tabaklar." },
  savory: { title: "Tuzlular", line: "Çayın yanına." },
  sweet: { title: "Tatlılar", line: "Şekerli molası." },
  cold_canape: { title: "Soğuk kanapeler", line: "Tek lokmalık." },
  hot_bites: { title: "Sıcak ikramlar", line: "Fırından yeni çıkmış." },
  dip_sauce: { title: "Dip ve soslar", line: "Banmalık." },
};

export default async function MenuDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await getMenu(slug);

  if (!menu) return notFound();

  const sections = (menu.sections || []).filter(section => (section.recipes || []).length > 0);
  const recipeCount = sections.reduce((sum, section) => sum + section.recipes.length, 0);
  const guests = Number(menu.guest_count);
  const hasPhoto = !isPlaceholderImage(menu.image);
  const concept = menu.concept && menu.concept.trim().toLocaleLowerCase("tr-TR") !== menu.title.trim().toLocaleLowerCase("tr-TR")
    ? menu.concept.trim() : null;

  const facts = [
    recipeCount > 0 && { icon: UtensilsCrossed, label: "Tarif", value: `${recipeCount} tarif` },
    guests > 0 && { icon: Users, label: "Sofra", value: `${guests} kişilik` },
    menu.event_type && { icon: CalendarDays, label: "Öğün", value: menu.event_type },
  ].filter(Boolean) as { icon: typeof Users; label: string; value: string }[];

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24 text-slate-800">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <nav aria-label="Sayfa konumu" className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500 print:hidden">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <Link href="/menus" className="transition hover:text-brand">Menüler</Link>
          <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
          <span className="truncate font-medium text-slate-700">{menu.title}</span>
        </nav>
      </div>

      <header className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 pb-12 pt-6 sm:pt-8 md:grid-cols-2 lg:gap-14 lg:pb-16">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5 ${hasPhoto ? "" : "hidden md:block"}`}>
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={menu.image} alt={menu.title} className="h-full w-full object-cover" />
          ) : (
            <RecipeCover title={menu.title} kicker={menu.event_type || "Menü"} />
          )}
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
            Tariften menüsü{menu.event_type ? ` · ${menu.event_type}` : ""}
          </p>
          <h1 className="font-heading text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 text-balance sm:text-5xl">
            {menu.title}
          </h1>
          {concept && <p className="mt-4 font-heading text-lg italic text-brand">“{concept}”</p>}
          {menu.description && (
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-slate-500">{menu.description}</p>
          )}

          {facts.length > 0 && (
            <dl className="mt-8 flex flex-wrap overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {facts.map(({ icon: Icon, label, value }, i) => (
                <div key={label} className={`flex min-w-[33%] flex-1 flex-col gap-1 px-4 py-3.5 ${i > 0 ? "border-l border-gray-100" : ""}`}>
                  <dt className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-gray-500">
                    <Icon className="h-3.5 w-3.5 text-gray-400" aria-hidden strokeWidth={1.75} /> {label}
                  </dt>
                  <dd className="whitespace-nowrap text-[15px] font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 print:hidden">
            <MenuActions menu={menu} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        {sections.length > 0 ? sections.map((section, idx) => {
          const course = COURSES[section.type] || { title: section.title || "Diğer", line: "Menüye özel." };
          return (
            <section key={`${section.type}-${idx}`} aria-labelledby={`course-${idx}`}
              className="grid gap-6 border-t border-gray-200 py-10 lg:grid-cols-12 lg:gap-10 lg:py-14 print:break-inside-avoid">
              <div className="lg:col-span-3">
                <p className="font-heading text-sm font-semibold text-brand tabular-nums">{String(idx + 1).padStart(2, "0")}</p>
                <h2 id={`course-${idx}`} className="mt-1 font-heading text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
                  {section.title || course.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{course.line} <span className="text-gray-400">· {section.recipes.length} tarif</span></p>
              </div>
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
                {section.recipes.map(recipe => (
                  <RecipeCard key={recipe.id} recipe={recipe as unknown as Recipe} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
                ))}
              </div>
            </section>
          );
        }) : (
          <p className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-slate-500">Bu menüye henüz tarif eklenmemiş.</p>
        )}

        {sections.length > 0 && (
          <section className="mt-4 flex flex-col gap-6 rounded-3xl bg-slate-900 p-6 sm:p-10 md:flex-row md:items-center md:justify-between print:hidden">
            <div>
              <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">Önlük hazır mı?</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Alışveriş listesini al, sonra hangi tarifle başlayacağını seç; pişirme rehberi adım adım eşlik etsin.
              </p>
            </div>
            <MenuActions menu={menu} variant="dark" />
          </section>
        )}

        {menu.author && (
          <div className="mt-10 max-w-md">
            <AuthorCard author={menu.author} label="Menüyü hazırlayan" />
          </div>
        )}
      </div>
    </main>
  );
}
