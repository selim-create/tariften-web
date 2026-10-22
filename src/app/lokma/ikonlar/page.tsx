"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Search, X } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { LOKMA_ICON_SAMPLES } from "@/lib/lokma-emoji";

/**
 * Internal, noindex review surface for the Lokma ingredient illustrations
 * (also served at /lokma-katalog). No editing, no AI requests and no account
 * data: an illustration change is reviewed in code after noting its art ID.
 */
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const ALL = "Tümü";
const CATEGORY_NAMES = [...new Set(LOKMA_ICON_SAMPLES.map(item => item.category))];
const CATEGORIES = [ALL, ...CATEGORY_NAMES];
const COUNTS = LOKMA_ICON_SAMPLES.reduce<Record<string, number>>((acc, item) => {
  acc[item.category] = (acc[item.category] || 0) + 1;
  return acc;
}, { [ALL]: LOKMA_ICON_SAMPLES.length });

export default function LokmaIconGallery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [copied, setCopied] = useState("");
  const visible = useMemo(() => {
    const needle = query.toLocaleLowerCase("tr-TR").trim();
    return LOKMA_ICON_SAMPLES.filter(item =>
      (category === ALL || item.category === category)
      && (!needle || (item.name + " " + item.figure + " " + item.category).toLocaleLowerCase("tr-TR").includes(needle))
    );
  }, [category, query]);
  // Grouped by category, in catalogue order, so the page reads like a shelf.
  const groups = CATEGORY_NAMES
    .map(name => ({ name, items: visible.filter(item => item.category === name) }))
    .filter(group => group.items.length > 0);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(""), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
    } catch {
      // The identifier remains visible and selectable without clipboard permissions.
      setCopied("");
    }
  };

  const reset = () => { setQuery(""); setCategory(ALL); };

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Lokma ikonları" kicker="Lokma · İç katalog" title="Mutfağın *küçük* çizimleri."
        actions={
          <Link href="/recipe/import" className={`inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> Tarif stüdyosu
          </Link>
        }>
        Tariflerde kullanılan {LOKMA_ICON_SAMPLES.length} özel SVG çizim, {CATEGORY_NAMES.length} kategoride.
        Değiştirmek istediğin bir çizimin kodunu kopyalayıp iletmen yeterli.
      </PageIntro>

      {/* Search and category filter; stays in reach while scrolling from md up. */}
      <div className="z-30 border-b border-gray-200 bg-[#fcfcfc]/95 backdrop-blur md:sticky md:top-[65px] dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-start">
          <div className="relative md:w-72 md:shrink-0">
            <label htmlFor="lokma-search" className="sr-only">Malzeme ya da ikon kodu ara</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input id="lokma-search" type="search" value={query} onChange={event => setQuery(event.target.value)}
              placeholder="Malzeme ya da ikon kodu ara…" autoComplete="off" enterKeyHint="search"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
          </div>
          <div role="group" aria-label="Malzeme kategorileri"
            className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-1 md:flex-wrap md:overflow-visible md:px-0">
            {CATEGORIES.map(item => (
              <button key={item} type="button" onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${FOCUS} ${category === item
                  ? "border-brand bg-[#fdf1ea] text-[#a8362b] dark:bg-brand/15 dark:text-[#fbc4bd]"
                  : "border-gray-200 bg-white text-slate-700 hover:border-gray-300"}`}>
                {item}
                <span className={`text-xs tabular-nums ${category === item ? "opacity-80" : "text-slate-400"}`}>{COUNTS[item]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div className="flex items-baseline justify-between gap-4 text-sm text-gray-500">
          <span role="status"><strong className="font-semibold text-slate-900">{visible.length}</strong> ikon gösteriliyor</span>
          <span className="hidden sm:block">Koda dokunarak kopyalayabilirsin.</span>
        </div>
        <span className="sr-only" aria-live="polite">{copied ? `${copied} kodu kopyalandı` : ""}</span>

        {groups.map(group => (
          <div key={group.name} className="mt-8 first:mt-6">
            <h2 className="flex items-baseline gap-2 font-heading text-lg font-semibold text-slate-900">
              {group.name} <span className="text-sm font-normal text-gray-500">{group.items.length}</span>
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {group.items.map(item => (
                <li key={item.figure} className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-2.5 transition hover:border-gray-300">
                  <span className="grid h-24 place-items-center rounded-xl bg-[#f6efe8] dark:bg-slate-900/50">
                    <LokmaIngredientIcon name={item.name} size="lg" className="!h-12 !w-12" previewFigure={item.figure} />
                  </span>
                  <h3 className="mt-3 truncate px-1 text-center text-sm font-semibold text-slate-900" title={item.name}>{item.name}</h3>
                  <button type="button" title={"Kod: " + item.figure} aria-label={item.name + " ikon kodunu kopyala"}
                    onClick={() => void copyId(item.figure)}
                    className={`mt-1.5 inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs text-gray-500 transition hover:bg-[#fdf1ea] hover:text-[#a8362b] dark:hover:bg-brand/15 dark:hover:text-[#fbc4bd] ${FOCUS}`}>
                    <code className="truncate">{item.figure}</code>
                    {copied === item.figure
                      ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
                      : <Copy className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="mt-6 flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8] dark:bg-slate-900/50">
              <LokmaIngredientIcon name="tabak" size="xl" previewFigure="plate" />
            </span>
            <h2 className="font-heading text-xl font-semibold text-slate-900">Aradığın malzeme henüz bu koleksiyonda yok.</h2>
            <p className="mt-1 text-sm text-gray-500">Başka bir isim ya da ikon kodu dene.</p>
            <button type="button" onClick={reset}
              className={`mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`}>
              <X className="h-4 w-4" aria-hidden /> Filtreleri temizle
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
