"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookmarkCheck, ChefHat, Loader2, NotebookPen, Settings2, StickyNote, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserInteractions } from "@/lib/api";
import { useAccountQuotas } from "@/lib/account-quotas-client";
import QuotaPanel from "@/components/account/QuotaPanel";
import MyKitchenLibrary from "@/components/account/MyKitchenLibrary";
import MyRecipeNotes from "@/components/account/MyRecipeNotes";
import KitchenProfileCard from "@/components/account/KitchenProfileCard";
import PageIntro from "@/components/account/PageIntro";
import AccountAvatar from "@/components/account/AccountAvatar";
import RecipeCard from "@/components/recipes/RecipeCard";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import type { Recipe } from "@/types";

type Tab = "recipes" | "menus" | "favorite" | "cooked" | "notes";

const TABS = [
  { key: "recipes", label: "Tariflerim", icon: NotebookPen },
  { key: "menus", label: "Sofralarım", icon: UtensilsCrossed },
  { key: "favorite", label: "Favoriler", icon: BookmarkCheck },
  { key: "cooked", label: "Pişirdiklerim", icon: ChefHat },
  { key: "notes", label: "Notlarım", icon: StickyNote },
] as const;

/** The level the member picked for themselves in settings. */
const EXPERIENCE: Record<string, string> = { beginner: "Çırak", intermediate: "Hevesli aşçı", pro: "Usta şef" };

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
    return <main role="status" className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {authLoading ? "Profilin yükleniyor…" : "Giriş sayfasına yönlendiriliyorsun…"}
    </main>;
  }

  const name = user.user_display_name || user.user_nicename || "Mutfağım";
  const firstName = name.trim().split(/\s+/)[0].replace(/\*/g, "");
  const experience = user.experience ? EXPERIENCE[user.experience] : null;
  const interactions = activeTab === "cooked" ? recentActivity : favorites;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Profilim" kicker={experience ? `Mutfağım · ${experience}` : "Mutfağım"} title={`Merhaba, *${firstName}.*`}
        aside={<AccountAvatar url={user.avatar_url} name={name} size={72} className="mt-1" />}
        actions={
          <Link href="/profile/edit" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand">
            <Settings2 className="h-4 w-4" aria-hidden /> Hesap ayarları
          </Link>
        }>
        Tariflerin, sofraların ve tekrar pişirmek istediklerin. Mutfağın ne kadar dağınık olsa da burası derli toplu.
      </PageIntro>

      <div className="mx-auto max-w-6xl space-y-14 px-4 pt-8">
        <Suspense fallback={null}>
          <KitchenProfileCard token={user.token} completed={user.kitchen_profile_completed} />
        </Suspense>

        <div>
          <div role="tablist" aria-label="Mutfak kütüphanem"
            className="mb-8 grid grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-white p-1 sm:inline-grid sm:grid-cols-5">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              const count = key === "favorite" ? favorites.length : key === "cooked" ? recentActivity.length : null;
              return (
                <button key={key} type="button" role="tab" aria-selected={active} onClick={() => setActiveTab(key)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition last:col-span-2 sm:last:col-span-1 ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>
                  <Icon className="h-4 w-4" aria-hidden />{label}
                  {count !== null && !interactionsLoading && <span className={`tabular-nums text-xs ${active ? "text-white/70" : "text-gray-400"}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div role="tabpanel" className="min-h-[250px]">
            {activeTab === "recipes" && (
              <MyKitchenLibrary key="recipes" kind="recipes" token={user.token} userId={Number(user.id)} />
            )}
            {activeTab === "menus" && (
              <MyKitchenLibrary key="menus" kind="menus" token={user.token} userId={Number(user.id)} />
            )}
            {activeTab === "notes" && <MyRecipeNotes key="notes" token={user.token} />}
            {(activeTab === "favorite" || activeTab === "cooked") && (
              interactionsLoading ? (
                <p role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Tariflerin yükleniyor…</p>
              ) : interactions.length > 0 ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                  {interactions.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
                  <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8]"><LokmaIngredientIcon name={activeTab === "favorite" ? "çilek" : "makarna"} size="xl" /></span>
                  <h2 className="font-heading text-xl font-semibold text-slate-900">
                    {activeTab === "favorite" ? "Henüz favori tarifin yok." : "Henüz pişirdiğin bir tarif yok."}
                  </h2>
                  <p className="mt-1 max-w-sm text-sm text-gray-500">
                    {activeTab === "favorite" ? "Göz kırpan bir tarif görünce kaydet; burada seni bekler." : "Bir tarifi pişirdiğinde işaretle, mutfak hatıraların burada birikir."}
                  </p>
                  <Link href="/recipes" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark">Tarifleri keşfet</Link>
                </div>
              )
            )}
          </div>
        </div>

        <section aria-labelledby="profile-quota">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Üyelik</p>
          <h2 id="profile-quota" className="mb-6 font-heading text-2xl font-bold tracking-[-0.02em] text-slate-900 sm:text-3xl">
            Kullanım <span className="italic text-brand">hakların</span>
          </h2>
          <QuotaPanel data={quotas.data} error={quotas.error} loading={quotas.loading} />
        </section>
      </div>
    </main>
  );
}
