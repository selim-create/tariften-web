import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Editorial section heading: a small kicker, a large title with one italic
 * brand-coloured accent, an optional witty line and a quiet link.
 * `title` uses *asterisks* to mark the accent: "Vizesiz *dünya turu*".
 */
export default function SectionHeading({ kicker, title, children, href, linkLabel, align = "left" }: {
  kicker: string; title: string; children?: React.ReactNode; href?: string; linkLabel?: string; align?: "left" | "center";
}) {
  const parts = title.split(/\*([^*]+)\*/);
  const centered = align === "center";
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:mb-10 ${centered ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between"}`}>
      <div className={centered ? "max-w-3xl" : "max-w-2xl"}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">{kicker}</p>
        <h2 className="font-heading text-[32px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[44px]">
          {parts.map((part, i) => i % 2 === 1
            ? <span key={i} className="italic text-brand">{part}</span>
            : <span key={i}>{part}</span>)}
        </h2>
        {children && <p className="mt-3 text-[17px] leading-relaxed text-slate-500">{children}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-900 transition hover:text-brand">
          {linkLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
