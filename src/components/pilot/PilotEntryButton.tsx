"use client";

import { useState } from "react";
import Link from "next/link";
import { CookingPot, Play } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PilotEntryButton({ slug }: { slug: string }) {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  return (
    <>
      <Link
        href={user?.token ? `/pilot/${slug}` : "#"}
        aria-disabled={loading}
        onClick={(event) => {
          if (!user?.token) {
            event.preventDefault();
            if (!loading) setShowAuth(true);
          }
        }}
        className="flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-brand px-4 text-[15px] sm:px-6 font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Play className="h-4 w-4 fill-current" aria-hidden /> Pişirme rehberini başlat
      </Link>
      {showAuth && (
        <div role="presentation" className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAuth(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pilot-sign-in-title"
            className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-xl">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand"><CookingPot className="h-7 w-7" /></div>
            <h2 id="pilot-sign-in-title" className="font-heading text-xl font-bold text-slate-900">Pişirme rehberi</h2>
            <p className="mb-6 mt-2 text-sm leading-6 text-gray-500">Adım adım, sesli ve eller serbest rehberi kullanmak için giriş yap ya da Standart Üye olarak kayıt ol.</p>
            <Link href="/login" className="grid h-12 place-items-center rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark">Giriş yap</Link>
            <Link href="/register" className="mt-2 grid h-12 place-items-center rounded-xl border border-gray-200 font-semibold text-slate-800 transition hover:border-gray-300">Standart Üye ol</Link>
            <button type="button" onClick={() => setShowAuth(false)} className="mt-3 p-2 text-sm text-gray-500 hover:text-slate-800">Şimdi değil</button>
          </section>
        </div>
      )}
    </>
  );
}
