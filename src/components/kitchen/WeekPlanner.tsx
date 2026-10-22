"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Loader2, ShoppingBasket, X } from "lucide-react";
import type { KitchenApi } from "@/context/KitchenContext";
import { DAY_LONG, isInShopping, localDay, weekAt } from "@/lib/kitchen-sync";
import type { PlannedRecipe } from "@/lib/kitchen-sync";
import { FOCUS, RecipeThumb, SyncStatus } from "./KitchenParts";

export type RecipeIngredientsLoader = (slug: string) => Promise<{
  id: number; slug: string; title: string; servings?: number | null;
  ingredients: { name?: unknown; amount?: unknown; unit?: unknown }[];
} | null>;

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString("tr-TR", opts);

function weekRange(days: Date[]): string {
  const sameMonth = days[0].getMonth() === days[6].getMonth();
  return `${fmt(days[0], sameMonth ? { day: "numeric" } : { day: "numeric", month: "long" })} – ${fmt(days[6], { day: "numeric", month: "long" })}`;
}

/**
 * "Bu Hafta": Monday-first week, one row per day with the planned recipes.
 * Adding a recipe to the shopping list fetches it at click time so the list
 * uses the recipe's own, current ingredient rows.
 */
export default function WeekPlanner({ kitchen, loadRecipe, now }: { kitchen: KitchenApi; loadRecipe: RecipeIngredientsLoader; now?: Date }) {
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "warn" } | null>(null);
  const today = localDay(now);
  const days = useMemo(() => weekAt(offset, now), [offset, now]);
  const keys = days.map(d => localDay(d));
  const { state, snapshot } = kitchen;
  const weekEntries = state.plan.filter(entry => keys.includes(entry.day));
  const byDay = (key: string) => weekEntries.filter(entry => entry.day === key).sort((a, b) => a.addedAt - b.addedAt);

  const say = (text: string, tone: "ok" | "warn" = "ok") => setNotice({ text, tone });

  const addToShopping = async (entries: PlannedRecipe[], busyKey: string) => {
    if (busy) return;
    setBusy(busyKey);
    setNotice(null);
    try {
      const unique = [...new Map(entries.map(entry => [entry.recipeId, entry])).values()];
      let added = 0;
      let missing = 0;
      for (const entry of unique) {
        const recipe = await loadRecipe(entry.slug);
        if (!recipe || !recipe.ingredients.length) { missing += 1; continue; }
        const error = kitchen.addRecipeToShopping({
          id: recipe.id, slug: recipe.slug, title: recipe.title, servings: recipe.servings ?? null, ingredients: recipe.ingredients,
        });
        if (error) { say(error, "warn"); return; }
        added += 1;
      }
      if (added) say(unique.length === 1 ? "Malzemeler alışveriş listene eklendi." : `${added} tarifin malzemeleri alışveriş listene eklendi.`);
      else say(missing ? "Bu tarifte malzeme bilgisi bulunamadı." : "Eklenecek tarif yok.", "warn");
    } catch {
      say("Tarif şu anda alınamadı. Biraz sonra yeniden dene.", "warn");
    } finally {
      setBusy(null);
    }
  };

  const remove = (entry: PlannedRecipe) => {
    const error = kitchen.removeFromPlan(entry.id);
    if (error) say(error, "warn");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setOffset(o => o - 1)} aria-label="Önceki hafta"
            className={`grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:text-slate-900 ${FOCUS}`}>
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1 px-2 text-center sm:min-w-[220px]">
            <p className="font-heading text-[17px] font-semibold text-slate-900 tabular-nums">{weekRange(days)}</p>
            <p className="text-xs text-gray-500">
              {offset === 0 ? "Bu hafta" : offset === 1 ? "Gelecek hafta" : offset === -1 ? "Geçen hafta" : offset > 0 ? `${offset} hafta sonra` : `${-offset} hafta önce`}
              {weekEntries.length > 0 && ` · ${weekEntries.length} tarif`}
            </p>
          </div>
          <button type="button" onClick={() => setOffset(o => o + 1)} aria-label="Sonraki hafta"
            className={`grid h-11 w-11 place-items-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:text-slate-900 ${FOCUS}`}>
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          {offset !== 0 && (
            <button type="button" onClick={() => setOffset(0)}
              className={`ml-1 hidden h-11 items-center rounded-xl px-3 text-sm font-semibold text-brand transition hover:bg-brand/5 sm:inline-flex ${FOCUS}`}>
              Bu haftaya dön
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <SyncStatus snapshot={snapshot} onRetry={kitchen.refresh} />
        </div>
      </div>

      {notice && (
        <div role="status" className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${notice.tone === "ok" ? "kz-ok border-emerald-200 bg-emerald-50 text-emerald-900" : "kz-warn border-amber-200 bg-amber-50 text-amber-900"}`}>
          {notice.tone === "ok" ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : <X className="h-4 w-4 shrink-0" aria-hidden />}
          <span className="min-w-0 flex-1">{notice.text}</span>
          {notice.tone === "ok" && (
            <Link href="/alisveris" className={`inline-flex shrink-0 items-center gap-1 font-semibold underline-offset-4 hover:underline ${FOCUS}`}>
              Listeye git <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          )}
          <button type="button" onClick={() => setNotice(null)} aria-label="Bildirimi kapat" className={`shrink-0 rounded-full p-1 opacity-60 hover:opacity-100 ${FOCUS}`}>
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      {weekEntries.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="font-heading text-xl font-semibold text-slate-900">Bu haftanın sofrası henüz boş.</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
            Bir tarifin sayfasında “Haftaya ekle”yi seç, günü belirle; burada güne göre sıralansın. Uygulamada eklediklerin de burada görünür.
          </p>
          <Link href="/recipes" className={`mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark ${FOCUS}`}>
            Tarif seç <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      <ol className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
        {days.map((date, i) => {
          const key = keys[i];
          const entries = byDay(key);
          const isToday = key === today;
          const past = key < today;
          return (
            <li key={key} aria-label={`${DAY_LONG[i]} ${fmt(date, { day: "numeric", month: "long" })}${entries.length ? `, ${entries.length} tarif` : ""}`}
              className={`flex flex-wrap items-baseline gap-x-3 gap-y-2.5 px-4 py-4 sm:grid sm:grid-cols-[148px_1fr] sm:items-start sm:gap-6 sm:px-6 ${i > 0 ? "border-t border-gray-100" : ""} ${isToday ? "kz-today bg-[#fffaf7]" : ""}`}>
              {/* Phones: the day reads as one line above its recipes so titles get the full width. */}
              <div className={`flex items-baseline gap-2 sm:block sm:pt-1 ${past && !isToday ? "opacity-60" : ""}`}>
                <p className={`order-2 text-[11px] font-semibold uppercase tracking-[0.16em] sm:order-none ${isToday ? "text-brand" : "text-gray-500"}`}>
                  {DAY_LONG[i]}
                </p>
                <p className={`order-1 font-heading text-xl font-bold leading-tight tabular-nums sm:order-none sm:text-2xl ${isToday ? "text-brand" : "text-slate-900"}`}>{date.getDate()}</p>
                {isToday && <p className="order-3 text-[11px] font-medium text-brand sm:order-none">Bugün</p>}
              </div>
              <div className={`min-w-0 sm:self-center ${entries.length ? "w-full sm:w-auto" : ""}`}>
                {entries.length === 0 ? (
                  <span className="block text-sm text-gray-400 sm:py-2">Plan yok</span>
                ) : (
                  <ul className="space-y-2">
                    {entries.map(entry => {
                      const inList = isInShopping(state, entry.recipeId);
                      const working = busy === entry.id;
                      return (
                        <li key={entry.id} className="group flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2 pr-2.5 transition hover:border-gray-300">
                          <Link href={`/recipe/${entry.slug}`} className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl ${FOCUS}`}>
                            <RecipeThumb title={entry.title} image={entry.image} className="h-12 w-12 sm:h-14 sm:w-14" />
                            <span className="line-clamp-2 min-w-0 font-heading text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-brand">{entry.title}</span>
                          </Link>
                          {inList ? (
                            <Link href="/alisveris" title="Alışveriş listende"
                              className={`kz-tint inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#fdf1ea] px-3 text-xs font-semibold text-[#a8362b] ${FOCUS}`}>
                              <Check className="h-3.5 w-3.5" aria-hidden /><span className="hidden sm:inline">Alışverişte</span>
                            </Link>
                          ) : (
                            <button type="button" onClick={() => void addToShopping([entry], entry.id)} disabled={!!busy}
                              aria-label={`${entry.title} malzemelerini alışverişe ekle`} title="Alışverişe ekle"
                              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand disabled:opacity-50 ${FOCUS}`}>
                              {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <ShoppingBasket className="h-3.5 w-3.5" aria-hidden />}
                              <span className="hidden sm:inline">Alışverişe ekle</span>
                            </button>
                          )}
                          <button type="button" onClick={() => remove(entry)} aria-label={`${entry.title} planından çıkar`} title="Plandan çıkar"
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-black/5 hover:text-slate-700 ${FOCUS}`}>
                            <X className="h-4 w-4" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {weekEntries.length > 0 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-gray-500">Haftanın tüm tariflerinin malzemelerini tek seferde listene ekleyebilirsin.</p>
          <button type="button" onClick={() => void addToShopping(weekEntries, "week")} disabled={!!busy}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60 sm:w-auto ${FOCUS}`}>
            {busy === "week" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ShoppingBasket className="h-4 w-4" aria-hidden />}
            Haftanın malzemelerini listeye ekle
          </button>
        </div>
      )}

      <p className="text-center text-xs leading-5 text-gray-500">Planın hesabına kaydedilir; uygulamada da aynısını görürsün.</p>
    </div>
  );
}
