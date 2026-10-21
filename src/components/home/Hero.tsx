"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";

// The search box keeps "typing" real kitchen situations: it shows what the
// box can do without a single word of instructions.
const PROMPTS = [
  "Dolapta sadece yumurta ve yoğurt var...",
  "Akşama misafir var, havalı bir şey lazım...",
  "15 dakikada hazırlayabileceğim fit bir tarif...",
  "Canım tatlı çekiyor ama diyetteyim...",
  "İtalyan mutfağından makarna harici ne var?",
  "Buzdolabında yarım kabak ve biraz peynir...",
  "Pazar kahvaltısına sıcak bir şey...",
];

const PILLS = [
  { text: "Elimde avokado var", icon: "avokado" },
  { text: "15 dakikada akşam yemeği", icon: "makarna" },
  { text: "Spor sonrası protein", icon: "yumurta" },
  { text: "Vegan ve glutensiz", icon: "brokoli" },
];

// Signature Lokma miniatures drifting around the headline (desktop only).
const FLOATING = [
  { name: "domates", className: "left-[6%] top-[22%] rotate-[-10deg]", delay: "0s" },
  { name: "limon", className: "left-[14%] top-[62%] rotate-[8deg]", delay: "1.2s" },
  { name: "sarımsak", className: "left-[24%] top-[8%] rotate-[4deg]", delay: "2.1s" },
  { name: "fesleğen", className: "right-[22%] top-[6%] rotate-[-6deg]", delay: "0.6s" },
  { name: "peynir", className: "right-[7%] top-[26%] rotate-[10deg]", delay: "1.8s" },
  { name: "acı biber", className: "right-[13%] top-[64%] rotate-[-14deg]", delay: "2.6s" },
];

function useGreeting() {
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const now = new Date();
      const hour = now.getHours();
      const day = new Intl.DateTimeFormat("tr-TR", { weekday: "long", day: "numeric", month: "long" }).format(now);
      const moment = hour < 11 ? "kahvaltı saati" : hour < 15 ? "öğle arası" : hour < 18 ? "çay saati" : hour < 23 ? "akşam yemeği saati" : "gece atıştırmalığı saati";
      setGreeting(`${day} · ${moment}`);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return greeting;
}

function useTypewriter(lines: string[]) {
  const [text, setText] = useState("");
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = requestAnimationFrame(() => setReduced(media.matches));
    if (media.matches) return () => cancelAnimationFrame(frame);
    let line = 0, length = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = lines[line];
      if (!deleting) {
        length += 1;
        setText(full.slice(0, length));
        if (length >= full.length) { deleting = true; timer = setTimeout(tick, 2200); return; }
        timer = setTimeout(tick, 45 + Math.random() * 35);
      } else {
        length -= 1;
        setText(full.slice(0, length));
        if (length <= 0) { deleting = false; line = (line + 1) % lines.length; timer = setTimeout(tick, 350); return; }
        timer = setTimeout(tick, 22);
      }
    };
    timer = setTimeout(tick, 600);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [lines]);
  return reduced ? lines[0] : text;
}

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const greeting = useGreeting();
  const typed = useTypewriter(PROMPTS);

  const go = (value: string) => {
    const text = value.trim();
    if (text) router.push(`/recipes?q=${encodeURIComponent(text)}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-[radial-gradient(ellipse_at_top,#fdf1ea_0%,#fcfcfc_62%)] px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {FLOATING.map(item => (
          <span key={item.name} className={`lokma-float absolute grid h-[72px] w-[72px] place-items-center rounded-[22px] bg-white/80 shadow-[0_10px_30px_rgba(120,72,48,0.10)] ring-1 ring-[#f1e4da] ${item.className}`}
            style={{ animationDelay: item.delay }}>
            <LokmaIngredientIcon name={item.name} size="xl" />
          </span>
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-3xl text-center">
        <p className="mb-5 h-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand" aria-live="off">
          {greeting}
        </p>
        <h1 className="font-heading text-[44px] font-bold leading-[1.02] tracking-[-0.035em] text-slate-900 sm:text-7xl">
          Bugün ne <span className="italic text-brand">pişiriyoruz?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-slate-500 sm:text-lg">
          Dolabındakini, canının çektiğini ya da kaç dakikan olduğunu yaz. Tarifini bulalım; yoksa birlikte yazalım.
        </p>

        <form role="search" onSubmit={(e) => { e.preventDefault(); go(query); }}
          className={`relative mx-auto mt-9 flex max-w-2xl items-center gap-2 rounded-[22px] border bg-white p-2 pl-5 text-left transition-[box-shadow,border-color] duration-300 ${focused ? "border-brand/40 shadow-[0_18px_50px_rgba(219,76,63,0.16)]" : "border-gray-200 shadow-[0_14px_40px_rgba(15,23,42,0.08)]"}`}>
          <label htmlFor="hero-search" className="sr-only">Malzeme, yemek ya da durum yaz</label>
          <div className="relative min-w-0 flex-1">
            <input
              id="hero-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="peer w-full bg-transparent py-3.5 text-base font-medium text-slate-800 focus:outline-none sm:text-lg"
            />
            {!query && (
              <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center overflow-hidden whitespace-nowrap text-base text-slate-400 sm:text-lg">
                {typed}<span className="ml-px inline-block h-[1.1em] w-[2px] translate-y-[1px] animate-pulse bg-brand" />
              </span>
            )}
          </div>
          <button type="submit"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:px-6">
            Tarif bul <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden />
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {PILLS.map(pill => (
            <button key={pill.text} type="button" onClick={() => go(pill.text)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium text-slate-600 transition hover:-translate-y-0.5 hover:border-brand/40 hover:text-slate-900">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f6efe8]"><LokmaIngredientIcon name={pill.icon} size="sm" /></span>
              {pill.text}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
