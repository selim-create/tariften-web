"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Search, Shapes } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { LOKMA_ICON_SAMPLES } from "@/lib/lokma-emoji";

const CATEGORIES = ["Tümü", ...new Set(LOKMA_ICON_SAMPLES.map(item => item.category))];

export default function LokmaIconGallery() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tümü");
  const [copied, setCopied] = useState("");
  const visible = useMemo(() => {
    const needle = query.toLocaleLowerCase("tr-TR").trim();
    return LOKMA_ICON_SAMPLES.filter(item =>
      (category === "Tümü" || item.category === category)
      && (!needle || (item.name + " " + item.figure + " " + item.category).toLocaleLowerCase("tr-TR").includes(needle))
    );
  }, [category, query]);

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
    } catch {
      // The identifier remains visible and selectable without clipboard permissions.
      setCopied("");
    }
  };

  return <main className="min-h-screen bg-[#fffbf7] pb-20 text-[#24202a]">
    <div className="mx-auto max-w-[1240px] px-4 pt-10 sm:px-6">
      <Link href="/recipe/import" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a34b40] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Tarif stüdyosuna dön
      </Link>
      <header className="mt-5 rounded-[28px] border border-[#f0e3d9] bg-white px-5 py-7 shadow-[0_12px_40px_rgba(99,60,43,0.04)] sm:px-9 sm:py-9">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#fff1eb] px-3 py-1.5 text-xs font-bold text-[#bd5245]"><Shapes className="h-4 w-4" /> Lokma İkon Kataloğu</span>
        <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Tariften’in küçük mutfak illüstrasyonları</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#72685f]">Kullanımdaki {LOKMA_ICON_SAMPLES.length} özel SVG çizimin tamamı burada. Beğenmediğin görsellerin altındaki kodu kopyalayıp bana iletebilirsin; isim veya kod üzerinden arama yapabilirsin.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-bold text-[#8b786e]"><span className="rounded-full bg-[#fffbf7] px-3 py-2">{LOKMA_ICON_SAMPLES.length} çizim</span><span className="rounded-full bg-[#fffbf7] px-3 py-2">6 kategori</span><span className="rounded-full bg-[#fffbf7] px-3 py-2">Özgün, vektörel ve küçük boyutlu</span></div>
      </header>
      <section className="mt-6 rounded-[24px] border border-[#f0e3d9] bg-white p-4 sm:p-6" aria-label="İkon kataloğu">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#ad9c90]" />
          <span className="sr-only">Malzeme ya da ikon kodu ara</span>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Malzeme ya da ikon kodu ara…"
            className="h-12 w-full rounded-2xl border border-[#e9ded5] bg-[#fffcf9] pl-12 pr-4 text-sm outline-none focus:border-[#db4c3f] focus:ring-2 focus:ring-[#db4c3f]/10" />
        </label>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Malzeme kategorileri">
          {CATEGORIES.map(item => <button key={item} type="button" onClick={() => setCategory(item)}
            aria-pressed={category === item}
            className={category === item ? "rounded-full bg-[#db4c3f] px-3 py-2 text-xs font-bold text-white" : "rounded-full border border-[#eee2d9] bg-white px-3 py-2 text-xs font-semibold text-[#85776c] hover:border-[#db4c3f] hover:text-[#b6483e]"}>
            {item}
          </button>)}
        </div>
        <div className="mt-6 flex items-center justify-between text-xs text-[#8d7e74]">
          <p><strong className="text-[#352e29]">{visible.length}</strong> ikon gösteriliyor</p>
          <p>Görsel koduna dokunarak kopyalayabilirsin.</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map(item => <article key={item.figure} className="min-w-0 overflow-hidden rounded-[20px] border border-[#eee5dc] bg-[#fffcf9] p-3 text-center transition hover:border-[#dba99b]">
            <div className="mx-auto mb-3 grid h-[100px] w-full place-items-center rounded-[15px] bg-white">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#fff8f0]">
                <LokmaIngredientIcon name={item.name} size="lg" className="!h-12 !w-12" previewFigure={item.figure} />
              </span>
            </div>
            <h2 className="truncate text-sm font-bold">{item.name}</h2>
            <button type="button" title={"Kod: " + item.figure} aria-label={item.name + " ikon kodunu kopyala"}
              onClick={() => void copyId(item.figure)}
              className="mt-2 inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-[#82746a] hover:bg-[#fcece5] hover:text-[#bb5545]">
              <code className="truncate">{item.figure}</code>
              {copied === item.figure ? <Check className="h-3 w-3 shrink-0" /> : <Copy className="h-3 w-3 shrink-0" />}
            </button>
          </article>)}
        </div>
        {visible.length === 0 && <p className="py-12 text-center text-sm text-[#82746a]">Aradığın malzeme henüz bu koleksiyonda yok.</p>}
      </section>
    </div>
  </main>;
}
