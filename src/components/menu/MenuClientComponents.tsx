"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, ClipboardList, Copy, CookingPot, PenSquare, Share2, X } from "lucide-react";
import { Menu } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { isPlaceholderImage } from "@/lib/utils";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { lokmaDishName } from "@/lib/lokma-emoji";
import { buildShoppingList, itemAmountText, shoppingListText } from "@/lib/menu-shopping-list";

function Sheet({ title, kicker, onClose, children, footer }: {
  title: string; kicker: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode;
}) {
  const id = useId();
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return (
    <div role="presentation" className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={id}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 pb-4 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{kicker}</p>
            <h2 id={id} className="mt-1 font-heading text-xl font-bold text-slate-900">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="border-t border-gray-100 px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">{footer}</div>}
      </section>
    </div>
  );
}

/**
 * Menu actions: cook (pick a dish for the guide), shopping list, share, edit.
 * Used under the menu header and again in the closing block.
 */
export function MenuActions({ menu, variant = "light" }: { menu: Menu; variant?: "light" | "dark" }) {
  const { user } = useAuth();
  const [open, setOpen] = useState<null | "cook" | "list">(null);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bought, setBought] = useState<string[]>([]);

  const sections = (menu.sections || []).filter(section => (section.recipes || []).length > 0);
  const recipes = sections.flatMap(section => section.recipes);
  const shoppingList = useMemo(
    () => buildShoppingList(recipes.map(recipe => ({ title: recipe.title, ingredients: recipe.ingredients }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menu.id],
  );
  const canEdit = !!user && String(user.id) === String(menu.author_id);
  const dark = variant === "dark";

  const share = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: menu.title, text: menu.description, url: window.location.href }); return; }
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* share sheet dismissed */ }
  };

  const copyList = async () => {
    try {
      await navigator.clipboard.writeText(shoppingListText(menu.title, shoppingList));
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch { /* clipboard blocked */ }
  };

  const ghost = dark
    ? "border-slate-700 text-slate-100 hover:border-slate-500 hover:bg-slate-800"
    : "border-gray-200 bg-white text-slate-700 hover:border-gray-300";

  if (recipes.length === 0 && !canEdit) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {recipes.length > 0 && (
          <>
            <button type="button" onClick={() => setOpen("cook")}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-[15px] font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <CookingPot className="h-[18px] w-[18px]" aria-hidden /> Pişirmeye başla
            </button>
            <button type="button" onClick={() => setOpen("list")}
              className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-[15px] font-semibold transition ${ghost}`}>
              <ClipboardList className="h-[18px] w-[18px]" aria-hidden /> Alışveriş listesi
            </button>
          </>
        )}
        <button type="button" onClick={share} aria-label={shared ? "Bağlantı kopyalandı" : "Menüyü paylaş"} title="Paylaş"
          className={`grid h-12 w-12 place-items-center rounded-xl border transition ${ghost}`}>
          {shared ? <Check className="h-[18px] w-[18px]" /> : <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
        </button>
        {canEdit && !dark && (
          <Link href={`/menu/edit/${menu.slug}`} aria-label="Menüyü düzenle" title="Düzenle"
            className={`grid h-12 w-12 place-items-center rounded-xl border transition ${ghost}`}>
            <PenSquare className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
        )}
      </div>

      {open === "cook" && (
        <Sheet kicker="Pişirme rehberi" title="Hangisiyle başlıyoruz?" onClose={() => setOpen(null)}>
          <p className="mb-4 text-sm leading-relaxed text-slate-500">
            Bir tarif seç; rehber adım adım, istersen sesli eşlik etsin. Tatlı ya da uzun pişen yemekle başlamak çoğu zaman işi rahatlatır.
          </p>
          <div className="space-y-5 pb-2">
            {sections.map((section, sIdx) => (
              <div key={sIdx}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">{section.title}</p>
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200">
                  {section.recipes.map(recipe => {
                    const minutes = (Number(recipe.prep_time) || 0) + (Number(recipe.cook_time) || 0);
                    return (
                      <li key={recipe.id}>
                        <Link href={`/pilot/${recipe.slug}`} className="group flex items-center gap-3 p-3 transition hover:bg-gray-50">
                          <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f6efe8]">
                            {isPlaceholderImage(recipe.image) ? (
                              <LokmaIngredientIcon name={lokmaDishName(recipe.title)} size="lg" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={recipe.image} alt="" className="h-full w-full object-cover" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-slate-900 group-hover:text-brand">{recipe.title}</span>
                            {minutes > 0 && <span className="text-xs text-gray-500 tabular-nums">{minutes} dk</span>}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-brand" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Sheet>
      )}

      {open === "list" && (
        <Sheet kicker={menu.title} title="Alışveriş listesi" onClose={() => setOpen(null)}
          footer={shoppingList.length > 0 && (
            <button type="button" onClick={copyList}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 font-semibold text-white transition hover:bg-slate-800">
              {copied ? <><Check className="h-4 w-4" /> Kopyalandı</> : <><Copy className="h-4 w-4" /> Listeyi kopyala</>}
            </button>
          )}>
          {shoppingList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Bu menüdeki tariflerde malzeme bilgisi yok.</p>
          ) : (
            <>
              <p className="mb-3 text-xs leading-5 text-gray-500">
                {recipes.length} tarifin malzemeleri birleştirildi. Miktarlar tariflerde yazdığı gibidir; kişi sayısına göre ölçeklenmedi.
              </p>
              <ul className="divide-y divide-gray-100">
                {shoppingList.map(item => {
                  const done = bought.includes(item.key);
                  const amount = itemAmountText(item);
                  return (
                    <li key={item.key}>
                      <button type="button" role="checkbox" aria-checked={done}
                        onClick={() => setBought(prev => prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key])}
                        className="flex w-full items-center gap-3 py-2.5 text-left">
                        <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${done ? "border-brand bg-brand text-white" : "border-gray-300"}`}>
                          {done && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <LokmaIngredientIcon name={item.name} size="sm" className={done ? "opacity-40" : ""} />
                        <span className={`min-w-0 flex-1 text-[15px] leading-snug ${done ? "text-gray-400 line-through" : "text-slate-700"}`}>
                          {amount && <span className={`font-semibold tabular-nums ${done ? "" : "text-brand"}`}>{amount} </span>}{item.name}
                          {item.recipes.length > 1 && <span className="mt-0.5 block text-xs text-gray-400">{item.recipes.length} tarifte</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Sheet>
      )}
    </>
  );
}
