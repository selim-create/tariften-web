"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarCheck, CalendarPlus, Check, Loader2, ShoppingBasket, X } from "lucide-react";
import { useKitchen } from "@/context/KitchenContext";
import { DAY_LONG, isInShopping, localDay, weekAt } from "@/lib/kitchen-sync";
import { isPlaceholderImage } from "@/lib/utils";
import { QuickActionBody, quickActionClass } from "@/components/recipe/QuickAction";

type Props = {
  /** "quick": round labelled items for the recipe header row (as in the app). */
  variant?: "button" | "quick";
  recipe: {
    id: number; slug: string; title: string; image?: string; servings?: number | null;
    ingredients: { name?: unknown; amount?: unknown; unit?: unknown }[];
  };
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const BUTTON = `inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-4 text-[15px] font-semibold transition disabled:opacity-60 ${FOCUS}`;
const IDLE = "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:text-brand";
const ACTIVE = "kz-chip-on border-brand/50 bg-[#fdf1ea] text-[#a8362b]";

/**
 * "Haftaya ekle" and "Alışverişe ekle" on the recipe page — the same account
 * document the app's Bu Hafta / Alışveriş tabs use. Signed-out visitors are
 * sent to sign in and come back here.
 */
export default function RecipeKitchenActions({ recipe, variant = "button" }: Props) {
  const kitchen = useKitchen();
  const router = useRouter();
  const pathname = usePathname() || `/recipe/${recipe.slug}`;
  const [picker, setPicker] = useState(false);
  const [toast, setToast] = useState<{ text: string; href?: string; cta?: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { state, snapshot, signedIn, authLoading } = kitchen;
  const ready = signedIn && snapshot.loaded;
  const inList = ready && isInShopping(state, recipe.id);
  const planned = ready ? state.plan.filter(entry => entry.recipeId === recipe.id && entry.day >= localDay()) : [];
  const hasIngredients = recipe.ingredients.some(row => typeof row?.name === "string" && row.name.trim());

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const say = (text: string, href?: string, cta?: string) => {
    setToast({ text, href, cta });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };
  const requireSignIn = () => {
    if (signedIn) return false;
    if (!authLoading) router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    return true;
  };

  const toggleShopping = () => {
    if (requireSignIn() || !ready) return;
    if (inList) {
      const error = kitchen.removeRecipeFromShopping(recipe.id);
      say(error || "Alışveriş listesinden çıkarıldı.");
      return;
    }
    const error = kitchen.addRecipeToShopping({
      id: recipe.id, slug: recipe.slug, title: recipe.title, servings: recipe.servings ?? null, ingredients: recipe.ingredients,
    });
    if (error) say(error);
    else say("Malzemeler alışveriş listene eklendi.", "/alisveris", "Listeye git");
  };

  const pick = (day: string, label: string) => {
    setPicker(false);
    const image = recipe.image && !isPlaceholderImage(recipe.image) ? recipe.image : undefined;
    const error = kitchen.addToPlan({ id: recipe.id, slug: recipe.slug, title: recipe.title, image }, day);
    if (error) say(error);
    else say(`${label} gününe eklendi.`, "/bu-hafta", "Haftana git");
  };

  const loading = signedIn && !snapshot.loaded;
  const weekLabel = planned.length ? "Haftanda" : "Haftaya ekle";
  const shopLabel = inList ? "Alışverişte" : "Alışverişe ekle";

  const status = (
    <p role="status" aria-live="polite" className={`text-sm ${toast ? (variant === "quick" ? "order-last mt-1 basis-full text-center sm:text-left" : "mt-2") : "sr-only"}`}>
      {toast && (
        <span className="inline-flex flex-wrap items-center gap-x-2 text-slate-600">
          <Check className="h-4 w-4 text-emerald-600" aria-hidden /> {toast.text}
          {toast.href && (
            <Link href={toast.href} className={`rounded font-semibold text-brand underline-offset-4 hover:underline ${FOCUS}`}>{toast.cta}</Link>
          )}
        </span>
      )}
    </p>
  );
  const picking = picker && <DayPicker title={recipe.title} planned={planned.map(p => p.day)} onClose={() => setPicker(false)} onPick={pick} />;

  if (variant === "quick") {
    return (
      <>
        <button type="button" onClick={() => { if (!requireSignIn() && ready) setPicker(true); }} disabled={loading}
          aria-haspopup="dialog" className={quickActionClass}>
          <QuickActionBody tone={planned.length ? "active" : "default"} label={weekLabel}
            icon={loading ? <Loader2 className="h-5 w-5 animate-spin" /> : planned.length ? <CalendarCheck className="h-5 w-5" /> : <CalendarPlus className="h-5 w-5" strokeWidth={1.75} />} />
        </button>
        {hasIngredients && (
          <button type="button" onClick={toggleShopping} disabled={loading} aria-pressed={inList} className={quickActionClass}>
            <QuickActionBody tone={inList ? "active" : "default"} label={shopLabel}
              icon={inList ? <Check className="h-5 w-5" strokeWidth={2.25} /> : <ShoppingBasket className="h-5 w-5" strokeWidth={1.75} />} />
          </button>
        )}
        {status}
        {picking}
      </>
    );
  }

  return (
    <div className="w-full">
      <div className="flex w-full flex-wrap items-center gap-2">
        <button type="button" onClick={() => { if (!requireSignIn() && ready) setPicker(true); }} disabled={loading}
          aria-haspopup="dialog" className={`${BUTTON} flex-1 sm:flex-none ${planned.length ? ACTIVE : IDLE}`}>
          {loading ? <Loader2 className="h-[18px] w-[18px] animate-spin" aria-hidden />
            : planned.length ? <CalendarCheck className="h-[18px] w-[18px]" aria-hidden /> : <CalendarPlus className="h-[18px] w-[18px]" aria-hidden />}
          {weekLabel}
        </button>
        {hasIngredients && (
          <button type="button" onClick={toggleShopping} disabled={loading} aria-pressed={inList}
            className={`${BUTTON} flex-1 sm:flex-none ${inList ? ACTIVE : IDLE}`}>
            {inList ? <Check className="h-[18px] w-[18px]" aria-hidden /> : <ShoppingBasket className="h-[18px] w-[18px]" aria-hidden />}
            {shopLabel}
          </button>
        )}
      </div>

      {status}

      {picking}
    </div>
  );
}

/** This week and next week, Turkish day names, today preselected. */
export function DayPicker({ title, planned, onClose, onPick, now }: {
  title: string; planned: string[]; onClose: () => void; onPick: (day: string, label: string) => void; now?: Date;
}) {
  const id = useId();
  const today = localDay(now);
  const [week, setWeek] = useState(0);
  const days = useMemo(() => weekAt(week, now), [week, now]);
  const [selected, setSelected] = useState(today);
  const dialog = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    dialog.current?.querySelector<HTMLElement>("[data-selected=true]")?.focus();
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const selectedIndex = days.findIndex(d => localDay(d) === selected);
  const label = selectedIndex >= 0 ? `${DAY_LONG[selectedIndex]}${selected === today ? " (bugün)" : ""}` : "";

  return (
    <div role="presentation" className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby={id}
        className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Haftaya ekle</p>
            <h2 id={id} className="mt-1 line-clamp-2 font-heading text-xl font-bold text-slate-900">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-black/5 hover:text-slate-700 ${FOCUS}`}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <div role="tablist" aria-label="Hafta" className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1">
            {[0, 1].map(value => (
              <button key={value} type="button" role="tab" aria-selected={week === value} onClick={() => setWeek(value)}
                className={`h-10 rounded-xl text-sm font-semibold transition ${week === value ? "kz-tab-on bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"} ${FOCUS}`}>
                {value === 0 ? "Bu hafta" : "Gelecek hafta"}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Gün" className="space-y-2">
            {days.map((date, i) => {
              const key = localDay(date);
              const past = key < today;
              const on = key === selected;
              const already = planned.includes(key);
              return (
                <button key={key} type="button" role="radio" aria-checked={on} disabled={past} data-selected={on}
                  onClick={() => setSelected(key)}
                  className={`flex h-12 w-full items-center gap-3 rounded-xl border px-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${on ? "kz-chip-on border-brand bg-[#fdf1ea]" : "border-gray-200 bg-white enabled:hover:border-gray-300"} ${FOCUS}`}>
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-brand bg-brand text-white" : "border-gray-300"}`}>
                    {on && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
                  </span>
                  <span className={`flex-1 text-[15px] font-semibold ${on ? "text-[#a8362b]" : "text-slate-800"}`}>
                    {DAY_LONG[i]}{key === today && <span className="ml-1.5 text-xs font-medium text-brand">Bugün</span>}
                  </span>
                  {already && <span className="text-xs text-gray-500">Planlı</span>}
                  <span className="text-sm text-gray-500 tabular-nums">{date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-gray-100 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
          <button type="button" disabled={selectedIndex < 0 || selected < today} onClick={() => onPick(selected, DAY_LONG[selectedIndex])}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50 ${FOCUS}`}>
            <CalendarPlus className="h-4 w-4" aria-hidden /> {label ? `${label} ekle` : "Bir gün seç"}
          </button>
        </div>
      </section>
    </div>
  );
}
