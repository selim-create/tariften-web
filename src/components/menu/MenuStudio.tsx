import Link from "next/link";
import { ChevronRight, Minus, Plus } from "lucide-react";

/**
 * Shared pieces for the menu studio pages (/menu/create, /menu/edit/[slug]):
 * one calm, narrow column with a breadcrumb, an editorial heading and white
 * rounded cards. Same tokens as the auth, kitchen and profile pages.
 */
export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const BTN_PRIMARY = `inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
export const BTN_GHOST = `inline-flex h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900 disabled:opacity-50 ${FOCUS}`;
export const BTN_OUTLINE = `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`;
export const INPUT = "w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 transition focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";
export const LABEL = "mb-1.5 block text-sm font-medium text-slate-700";
export const CHIP = `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition ${FOCUS}`;
export const CHIP_ON = "border-brand bg-[#fdf1ea] text-[#a8362b] dark:bg-brand/15 dark:text-[#fbc4bd]";
export const CHIP_OFF = "border-gray-200 bg-white text-slate-700 hover:border-gray-300";

/** Renders "*accent*" parts of a heading in the brand's italic. */
export function Accent({ text }: { text: string }) {
  return <>{text.split(/\*([^*]+)\*/).map((part, i) => i % 2 === 1
    ? <span key={i} className="italic text-brand">{part}</span>
    : <span key={i}>{part}</span>)}</>;
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Sayfa konumu" className="flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
      {items.map((item, i) => (
        <span key={item.label + i} className={`flex items-center gap-1.5 ${i === items.length - 1 ? "min-w-0" : "shrink-0"}`}>
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />}
          {item.href
            ? <Link href={item.href} className="truncate transition hover:text-brand">{item.label}</Link>
            : <span className="truncate font-medium text-slate-700" aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Minus / value / plus control with 44px buttons. */
export function GuestStepper({ value, min, max, onChange, labelledBy }: {
  value: number; min: number; max: number; onChange: (value: number) => void; labelledBy: string;
}) {
  const safe = Number.isFinite(value) ? value : min;
  return (
    <div role="group" aria-labelledby={labelledBy} className="inline-flex items-center rounded-2xl border border-gray-200 bg-white p-1">
      <button type="button" aria-label="Kişi sayısını azalt" disabled={safe <= min} onClick={() => onChange(Math.max(min, safe - 1))}
        className={`grid h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/10 ${FOCUS}`}>
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <output aria-live="polite" className="min-w-[5.5rem] text-center font-heading text-xl font-semibold tabular-nums text-slate-900">
        {safe} kişi
      </output>
      <button type="button" aria-label="Kişi sayısını artır" disabled={safe >= max} onClick={() => onChange(Math.min(max, safe + 1))}
        className={`grid h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/10 ${FOCUS}`}>
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** Calm inline notices. Text sits in spans so the global `.dark p` rule cannot recolour it. */
export function Notice({ tone, title, children }: { tone: "ok" | "warn" | "error"; title?: string; children: React.ReactNode }) {
  const tones = {
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200",
    warn: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200",
    error: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
  };
  return (
    <div role={tone === "ok" ? "status" : "alert"} className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {title && <strong className="block font-semibold">{title}</strong>}
      <span className={title ? "mt-0.5 block" : "block"}>{children}</span>
    </div>
  );
}
