"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, TableOfContents } from "lucide-react";
import type { GuideTocItem } from "@/lib/guides";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Table of contents built from the article's h2s.
 * - `rail`: sticky list beside the article (lg+), following the section in view.
 * - `inline`: a collapsible card above the article (phones / tablets).
 */
export default function GuideToc({ items, variant }: { items: GuideTocItem[]; variant: "rail" | "inline" }) {
  const [active, setActive] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (variant !== "rail" || items.length === 0) return;
    const headings = items.map(item => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;
    // The current section is the last heading that has scrolled past the top third.
    const update = () => {
      const line = window.innerHeight * 0.3;
      let current: string | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading.id;
        else break;
      }
      setActive(current);
    };
    let frame = 0;
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items, variant]);

  if (items.length < 2) return null;

  if (variant === "rail") {
    return (
      <nav aria-label="Bu rehberde" className="max-h-[calc(100vh-8rem)] overflow-y-auto pb-4 [scrollbar-width:thin]">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Bu sayfada</p>
        <ol className="gd-toc space-y-0.5 border-l border-gray-200">
          {items.map(item => {
            const current = active === item.id;
            return (
              <li key={item.id}>
                <a href={`#${item.id}`} aria-current={current ? "location" : undefined}
                  className={`-ml-px block border-l-2 py-1.5 pl-4 text-[13.5px] leading-snug transition ${FOCUS} ${current
                    ? "gd-toc-on border-brand font-semibold text-slate-900"
                    : "border-transparent text-slate-500 hover:border-gray-300 hover:text-slate-900"}`}>
                  {item.text}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  return (
    <details ref={detailsRef} className="gd-toc-card group rounded-2xl border border-gray-200 bg-white">
      <summary className={`flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl px-4 [&::-webkit-details-marker]:hidden ${FOCUS}`}>
        <span className="gd-icon grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f6efe8] text-brand">
          <TableOfContents className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-slate-900">Bu sayfada</span>
          <span className="block text-xs text-gray-500">{items.length} bölüm</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180" aria-hidden />
      </summary>
      <ol className="border-t border-gray-100 px-2 py-2"
        onClick={event => { if ((event.target as HTMLElement).closest("a") && detailsRef.current) detailsRef.current.open = false; }}>
        {items.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={`flex items-baseline gap-3 rounded-xl px-2 py-2.5 text-[15px] leading-snug text-slate-700 transition hover:bg-[#faf7f4] hover:text-slate-900 dark:hover:bg-slate-700/50 ${FOCUS}`}>
              <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-400">{i + 1}</span>
              <span className="min-w-0">{item.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
