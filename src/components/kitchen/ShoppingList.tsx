"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Eraser, Plus, Trash2, X } from "lucide-react";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import type { KitchenApi } from "@/context/KitchenContext";
import { KITCHEN_LIMITS, kitchenListRows, kitchenListText } from "@/lib/kitchen-sync";
import type { KitchenListRow } from "@/lib/kitchen-sync";
import { FOCUS, SyncStatus } from "./KitchenParts";

/**
 * "Alışveriş": merged recipe rows (same keys as the app, so checks match on
 * both devices) plus the member's own items. Amounts are the recipes' own,
 * summed only when unambiguous; nothing is scaled or estimated.
 */
export default function ShoppingList({ kitchen }: { kitchen: KitchenApi }) {
  const { state, snapshot } = kitchen;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const rows = useMemo(() => kitchenListRows(state), [state]);
  const checked = useMemo(() => new Set(state.checked), [state.checked]);
  const open = rows.filter(row => !checked.has(row.key));
  const done = rows.filter(row => checked.has(row.key));

  const run = (message: string) => { setError(message); return !message; };
  const add = () => {
    if (!draft.trim()) return;
    if (run(kitchen.addManualItem(draft))) setDraft("");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(kitchenListText(open.length ? open : rows));
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch { /* clipboard blocked; the list stays selectable */ }
  };
  const clear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setConfirmClear(false);
    run(kitchen.clearChecked());
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SyncStatus snapshot={snapshot} onRetry={kitchen.refresh} />
          {rows.length > 0 && (
            <button type="button" onClick={() => void copy()}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 ${FOCUS}`}>
              {copied ? <><Check className="h-4 w-4 text-emerald-600" aria-hidden /> Kopyalandı</> : <><Copy className="h-4 w-4" aria-hidden /> Listeyi kopyala</>}
            </button>
          )}
        </div>

        <form onSubmit={event => { event.preventDefault(); add(); }} className="flex gap-2">
          <label htmlFor="kz-manual" className="sr-only">Listeye ürün ekle</label>
          <input id="kz-manual" value={draft} onChange={event => { setDraft(event.target.value); if (error) setError(""); }}
            maxLength={KITCHEN_LIMITS.manualName} autoComplete="off" enterKeyHint="done"
            placeholder="Listeye ekle: süt, ekmek…"
            className="h-12 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-slate-800 outline-none transition placeholder:text-gray-400 focus:border-brand/40 focus:ring-4 focus:ring-brand/10" />
          <button type="submit" disabled={!draft.trim()} aria-label="Ekle"
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40 ${FOCUS}`}>
            <Plus className="h-5 w-5" aria-hidden />
          </button>
        </form>
        {error && <p role="alert" className="kz-warn rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <span className="mb-4 flex gap-2" aria-hidden>
              {["domates", "süt", "ekmek"].map(name => <LokmaIngredientIcon key={name} name={name} size="lg" />)}
            </span>
            <p className="font-heading text-xl font-semibold text-slate-900">Listen henüz boş.</p>
            <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">
              Bir tarifte “Alışverişe ekle”yi seç; malzemeler burada birleşir, aynı birimdekiler toplanır. Yukarıdan kendi ürünlerini de yazabilirsin.
            </p>
            <Link href="/recipes" className={`mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark ${FOCUS}`}>
              Tariflere göz at <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <section aria-labelledby="kz-open-title" className="rounded-3xl border border-gray-200 bg-white">
            <h2 id="kz-open-title" className="flex items-baseline justify-between border-b border-gray-100 px-5 py-4 font-heading text-lg font-semibold text-slate-900">
              Alınacaklar <span className="text-sm font-normal text-gray-500 tabular-nums">{open.length}</span>
            </h2>
            {open.length === 0
              ? <p className="kz-done px-5 py-6 text-center text-sm font-medium text-emerald-700">Hepsi sepette. Afiyet olsun!</p>
              : <ul className="divide-y divide-gray-100">{open.map(row => <ItemRow key={row.key} row={row} checked={false} kitchen={kitchen} onError={setError} />)}</ul>}
          </section>
        )}

        {done.length > 0 && (
          <section aria-labelledby="kz-done-title" className="rounded-3xl border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
              <h2 id="kz-done-title" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">Sepette · {done.length}</h2>
              <div className="flex items-center gap-2">
                {confirmClear && (
                  <button type="button" onClick={() => setConfirmClear(false)} className={`h-9 rounded-xl px-3 text-sm font-medium text-gray-500 hover:text-slate-800 ${FOCUS}`}>Vazgeç</button>
                )}
                <button type="button" onClick={clear}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition ${confirmClear ? "bg-brand text-white hover:bg-brand-dark" : "text-brand hover:bg-brand/5"} ${FOCUS}`}>
                  <Eraser className="h-4 w-4" aria-hidden />
                  {confirmClear ? `${done.length} ürünü temizle` : "İşaretlileri temizle"}
                </button>
              </div>
            </div>
            <ul className="divide-y divide-gray-100">{done.map(row => <ItemRow key={row.key} row={row} checked kitchen={kitchen} onError={setError} />)}</ul>
          </section>
        )}
      </div>

      <aside className="space-y-4 lg:col-span-4">
        <section aria-labelledby="kz-sources-title" className="rounded-3xl border border-gray-200 bg-white p-5">
          <h2 id="kz-sources-title" className="font-heading text-lg font-semibold text-slate-900">Listedeki tarifler</h2>
          {state.shopping.length === 0 ? (
            <p className="mt-2 text-sm leading-6 text-gray-500">Henüz tarif yok. Tarif sayfasındaki “Alışverişe ekle” malzemeleri buraya taşır.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {state.shopping.map(source => (
                <li key={source.recipeId} className="kz-cream inline-flex max-w-full items-center gap-1 rounded-full bg-[#f6efe8] py-1 pl-3.5 pr-1">
                  <Link href={`/recipe/${source.slug}`} className={`min-w-0 truncate rounded text-[13px] font-medium text-slate-800 hover:text-brand ${FOCUS}`}>{source.title}</Link>
                  <span className="shrink-0 text-[11px] text-gray-500 tabular-nums">· {source.ingredients.length}</span>
                  <button type="button" onClick={() => setError(kitchen.removeRecipeFromShopping(source.recipeId))}
                    aria-label={`${source.title} tarifini listeden çıkar`} title="Listeden çıkar"
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-black/5 hover:text-slate-800 ${FOCUS}`}>
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <p className="px-1 text-xs leading-5 text-gray-500">
          Liste hesabına kaydedilir; uygulamada da aynısını görürsün. Miktarlar tariflerde yazdığı gibidir; kişi sayısına göre ölçeklenmez.
        </p>
      </aside>
    </div>
  );
}

