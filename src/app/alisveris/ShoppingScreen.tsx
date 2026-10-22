"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import PageIntro from "@/components/account/PageIntro";
import ShoppingList from "@/components/kitchen/ShoppingList";
import { ErrorCard, LoadingState, SignInPrompt } from "@/components/kitchen/KitchenParts";
import { useKitchen } from "@/context/KitchenContext";

export default function ShoppingScreen() {
  const kitchen = useKitchen();
  const { state, snapshot } = kitchen;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Alışveriş" kicker="Alışveriş" title="Alışveriş *listen.*"
        actions={kitchen.signedIn ? (
          <Link href="/bu-hafta" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <CalendarDays className="h-4 w-4" aria-hidden /> Bu hafta
          </Link>
        ) : undefined}>
        {snapshot.loaded && state.shopping.length > 0
          ? `${state.shopping.length} tarifin malzemeleri tek listede. Markette telefonundan işaretle; burada da işaretli görünür.`
          : "Tariflerin malzemeleri tek listede, aynı birimdekiler toplanır. Markette telefonundan işaretlersin."}
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        {kitchen.authLoading ? (
          <LoadingState label="Listen açılıyor…" />
        ) : !kitchen.signedIn ? (
          <SignInPrompt icon="sepet" callbackPath="/alisveris" title="Listeni görmek için giriş yap."
            text="Alışveriş listen hesabına kaydedilir; Tariften uygulamasında ve burada aynı liste, aynı işaretler." />
        ) : !snapshot.loaded ? (
          snapshot.status === "error"
            ? <ErrorCard message={snapshot.error} onRetry={kitchen.refresh} />
            : <LoadingState label="Listen getiriliyor…" />
        ) : (
          <ShoppingList kitchen={kitchen} />
        )}
      </div>
    </main>
  );
}
