"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaBookOpen, FaFire, FaHeart, FaPen, FaUtensils } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { getUserInteractions } from "@/lib/api";
import { useAccountQuotas } from "@/lib/account-quotas-client";
import QuotaPanel from "@/components/account/QuotaPanel";
import MyKitchenLibrary from "@/components/account/MyKitchenLibrary";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";
import type { Recipe } from "@/types";

type Tab = "recipes" | "menus" | "favorite" | "cooked";

const TABS = [
  { key: "recipes", label: "Tariflerim", icon: FaPen },
  { key: "menus", label: "Sofralarım", icon: FaUtensils },
  { key: "favorite", label: "Favoriler", icon: FaHeart },
  { key: "cooked", label: "Pişirdiklerim", icon: FaFire },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const quotas = useAccountQuotas(user?.token);
  const [activeTab, setActiveTab] = useState<Tab>("recipes");
  const [recentActivity, setRecentActivity] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    const token = user?.token;
    if (!token) return;
    let cancelled = false;
    const refresh = async () => {
      setInteractionsLoading(true);
      try {
        const [cooked, loved] = await Promise.all([
          getUserInteractions(token, "cooked"),
          getUserInteractions(token, "favorite"),
        ]);
        if (!cancelled) {
          setRecentActivity(Array.isArray(cooked) ? cooked : []);
          setFavorites(Array.isArray(loved) ? loved : []);
        }
      } finally {
        if (!cancelled) setInteractionsLoading(false);
      }
    };
    void refresh();
    return () => { cancelled = true; };
  }, [user?.token]);

  if (authLoading || !user || !user.token) {
    return <main className="grid min-h-[50vh] place-items-center text-sm text-[#97867b]">
      {authLoading ? "Profilin yükleniyor…" : "Giriş sayfasına yönlendiriliyorsun…"}
    </main>;
  }

  const avatarUrl = user.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_display_name || "Tariften")}&background=fcf1e9&color=d64b3f`;
  const interactions = activeTab === "cooked" ? recentActivity : favorites;
  const interactionLabel = activeTab === "cooked" ? "Pişirdiklerim" : "Favoriler";

  return (
    <main className="min-h-screen bg-[#fffbf7] pb-20">
      <div className="border-b border-[#f0e6de] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 py-9 text-center sm:flex-row sm:text-left">
          <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[26px] border-[4px] border-[#fff5ed] bg-[#fff0e8] shadow-md">
            <Image src={avatarUrl} alt={user.user_display_name || "Profil"}
              fill sizes="84px" className="object-cover" unoptimized={avatarUrl.includes("ui-avatars.com")} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d26956]">TARİFTEN · MUTFAĞIM</span>
            <h1 className="mt-1 font-heading text-[29px] font-extrabold tracking-tight text-slate-900">
              {user.user_display_name || "Tariften Şef"}
            </h1>
            <p className="mt-1 text-sm text-[#94847a]">Tariflerin, sofraların ve mutfağındaki güzel fikirler.</p>
            {user.experience && (
              <span className="mt-3 inline-flex rounded-full border border-[#f2dacd] bg-[#fff3eb] px-3 py-1 text-xs font-bold text-[#ba6a52]">
                {user.experience === "pro" ? "Usta Şef" : user.experience === "intermediate" ? "Hevesli Aşçı" : "Çırak"}
              </span>
            )}
          </div>
          <Link href="/profile/edit"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#e9ded4] bg-white px-4 text-xs font-extrabold text-slate-700 transition hover:border-[#da5546] hover:text-[#d74c3e]">
            Hesap ayarları <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-7 px-4 pt-7 sm:px-6">
        <div className="rounded-[26px] border border-[#efe0d5] bg-white p-3 shadow-[0_16px_44px_rgba(75,44,26,0.045)] sm:p-4">
          <div role="tablist" aria-label="Mutfak kütüphanem"
            className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-extrabold transition sm:text-sm ${activeTab === key
                  ? "bg-[#fff0e9] text-[#c94f40] shadow-sm ring-1 ring-[#efcabe]"
                  : "text-[#8c807a] hover:bg-[#fff8f3] hover:text-slate-800"}`}>
                <Icon size={14} aria-hidden="true" />{label}
              </button>
            ))}
          </div>
        </div>

        <div role="tabpanel" className="min-h-[250px]">
          {activeTab === "recipes" && (
            <MyKitchenLibrary key="recipes" kind="recipes" token={user.token} userId={Number(user.id)} />
          )}
          {activeTab === "menus" && (
            <MyKitchenLibrary key="menus" kind="menus" token={user.token} userId={Number(user.id)} />
          )}
          {(activeTab === "favorite" || activeTab === "cooked") && (
            <section className="space-y-5">
              <div>
                <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#cb6654]">MUTFAK HATIRALARIN</span>
                <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900">{interactionLabel}</h2>
                <p className="mt-1 text-sm text-[#94847a]">
                  {activeTab === "favorite" ? "Sevdiğin ve yeniden denemek istediğin tarifler."
                    : "Pişirdiğin ve yeniden yapabileceğin lezzetler."}
                </p>
              </div>
              {interactionsLoading ? (
                <p role="status" className="rounded-2xl border border-[#f0e4da] bg-white p-9 text-center text-sm text-[#94847a]">Tariflerin yükleniyor…</p>
              ) : interactions.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {interactions.map(recipe => (
                    <Link key={recipe.id} href={`/recipe/${recipe.slug}`}
                      className="group flex gap-3 rounded-[20px] border border-[#f0e4da] bg-white p-3 shadow-sm transition hover:border-[#e8cabb] hover:shadow-md">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#fff3eb]">
                        {!recipe.image || isPlaceholderImage(recipe.image)
                          ? <ImagePlaceholder title={recipe.title} variant="card" />
                          : <Image src={recipe.image} alt={recipe.title} fill sizes="96px"
                              className="object-cover" unoptimized={recipe.image.includes("unsplash.com") || recipe.image.includes("pexels.com")} />}
                      </div>
                      <div className="min-w-0 flex-1 py-1">
                        <h3 className="line-clamp-2 text-sm font-extrabold text-slate-900 group-hover:text-[#cf5745]">{recipe.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#95877d]">{recipe.excerpt}</p>
                        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#c45d4a]">
                          {activeTab === "favorite" ? <FaHeart size={12} /> : <FaFire size={12} />}
                          {activeTab === "favorite" ? "Favorilerinde" : "Pişirildi"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-[24px] border border-[#f0e4da] bg-white px-5 py-11 text-center">
                  <FaBookOpen className="text-[#d6b9a6]" size={25} />
                  <h3 className="mt-3 font-heading font-extrabold text-slate-900">
                    {activeTab === "favorite" ? "Henüz favori tarifin yok." : "Henüz pişirdiğin bir tarif yok."}
                  </h3>
                  <Link href="/recipes" className="mt-4 rounded-xl bg-[#df5043] px-5 py-2.5 text-xs font-bold text-white">
                    Tarifleri keşfet
                  </Link>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="pt-4">
          <h2 className="mb-4 font-heading text-lg font-extrabold text-slate-900">Üyelik ve kullanım hakların</h2>
          <QuotaPanel data={quotas.data} error={quotas.error} loading={quotas.loading} />
        </div>
      </div>
    </main>
  );
}
