"use client";

import { useState } from "react";
import Link from "next/link";
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
        className="flex-1 bg-[#db4c3f] hover:bg-[#c44135] text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#db4c3f]/15 min-w-[200px]"
      >
        <span aria-hidden>▶</span> Pişirme Rehberini Başlat
      </Link>
      {showAuth && (
        <div role="presentation" className="fixed inset-0 z-[180] flex items-center justify-center bg-[#08101a]/85 p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAuth(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pilot-sign-in-title"
            className="w-full max-w-md rounded-[28px] border border-[#db4c3f]/30 bg-[#182231] p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#db4c3f]/20 text-3xl text-[#db4c3f]">♨</div>
            <h2 id="pilot-sign-in-title" className="text-2xl font-extrabold text-white">Tariften Pişirme Rehberi</h2>
            <p className="mb-6 mt-3 text-sm leading-6 text-[#c4cbd5]">Adım adım sesli pişirme rehberini kullanmak için giriş yap veya Standart Üye olarak kayıt ol.</p>
            <Link href="/login" className="block rounded-xl bg-[#db4c3f] p-3.5 font-bold text-white">Giriş Yap</Link>
            <Link href="/register" className="mt-2 block rounded-xl border border-white/25 p-3.5 font-bold text-white">Standart Üye Ol</Link>
            <button type="button" onClick={() => setShowAuth(false)} className="mt-4 p-2 text-sm text-[#aeb8c4]">Şimdi değil</button>
          </section>
        </div>
      )}
    </>
  );
}
