import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Plus } from "lucide-react";
import { getMenusPage } from "@/lib/api";
import MenuCard from "@/components/menu/MenuCard";

export const revalidate = 60;

export default async function MenusArchivePage({ searchParams }: { searchParams: Promise<{ sayfa?: string }> }) {
  const params = await searchParams;
  const requested = Number.parseInt(params?.sayfa || "1", 10);
  const { data: menus, count, pages, page } = await getMenusPage(Number.isFinite(requested) ? requested : 1);
  const pageHref = (n: number) => (n <= 1 ? "/menus" : `/menus?sayfa=${n}`);

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <section className="border-b border-gray-100 bg-[radial-gradient(ellipse_at_top,#fdf1ea_0%,#fcfcfc_65%)] px-4 pb-14 pt-6 sm:pb-20">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Sayfa konumu" className="mb-10 flex items-center gap-1.5 text-xs text-gray-500 sm:mb-14">
            <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
            <span className="font-medium text-slate-700">Menüler</span>
          </nav>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Menüler{count > 0 ? ` · ${count} sofra` : ""}</p>
              <h1 className="font-heading text-[40px] font-bold leading-[1.03] tracking-[-0.035em] text-slate-900 sm:text-6xl">
                Tek tabak değil, <span className="italic text-brand">bütün sofra.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-slate-500 sm:text-lg">
                Çorbadan tatlıya birbirine eşlik eden tariflerle kurulmuş menüler. Akşam yemeği, bayram kahvaltısı ya da kalabalık bir davet; siz sadece misafir listesini yapın.
              </p>
            </div>
            <Link href="/menu/create"
              className="inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-2xl bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-brand-dark lg:self-auto">
              <Plus className="h-4 w-4" aria-hidden /> Kendi menünü kur
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pt-12 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          {menus.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {menus.map(menu => <MenuCard key={menu.id} menu={menu} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
              <p className="font-heading text-xl font-semibold text-slate-900">Bu sayfada menü yok.</p>
              <Link href="/menus" className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark">İlk sayfaya dön</Link>
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Sayfalar" className="mt-16 flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Önceki
                </Link>
              ) : <span />}
              <ol className="flex items-center gap-1 text-sm tabular-nums">
                {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                  <li key={n}>
                    <Link href={pageHref(n)} aria-current={n === page ? "page" : undefined}
                      className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 font-semibold transition ${n === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-gray-100 hover:text-slate-900"}`}>
                      {n}
                    </Link>
                  </li>
                ))}
              </ol>
              {page < pages ? (
                <Link href={pageHref(page + 1)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300">
                  Sonraki <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : <span />}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
