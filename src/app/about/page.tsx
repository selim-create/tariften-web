import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Refrigerator, UtensilsCrossed } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Tariften.com, mutfaktaki en büyük yardımcınız olmak için tasarlandı.",
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const LINKS = [
  { href: "/recipes", label: "Tarifler", text: "Bugün ne pişirsek?", icon: BookOpen },
  { href: "/menus", label: "Menüler", text: "Hazır sofralar", icon: UtensilsCrossed },
  { href: "/pantry", label: "Dolabım", text: "Elindekiyle başla", icon: Refrigerator },
];

export default function AboutPage() {
  return (
    <main className="bg-[#fcfcfc] pb-20">
      <PageIntro crumb="Hakkımızda" kicker="Hakkımızda" title="Bugün ne *pişirsem?*" />

      <div className="px-4 pt-10 sm:pt-14"><div className="mx-auto max-w-6xl">
        <div className="max-w-[68ch] space-y-6 text-[17px] leading-[1.75] text-slate-700 sm:text-[18px]">
          <p>
            Tariften.com, mutfaktaki en büyük yardımcınız olmak için tasarlandı. Yapay zeka destekli altyapımız sayesinde, elinizdeki malzemelerle yapabileceğiniz en lezzetli yemekleri saniyeler içinde bulabilirsiniz.
          </p>
          <p>
            Amacımız, mutfaklarda israfı önlemek ve &quot;Bugün ne pişirsem?&quot; sorusuna en pratik, en lezzetli ve en kişisel cevapları vermektir.
          </p>
        </div>

        <nav aria-label="Tariften'i keşfet" className="mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {LINKS.map(({ href, label, text, icon: Icon }) => (
            <Link key={href} href={href}
              className={`group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 ${FOCUS}`}>
              <span className="ab-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-brand"><Icon className="h-5 w-5" aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-slate-900">{label}</span>
                <span className="block text-[13px] text-slate-500">{text}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
            </Link>
          ))}
        </nav>
      </div></div>
    </main>
  );
}
