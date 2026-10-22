import Link from "next/link";
import Form from "next/form";
import { ArrowRight, BookOpen, House, Search, UtensilsCrossed } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function NotFound() {
  return (
    <main className="bg-[#fcfcfc] px-4 pb-20 pt-14 sm:pb-28 sm:pt-20">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Lokma miniatures around an empty plate: nothing cooked here. */}
        <div aria-hidden className="relative mb-10 h-28 w-40">
          <span className="nf-tile absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[28px] bg-[#f6efe8] ring-1 ring-[#eadfd7]">
            <LokmaIngredientIcon name="tabak" size="xl" previewFigure="plate" />
          </span>
          <span className="nf-tile lokma-float absolute left-0 top-1 grid h-12 w-12 rotate-[-10deg] place-items-center rounded-2xl bg-white ring-1 ring-[#eadfd7]">
            <LokmaIngredientIcon name="domates" size="lg" />
          </span>
          <span className="nf-tile lokma-float absolute bottom-0 right-0 grid h-12 w-12 rotate-[8deg] place-items-center rounded-2xl bg-white ring-1 ring-[#eadfd7] [animation-delay:1.4s]">
            <LokmaIngredientIcon name="limon" size="lg" />
          </span>
        </div>

        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">404 · Sayfa bulunamadı</p>
        <h1 className="font-heading text-[40px] font-bold leading-[1.04] tracking-[-0.035em] text-slate-900 text-balance sm:text-[56px]">
          Eyvah! Yemek <span className="italic text-brand">yandı.</span>
        </h1>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-slate-500">
          Aradığın sayfa bu mutfakta bulunmuyor. Belki silindi, belki de hiç pişirilmedi.
        </p>

        <Form action="/recipes" role="search"
          className="nf-search mt-9 flex w-full max-w-lg items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 pl-4 text-left transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
          <Search className="h-[18px] w-[18px] shrink-0 text-slate-400" aria-hidden />
          <label htmlFor="nf-search" className="sr-only">Tarif ara</label>
          <input id="nf-search" type="search" name="q" autoComplete="off" enterKeyHint="search" placeholder="Bir tarif ya da malzeme ara"
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none" />
          <button type="submit" className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark ${FOCUS}`}>
            Ara <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden />
          </button>
        </Form>

        <nav aria-label="Yardımcı bağlantılar" className="mt-10 grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/recipes" className={`nf-card group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 ${FOCUS}`}>
            <span className="nf-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-brand"><BookOpen className="h-5 w-5" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-slate-900">Tarifler</span>
              <span className="block text-[13px] text-slate-500">Bugün ne pişirsek?</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
          </Link>
          <Link href="/menus" className={`nf-card group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 ${FOCUS}`}>
            <span className="nf-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-brand"><UtensilsCrossed className="h-5 w-5" aria-hidden /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-slate-900">Menüler</span>
              <span className="block text-[13px] text-slate-500">Hazır sofralar</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
          </Link>
        </nav>

        <Link href="/" className={`mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 ${FOCUS}`}>
          <House className="h-4 w-4" aria-hidden /> Anasayfaya dön
        </Link>
      </div>
    </main>
  );
}
