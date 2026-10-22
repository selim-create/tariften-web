"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CircleAlert, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageIntro from "@/components/account/PageIntro";
import KitchenProfileWizard from "@/components/account/KitchenProfileWizard";
import {
  type KitchenOptions, type KitchenPatch, type KitchenProfile,
  deleteKitchenProfile, getKitchenProfile, rememberKitchenProfile, updateKitchenProfile,
} from "@/lib/kitchen-profile";

function KitchenProfileScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const welcome = params.get("welcome") === "1";
  const { user, loading: authLoading, refreshUser } = useAuth();
  const token = user?.token || "";
  const [data, setData] = useState<{ profile: KitchenProfile; options: KitchenOptions } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?callbackUrl=/profile/kitchen");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getKitchenProfile(token)
      .then(result => {
        rememberKitchenProfile(token, result.profile, result.options);
        if (!cancelled) { setData(result); setError(""); }
      })
      .catch(reason => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Mutfak profilin yüklenemedi."); });
    return () => { cancelled = true; };
  }, [token, attempt]);

  // Saves refresh the per-tab cache the recipe page's allergen band reads.
  const save = useCallback(async (patch: KitchenPatch) => {
    const { profile } = await updateKitchenProfile(token, patch);
    rememberKitchenProfile(token, profile);
    return profile;
  }, [token]);
  const erase = useCallback(async () => {
    const { profile } = await deleteKitchenProfile(token);
    rememberKitchenProfile(token, profile);
    return profile;
  }, [token]);
  const finished = useCallback(() => {
    void refreshUser();
    router.push("/profile?mutfak=kaydedildi");
  }, [refreshUser, router]);

  const completed = !!data?.profile.completed_at;
  const firstName = (user?.user_display_name || user?.user_nicename || "").trim().split(/\s+/)[0].replace(/\*/g, "");

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Mutfak profilin" kicker={completed ? "Mutfak profilin" : "İsteğe bağlı · 5 kısa adım"}
        title={completed ? "Mutfağın, *güncel kalsın.*" : "Mutfağını *tanıyalım.*"}
        actions={
          <Link href="/profile" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Profile dön
          </Link>
        }>
        {welcome
          ? `Aramıza hoş geldin${firstName ? `, ${firstName}` : ""}! Birkaç soruyla sana uygun tarifleri öne çıkaralım; istediğin adımı atlayabilirsin.`
          : completed
            ? "Bir şey değiştiyse adımı seç, düzelt ve kaydet. Diğer bilgilerin olduğu gibi kalır."
            : "Kaç kişiye pişirdiğin, neleri sevmediğin, mutfağında neler olduğu. Her adım isteğe bağlı."}
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
        {data ? (
          <KitchenProfileWizard initialProfile={data.profile} options={data.options} welcome={welcome}
            save={save} erase={erase} onFinished={finished} />
        ) : error ? (
          <div role="alert" className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center">
            <CircleAlert className="h-6 w-6 text-red-600" aria-hidden />
            <p className="mt-3 text-[15px] text-slate-700">{error}</p>
            <button type="button" onClick={() => { setError(""); setAttempt(n => n + 1); }}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <RotateCcw className="h-4 w-4" aria-hidden /> Tekrar dene
            </button>
          </div>
        ) : (
          <p role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Mutfak profilin yükleniyor…
          </p>
        )}
      </div>
    </main>
  );
}

export default function KitchenProfilePage() {
  return (
    <Suspense fallback={<p role="status" className="py-20 text-center text-sm text-gray-500">Yükleniyor…</p>}>
      <KitchenProfileScreen />
    </Suspense>
  );
}
