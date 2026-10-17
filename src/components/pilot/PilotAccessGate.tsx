"use client";

import Link from "next/link";
import PilotClient from "@/components/pilot/PilotClient";
import { useAuth } from "@/context/AuthContext";

interface Props {
  recipe: { id: number; title: string; [key: string]: any };
  steps: string[];
  hasStoredSteps: boolean;
}

/** A bookmarked/direct /pilot/... URL must not mount the microphone,
 * recipe walkthrough, or Chirp audio hooks for guests. */
export default function PilotAccessGate(props: Props) {
  const { user, loading } = useAuth();
  if (loading) {
    return <main className="grid min-h-[100dvh] place-items-center bg-[#0c1320] text-white" role="status">Tariften hesabın kontrol ediliyor…</main>;
  }
  if (!user?.token) {
    return <main className="grid min-h-[100dvh] place-items-center bg-[#0c1320] px-4 text-white">
      <section className="w-full max-w-md rounded-[28px] border border-[#db4c3f]/25 bg-[#182231] p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#db4c3f]/20 text-3xl text-[#db4c3f]">♨</div>
        <h1 className="text-2xl font-extrabold">Pişirme Rehberi'ne Hoş Geldin</h1>
        <p className="my-5 text-sm leading-6 text-[#bec7d2]">Sesli pişirme asistanı üyelerimize özel. Devam etmek için giriş yap veya ücretsiz hesap oluştur.</p>
        <Link href="/login" className="block rounded-xl bg-[#db4c3f] p-3.5 font-bold">Giriş Yap</Link>
        <Link href="/register" className="mt-2 block rounded-xl border border-white/20 p-3.5 font-bold">Ücretsiz Kayıt Ol</Link>
        <Link href={`/recipe/${props.recipe.slug || ""}`} className="mt-4 inline-block p-2 text-sm text-[#aeb8c4]">Tarife dön</Link>
      </section>
    </main>;
  }
  return <PilotClient {...props} />;
}