function ItemRow({ row, checked, kitchen, onError }: { row: KitchenListRow; checked: boolean; kitchen: KitchenApi; onError: (message: string) => void }) {
  const label = `${row.amount} ${row.name}`.trim();
  return (
    <li className="flex items-center gap-2 px-3 sm:px-4">
      <button type="button" role="checkbox" aria-checked={checked} aria-label={label}
        onClick={() => onError(kitchen.toggleChecked(row.key))}
        className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-3 text-left ${FOCUS}`}>
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${checked ? "border-brand bg-brand text-white" : "border-gray-300"}`}>
          {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
        </span>
        <LokmaIngredientIcon name={row.name} size="sm" className={checked ? "opacity-40" : ""} />
        <span className="min-w-0 flex-1">
          <span className={`block text-[15px] leading-snug ${checked ? "text-gray-400 line-through" : "text-slate-800"}`}>
            {row.amount && <span className={`font-semibold tabular-nums ${checked ? "" : "text-brand"}`}>{row.amount} </span>}{row.name}
          </span>
          {(row.recipes.length > 0 || row.manual) && (
            <span className="mt-0.5 block truncate text-xs text-gray-400">
              {row.manual ? "Kendi eklediğin" : row.recipes.join(" · ")}
            </span>
          )}
        </span>
      </button>
      {row.manual && (
        <button type="button" onClick={() => onError(kitchen.removeManualItem(row.key))} aria-label={`${row.name} sil`} title="Sil"
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-black/5 hover:text-red-600 ${FOCUS}`}>
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </li>
  );
}
