"use client";

import Link from "next/link";
import { CookingPot } from "lucide-react";
import PilotClient from "@/components/pilot/PilotClient";
import { useAuth } from "@/context/AuthContext";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recipe: { id: number; title: string; [key: string]: any };
  steps: string[];
  hasStoredSteps: boolean;
}

/** A bookmarked/direct /pilot/... URL must not mount the microphone,
 * recipe walkthrough, or Chirp audio hooks for guests. */
export default function PilotAccessGate(props: Props) {
  const { user, loading } = useAuth();
  if (loading) {
    return <main className="grid min-h-[100dvh] place-items-center bg-slate-950 text-sm text-slate-400" role="status">Hesabın kontrol ediliyor…</main>;
  }
  if (!user?.token) {
    return <main className="grid min-h-[100dvh] place-items-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-7 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand/15 text-brand"><CookingPot className="h-7 w-7" /></div>
        <h1 className="font-heading text-2xl font-semibold">Pişirme rehberi</h1>
        <p className="mb-6 mt-2 text-sm leading-6 text-slate-400">Adım adım, sesli ve eller serbest pişirme rehberi üyelere açık. Devam etmek için giriş yap ya da Standart Üye olarak kayıt ol.</p>
        <Link href="/login" className="grid h-12 place-items-center rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark">Giriş yap</Link>
        <Link href="/register" className="mt-2 grid h-12 place-items-center rounded-xl border border-slate-700 font-semibold text-slate-100 transition hover:bg-slate-800">Standart Üye ol</Link>
        <Link href={`/recipe/${props.recipe.slug || ""}`} className="mt-4 inline-block p-2 text-sm text-slate-400 hover:text-slate-200">Tarife dön</Link>
      </section>
    </main>;
  }
  return <PilotClient {...props} />;
}
