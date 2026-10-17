"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Palette } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { LOKMA_ICON_SAMPLES } from "@/lib/lokma-emoji";

/**
 * Visual review surface only: no editing/saving of user recipes,
 * no AI requests and no access to private account data.
 * An illustration change is reviewed in code after comparing the art IDs.
 */
export default function LokmaCatalogPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const categories = ["Tümü", ...new Set(LOKMA_ICON_SAMPLES.map(item => item.category))];
  const filtered = useMemo(() => LOKMA_ICON_SAMPLES.filter(item =>
    (category === "Tümü" || item.category === category)
    && [item.name, item.figure, item.category].join(" ").toLocaleLowerCase("tr-TR")
      .includes(query.trim().toLocaleLowerCase("tr-TR"))
  ), [category, query]);

  return <main className="min-h-screen bg-[#fffbf7] px-4 py-10 text-[#252729] sm:px-6">
    <div className="mx-auto max-w-6xl">
      <Link href="/recipe/import" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#c44c41] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Tarif stüdyosuna dön
      </Link>
      <div className="rounded-[28px] border border-[#eee2d8] bg-white p-6 shadow-[0_12px_35px_rgba(66,39,24,.04)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#d45749]"><Palette className="h-4 w-4" /> Tariften · Lokma</div>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-[#1b2435]">Malzeme ikonları kataloğu</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7b7169]">Tariften'in tariflerde kullandığı bütün özel çizimleri burada yan yana görebilirsin. Değiştirmek istediğin görselin kodunu not etmen yeterli.</p>
          </div>
          <div className="rounded-2xl bg-[#fff1ec] px-4 py-3 text-center">
            <div className="text-2xl font-black text-[#cf4a3e]">{LOKMA_ICON_SAMPLES.length}</div>
            <div className="text-[11px] font-semibold text-[#a86a60]">özel çizim</div>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block flex-1">
            <span className="sr-only">Malzeme ya da ikon koduyla ara</span>
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} type="search" placeholder="Malzeme veya ikon kodu ara…"
              className="min-h-11 w-full rounded-xl border border-[#eadfd7] bg-[#fffcf9] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10" />
          </label>
          <label className="block">
            <span className="sr-only">Kategori seç</span>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-[#eadfd7] bg-[#fffcf9] px-4 py-3 text-sm outline-none focus:border-[#db4c3f] sm:w-60">
              {categories.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
        <p className="mt-4 text-xs font-medium text-[#8b8078]">{filtered.length} ikon gösteriliyor · Çizimler gerçek tarif kartlarındaki SVG bileşeninden geliyor.</p>
      </div>

      {filtered.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map(item => <article key={item.figure} className="group rounded-[22px] border border-[#efe4dc] bg-white p-4 text-center transition hover:border-[#debfb2] hover:shadow-[0_10px_25px_rgba(66,39,24,.06)]">
          <div className="mx-auto mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-[22px] bg-[#fff8f2]">
            <div className="scale-[2.3]"><LokmaIngredientIcon name={item.name} size="lg" /></div>
          </div>
          <h2 className="truncate text-sm font-bold text-[#273045]" title={item.name}>{item.name}</h2>
          <p className="mt-1 truncate text-[10px] text-[#9a8171]">{item.category}</p>
          <code className="mt-3 inline-block max-w-full truncate rounded-md bg-[#f7f4ef] px-2 py-1 text-[10px] text-[#a2584b]">{item.figure}</code>
        </article>)}
      </div> : <div className="mt-5 rounded-2xl border border-[#eee2d8] bg-white p-12 text-center text-sm text-slate-500">Bu aramayla eşleşen bir ikon bulunamadı.</div>}
    </div>
  </main>;
}
