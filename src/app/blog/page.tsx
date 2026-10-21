import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getBlogCategories, getBlogPosts } from "@/lib/api";
import BlogList from "@/components/blog/BlogList";

export const metadata: Metadata = {
  title: 'Blog & Mutfak Sırları | Tariften',
  description: 'Mutfak tüyoları, teknikler, malzemeler ve mutfağın arkasındaki küçük bilimler Tariften blogunda.',
  openGraph: {
    title: 'Blog & Mutfak Sırları | Tariften',
    description: 'Mutfak tüyoları, teknikler ve mutfağın arkasındaki küçük bilimler.',
    type: 'website',
    url: 'https://tariften.com/blog',
    images: ['/og-image.jpg'],
  },
  alternates: { canonical: 'https://tariften.com/blog' },
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const params = await searchParams;
  const categories = await getBlogCategories();
  const active = categories.find(c => c.slug === params?.kategori) || null;
  const { data: posts, totalPages, total } = await getBlogPosts(1, 9, active?.id);

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <section className="border-b border-gray-100 bg-[radial-gradient(ellipse_at_top,#fdf1ea_0%,#fcfcfc_65%)] px-4 pb-12 pt-6 sm:pb-16">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Sayfa konumu" className="mb-10 flex items-center gap-1.5 text-xs text-gray-500 sm:mb-14">
            <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
            <span className="font-medium text-slate-700">Blog</span>
          </nav>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
            Mutfaktan blog{total > 0 ? ` · ${total} yazı` : ""}
          </p>
          <h1 className="max-w-4xl font-heading text-[40px] font-bold leading-[1.03] tracking-[-0.035em] text-slate-900 sm:text-6xl">
            Tabaktan önce <span className="italic text-brand">okumalık.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-500 sm:text-lg">
            Teknikler, malzemeler ve mutfağın arkasındaki küçük bilimler. Kısa okumalar, uzun lezzetler.
          </p>

          {categories.length > 1 && (
            <nav aria-label="Kategoriler" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <Link href="/blog" aria-current={!active ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${!active ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:text-slate-900"}`}>
                Tümü
              </Link>
              {categories.map(category => {
                const current = active?.id === category.id;
                return (
                  <Link key={category.id} href={`/blog?kategori=${encodeURIComponent(category.slug)}`} aria-current={current ? "page" : undefined}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${current ? "border-slate-900 bg-slate-900 text-white" : "border-gray-200 bg-white text-slate-600 hover:border-gray-300 hover:text-slate-900"}`}>
                    {category.name} <span className={current ? "text-white/60" : "text-gray-400"}>{category.count}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </section>

      <section className="px-4 pt-12 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          {posts.length > 0 ? (
            <BlogList key={active?.id ?? "all"} initialPosts={posts} totalPages={totalPages} categoryId={active?.id} />
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
              <p className="font-heading text-xl font-semibold text-slate-900">Bu bölümde henüz yazı yok.</p>
              <Link href="/blog" className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark">Tüm yazılara dön</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
