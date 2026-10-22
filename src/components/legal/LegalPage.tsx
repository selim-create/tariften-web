import Link from "next/link";
import { ChevronDown, ChevronRight, Mail } from "lucide-react";

export type LegalSection = { id: string; label: string };

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Shared frame for the legal texts (KVKK, Gizlilik, Kullanım Koşulları):
 * a calm intro band, a table of contents (sticky aside on desktop, a
 * collapsible list on phones) and a ~68ch reading column. The legal text
 * itself is passed through verbatim as children.
 */
export default function LegalPage({ kicker, title, updated, sections, children }: {
  kicker: string; title: string; updated: string; sections: LegalSection[]; children: React.ReactNode;
}) {
  return (
    <main className="bg-[#fcfcfc] pb-20">
      <header className="border-b border-gray-100 bg-[radial-gradient(ellipse_at_top,#fdf1ea_0%,#fcfcfc_65%)] px-4 pb-10 pt-6 sm:pb-14">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Sayfa konumu" className="mb-8 flex items-center gap-1.5 text-xs text-gray-500 sm:mb-12">
            <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
            <span className="font-medium text-slate-700">{kicker}</span>
          </nav>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">{kicker}</p>
          <h1 className="max-w-4xl font-heading text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-900 text-balance [overflow-wrap:anywhere] sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-4 text-sm text-slate-500">{updated}</p>
        </div>
      </header>

      <div className="px-4 pt-8 sm:pt-12"><div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside className="mb-10 lg:mb-0">
          <details className="lg-toc group rounded-2xl border border-gray-200 bg-white lg:hidden">
            <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden ${FOCUS}`}>
              İçindekiler
              <ChevronDown className="h-4 w-4 text-slate-400 transition group-open:rotate-180" aria-hidden />
            </summary>
            <TocList sections={sections} className="border-t border-gray-100 px-2 py-2" />
          </details>
          <nav aria-label="İçindekiler" className="sticky top-24 hidden lg:block">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">İçindekiler</p>
            <TocList sections={sections} className="-ml-3 border-l border-gray-200" />
          </nav>
        </aside>

        <article className="lg-body max-w-[68ch] text-[16px] leading-[1.75] text-slate-700 sm:text-[17px]">
          {children}
        </article>
      </div></div>
    </main>
  );
}

function TocList({ sections, className = "" }: { sections: LegalSection[]; className?: string }) {
  return (
    <ol className={className}>
      {sections.map(section => (
        <li key={section.id}>
          <a href={`#${section.id}`}
            className={`block rounded-lg px-3 py-2 text-[13px] leading-snug text-slate-500 transition hover:text-brand lg:-ml-px lg:rounded-none lg:border-l lg:border-transparent lg:hover:border-brand ${FOCUS}`}>
            {section.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** One numbered part of a legal text. `scroll-mt` keeps the heading clear of the sticky header. */
export function LegalSectionBlock({ id, title, children }: { id: string; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="lg-sec mb-12 scroll-mt-24 last:mb-0">
      <h2 id={`${id}-title`} className="mb-4 font-heading text-[22px] font-semibold leading-snug tracking-[-0.015em] text-slate-900 sm:text-[24px]">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Quiet highlighted note inside a legal text (data controller, summary, notices). */
export function LegalNote({ title, children }: { title?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="lg-note rounded-2xl border border-[#eadfd7] bg-[#fbf7f3] px-5 py-4 sm:px-6 sm:py-5">
      {title && <p className="lg-note-title mb-1.5 text-sm font-semibold text-slate-900">{title}</p>}
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

/** Contact card at the end of every legal text. */
export function LegalContact({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="lg-contact mt-14 flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-brand lg-icon"><Mail className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0 space-y-3 text-[15px] leading-relaxed text-slate-600">
        {title && <h2 className="font-heading text-base font-semibold text-slate-900">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export const LEGAL_LINK = "font-medium text-brand underline-offset-2 hover:underline";
