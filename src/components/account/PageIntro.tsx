import Link from "next/link";
import { ChevronRight } from "lucide-react";

/**
 * Page header for the personal kitchen pages (Dolap, Tarif Defterim, Profil):
 * breadcrumb, kicker, a large title with one *italic* brand accent and a
 * short witty line. Same voice as the homepage SectionHeading.
 */
export default function PageIntro({ crumb, kicker, title, children, actions, aside }: {
  crumb: string; kicker: string; title: string; children?: React.ReactNode; actions?: React.ReactNode; aside?: React.ReactNode;
}) {
  const parts = title.split(/\*([^*]+)\*/);
  return (
    <section className="border-b border-gray-100 bg-[radial-gradient(ellipse_at_top,#fdf1ea_0%,#fcfcfc_65%)] px-4 pb-10 pt-6 sm:pb-14">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Sayfa konumu" className="mb-8 flex items-center gap-1.5 text-xs text-gray-500 sm:mb-12">
          <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
          <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
          <span className="font-medium text-slate-700">{crumb}</span>
        </nav>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 max-w-3xl items-start gap-5">
            {aside}
            <div className="min-w-0">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">{kicker}</p>
              <h1 className="font-heading text-[36px] font-bold leading-[1.04] tracking-[-0.035em] text-slate-900 text-balance [overflow-wrap:anywhere] sm:text-[52px]">
                {parts.map((part, i) => i % 2 === 1
                  ? <span key={i} className="italic text-brand">{part}</span>
                  : <span key={i}>{part}</span>)}
              </h1>
              {children && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-500">{children}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
