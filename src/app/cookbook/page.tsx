"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookmarkCheck, ChefHat, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserInteractions } from "@/lib/api";
import { Recipe } from "@/types";
import PageIntro from "@/components/account/PageIntro";
import RecipeCard from "@/components/recipes/RecipeCard";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";

type Tab = "favorite" | "cooked";

const TABS: { id: Tab; label: string; icon: typeof BookmarkCheck }[] = [
  { id: "favorite", label: "Kaydettiklerim", icon: BookmarkCheck },
  { id: "cooked", label: "Pişirdiklerim", icon: ChefHat },
];

const EMPTY: Record<Tab, { title: string; text: string }> = {
  favorite: { title: "Defterin henüz bomboş.", text: "Beğendiğin tarifleri kaydet; aklında tutmak zorunda kalma." },
  cooked: { title: "Daha hiçbir şey pişmemiş.", text: "Bir tarifi pişirdiğinde işaretle, burada birikmeye başlasın." },
};

export default function CookbookPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("favorite");
  const [lists, setLists] = useState<Record<Tab, Recipe[]>>({ favorite: [], cooked: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const token = user?.token;
    if (!token) return;
    let cancelled = false;
    async function fetchData(token: string) {
      try {
        const [favorite, cooked] = await Promise.all([
          getUserInteractions(token, "favorite"),
          getUserInteractions(token, "cooked"),
        ]);
        if (!cancelled) setLists({ favorite: Array.isArray(favorite) ? favorite : [], cooked: Array.isArray(cooked) ? cooked : [] });
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchData(token);
    return () => { cancelled = true; };
  }, [user, authLoading]);

  if (authLoading) {
    return <main role="status" className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Defter açılıyor…
    </main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fcfcfc] pb-24">
        <PageIntro crumb="Tarif Defterim" kicker="Tarif defterim" title="Sevdiğin tarifler *tek yerde.*">
          Kaydettiklerin ve pişirdiklerin burada birikir; telefonda da bilgisayarda da aynı defter.
        </PageIntro>
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <div className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8]"><LokmaIngredientIcon name="limon" size="xl" /></span>
            <p className="font-heading text-xl font-semibold text-slate-900">Defterini açmak için giriş yap.</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Hesabın yoksa bir dakikada açılıyor. Söz, tarif kadar uzun sürmeyecek.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/login" className="inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark">Giriş yap</Link>
              <Link href="/register" className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 font-semibold text-slate-700 transition hover:border-gray-300">Hesap oluştur</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const recipes = lists[activeTab];

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      <PageIntro crumb="Tarif Defterim" kicker="Tarif defterim" title="Sevdiğin tarifler *tek yerde.*"
        actions={
          <Link href="/recipe/create" className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand">
            <Plus className="h-4 w-4" aria-hidden /> Yeni tarif ekle
          </Link>
        }>
        Kaydettiklerin ve pişirdiklerin burada birikir. Bir dahaki “bu akşam ne yesek?” krizinde ilk bakılacak yer.
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        <div role="tablist" aria-label="Tarif listeleri" className="mb-8 inline-flex rounded-2xl border border-gray-200 bg-white p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} type="button" role="tab" aria-selected={active} onClick={() => setActiveTab(id)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}>
                <Icon className="h-4 w-4" aria-hidden /> {label}
                {!loading && <span className={`tabular-nums text-xs ${active ? "text-white/70" : "text-gray-400"}`}>{lists[id].length}</span>}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Tarifler yükleniyor…</div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8]"><LokmaIngredientIcon name={activeTab === "cooked" ? "makarna" : "domates"} size="xl" /></span>
            <p className="font-heading text-xl font-semibold text-slate-900">{EMPTY[activeTab].title}</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">{EMPTY[activeTab].text}</p>
            <Link href="/recipes" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark">Tarifleri keşfet</Link>
          </div>
        )}
      </div>
    </main>
  );
}
