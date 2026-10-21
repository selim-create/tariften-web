"use client";

import Link from "next/link";
import { ArrowRight, BookmarkCheck, CookingPot, Link2, Refrigerator } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const TOOLS = [
  { href: "/pantry", title: "Dolap Modu", text: "Evdeki malzemelerle yapılabilecek tarifler.", icon: Refrigerator },
  { href: "/recipe/aktar", title: "Tarif aktar", text: "Reels, TikTok ya da YouTube bağlantısından tarif.", icon: Link2 },
  { href: "/cookbook", title: "Tarif defteri", text: "Kaydettiğin ve pişirdiğin tarifler bir arada.", icon: BookmarkCheck },
  { href: "/recipes", title: "Pişirme rehberi", text: "Her tarifte adım adım, sesli ve eller serbest.", icon: CookingPot },
] as const;

/** One calm closing block: the product's real tools, no rotating banners. */
export default function HomeCTA() {
  const { user } = useAuth();
  const firstName = user?.user_display_name?.trim().split(/\s+/)[0];

  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900 p-6 sm:p-10 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f08a7f]">
              {firstName ? `Merhaba ${firstName}` : "Tariften'de neler var"}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
              Mutfakta karar vermeyi kolaylaştıran araçlar.
            </h2>
            {!user && (
              <Link href="/register" className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-semibold text-slate-900 transition hover:bg-gray-100">
                Standart Üye ol <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TOOLS.map(({ href, title, text, icon: Icon }) => (
              <Link key={href} href={href}
                className="group flex gap-4 rounded-2xl border border-slate-800 p-5 transition hover:border-slate-700 hover:bg-slate-800/60">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#f08a7f]" aria-hidden />
                <span>
                  <span className="block font-semibold text-white">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-400">{text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
