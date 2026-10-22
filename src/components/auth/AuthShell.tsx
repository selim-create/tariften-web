import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";

/**
 * Calm split layout for the sign-in pages: a quiet cream brand panel on the
 * left (desktop only) and a single, centred form column. Phones get one
 * column with the logo on top. `panelTitle` marks its accent with *asterisks*.
 */
export default function AuthShell({ panelKicker, panelTitle, panelText, lokma, children }: {
  panelKicker: string; panelTitle: string; panelText: string; lokma: [string, string, string]; children: React.ReactNode;
}) {
  const parts = panelTitle.split(/\*([^*]+)\*/);
  return (
    <main className="fixed inset-0 z-[100] grid min-h-screen grid-cols-1 overflow-y-auto bg-[#fcfcfc] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="au-panel relative hidden flex-col justify-between border-r border-gray-200 bg-[#f6efe8] px-12 py-10 lg:flex xl:px-16">
        <Link href="/" className="inline-flex w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <Image src="/logo.svg" alt="Tariften anasayfa" width={150} height={40} priority className="au-logo h-9 w-auto" />
        </Link>

        <div className="max-w-md">
          <div aria-hidden className="mb-10 flex gap-3">
            {lokma.map((name, i) => (
              <span key={name} className={`au-tile grid h-16 w-16 place-items-center rounded-[20px] bg-white ring-1 ring-[#eadfd7] ${i === 1 ? "-translate-y-2" : ""}`}>
                <LokmaIngredientIcon name={name} size="lg" />
              </span>
            ))}
          </div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">{panelKicker}</p>
          <h2 className="font-heading text-[40px] font-bold leading-[1.06] tracking-[-0.035em] text-slate-900 text-balance">
            {parts.map((part, i) => i % 2 === 1
              ? <span key={i} className="italic text-brand">{part}</span>
              : <span key={i}>{part}</span>)}
          </h2>
          <p className="mt-5 text-[17px] leading-relaxed text-slate-600">{panelText}</p>
        </div>

        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} Tariften bir{" "}
          <a href="https://hipmedya.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 underline-offset-2 hover:text-brand hover:underline">Hip Medya</a>{" "}
          markasıdır.
        </p>
      </aside>

      <div className="flex min-h-full flex-col px-4 pb-10 pt-6 sm:px-8 lg:px-16">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand lg:hidden">
            <Image src="/logo.svg" alt="Tariften anasayfa" width={130} height={34} className="au-logo h-8 w-auto" />
          </Link>
          <Link href="/" className="ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Anasayfa
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10 sm:py-14">
          {children}
        </div>
      </div>
    </main>
  );
}

/** Page heading inside the form column. */
export function AuthHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-heading text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-slate-900 sm:text-[36px]">{title}</h1>
      {children && <p className="mt-2 text-[15px] leading-relaxed text-slate-500">{children}</p>}
    </div>
  );
}
