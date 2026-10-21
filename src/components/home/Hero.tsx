"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const SUGGESTIONS = [
  "Elimde avokado var",
  "15 dakikada akşam yemeği",
  "Spor sonrası protein",
  "Vegan ve glutensiz",
];

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const go = (text: string) => {
    const value = text.trim();
    if (value) router.push(`/recipes?q=${encodeURIComponent(value)}`);
  };

  return (
    <section className="border-b border-gray-100 px-4 pb-16 pt-16 sm:pb-20 sm:pt-24">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h1 className="font-heading text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-6xl">
          Bugün ne <span className="text-brand">pişiriyoruz?</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-gray-500">
          Elindeki malzemeleri ya da canının çektiği yemeği yaz. Tarifini bulalım; yoksa birlikte oluşturalım.
        </p>

        <form role="search" onSubmit={(e) => { e.preventDefault(); go(query); }}
          className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.06)] focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
          <Search className="ml-3 h-5 w-5 shrink-0 text-gray-400" aria-hidden />
          <label htmlFor="hero-search" className="sr-only">Malzeme ya da tarif ara</label>
          <input
            id="hero-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Örn. dolapta yumurta ve yoğurt var"
            className="min-w-0 flex-1 bg-transparent px-1 py-3 text-base text-slate-800 placeholder:text-gray-400 focus:outline-none sm:text-lg"
          />
          <button type="submit" className="h-12 shrink-0 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark sm:px-6 sm:text-[15px]">
            Tarif bul
          </button>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map(text => (
            <button key={text} type="button" onClick={() => go(text)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-gray-300 hover:text-slate-900">
              {text}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
