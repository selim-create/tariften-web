"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronDown, Loader2, PenLine, Plus, RotateCw, Search, X } from "lucide-react";
import RecipeCover from "@/components/recipe/RecipeCover";
import SocialPlatformBadge from "@/components/recipe/SocialPlatformBadge";
import RecipeCardBadges from "@/components/recipes/RecipeCardBadges";
import { isPlaceholderImage } from "@/lib/utils";
import { getOwnedLibraryPage, type KitchenKind } from "@/lib/owned-library";
import type { Menu, Recipe } from "@/types";

type Item = Recipe | Menu;

/** Positive whole number from API data, or null. Never a default. */
function positive(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

export default function MyKitchenLibrary({
  kind, token, userId,
}: {
  kind: KitchenKind;
  token: string;
  userId: number;
}) {
  const isRecipe = kind === "recipes";
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryPage, setRetryPage] = useState(1);
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (nextPage: number) => {
    const version = ++sequence.current;
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const result = await getOwnedLibraryPage<Item>(
        kind, token, userId, nextPage, current.signal,
      );
      if (version !== sequence.current) return;
      setItems(previous => nextPage === 1 ? result.items : [
        ...previous,
        ...result.items.filter(item => !previous.some(old => old.id === item.id)),
      ]);
      setPage(result.page);
      setPages(result.pages);
      setTotal(result.total);
      setRetryPage(1);
    } catch (reason) {
      if (version !== sequence.current || current.signal.aborted) return;
      setRetryPage(nextPage);
      setError(reason instanceof Error ? reason.message : "İçerikler yüklenemedi.");
    } finally {
      if (version === sequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [kind, token, userId]);

  useEffect(() => {
    void load(1);
    return () => { sequence.current++; controller.current?.abort(); };
  }, [load]);

  const visible = useMemo(() => {
    const text = query.trim().toLocaleLowerCase("tr-TR");
    if (!text) return items;
    return items.filter(item => {
      const summary = isRecipe
        ? (item as Recipe).excerpt
        : (item as Menu).description;
      return [item.title, summary].some(value =>
        (value || "").toLocaleLowerCase("tr-TR").includes(text));
    });
  }, [isRecipe, items, query]);

  const noun = isRecipe ? "tarif" : "sofra";

  return (
    <section className="space-y-6" aria-label={isRecipe ? "Tariflerim" : "Sofralarım"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-12 flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 transition focus-within:border-brand/40 focus-within:ring-4 focus-within:ring-brand/10">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-gray-400" />
          <input className="h-full w-full min-w-0 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-gray-400"
            type="search" autoComplete="off" value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={isRecipe ? "Tariflerinde ara…" : "Sofralarında ara…"}
            aria-label="Yüklenen içeriklerde ara" />
          {query && <button type="button" onClick={() => setQuery("")}
            aria-label="Aramayı temizle" className="text-gray-400 hover:text-brand"><X className="h-4 w-4" /></button>}
        </label>
        <div className="flex items-center gap-2">
          <span className="px-1 text-sm text-gray-500 tabular-nums" aria-live="polite">
            {loading ? "Yükleniyor…" : `${total} ${noun}`}
          </span>
          <button onClick={() => { setQuery(""); void load(1); }}
            disabled={loading || loadingMore} type="button"
            aria-label="İçeriklerimi yenile" title="Yenile"
            className="grid h-12 w-12 place-items-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:text-slate-900 disabled:opacity-50">
            <RotateCw className="h-4 w-4" />
          </button>
          <Link href={isRecipe ? "/recipe/create" : "/menu/create"}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark">
            <Plus className="h-4 w-4" aria-hidden /> {isRecipe ? "Tarif yaz" : "Menü oluştur"}
          </Link>
        </div>
      </div>

      {loading && items.length === 0 && (
        <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> İçeriklerin getiriliyor…
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p>{error}</p>
          <button onClick={() => void load(retryPage)}
            type="button" className="mt-2 font-semibold text-brand underline underline-offset-4">
            Tekrar dene
          </button>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <h3 className="font-heading text-xl font-semibold text-slate-900">
            {isRecipe ? "İlk tarifin için yer hazır." : "İlk sofranı birlikte hazırlayalım."}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {isRecipe ? "Annenden kalma o tarif, defterin ilk sayfasına çok yakışır."
              : "Hazırladığın menüler burada durur; davet günü aramakla uğraşmazsın."}
          </p>
          <Link href={isRecipe ? "/recipe/create" : "/menu/create"}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark">
            <Plus className="h-4 w-4" aria-hidden /> {isRecipe ? "Tarif yaz" : "Menü oluştur"}
          </Link>
        </div>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(item => {
            const recipe = isRecipe ? item as Recipe : null;
            const menu = !isRecipe ? item as Menu : null;
            const href = isRecipe ? `/recipe/${item.slug}` : `/menu/${item.slug}`;
            const editHref = isRecipe ? `/recipe/edit/${item.id}` : `/menu/edit/${item.slug}`;
            const minutes = recipe ? (positive(recipe.prep_time) ?? 0) + (positive(recipe.cook_time) ?? 0) : 0;
            const people = positive(recipe ? recipe.servings : menu?.guest_count);
            const info = [people && `${people} kişilik`, minutes > 0 && `${minutes} dk`].filter(Boolean).join(" · ");

            return (
              <article key={item.id} className="group">
                <Link href={href} tabIndex={-1} aria-hidden
                  className="relative mb-3 block aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                  {!item.image || isPlaceholderImage(item.image)
                    ? <RecipeCover title={item.title} compact />
                    : <Image src={item.image} alt="" fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]" />}
                  <SocialPlatformBadge source={recipe?.social_source} />
                  <RecipeCardBadges recipe={recipe} />
                </Link>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={href} className="line-clamp-2 font-heading text-[17px] font-semibold leading-snug text-slate-900 transition hover:text-brand">{item.title}</Link>
                    {info && <p className="mt-1.5 text-xs text-gray-500 tabular-nums">{info}</p>}
                  </div>
                  <Link href={editHref} aria-label={`${item.title} düzenle`} title="Düzenle"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-slate-500 transition hover:border-brand/40 hover:text-brand">
                    <PenLine className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && query && visible.length === 0 && total > 0 && (
        <p className="rounded-2xl border border-gray-200 bg-white px-5 py-6 text-center text-sm text-gray-500">
          Bu aramayla eşleşen bir {noun} yok. Başka bir kelime dener misin?
        </p>
      )}

      {page < pages && !loading && (
        <button type="button" disabled={loadingMore} onClick={() => void load(page + 1)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-60">
          {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yükleniyor…</> : <><ChevronDown className="h-4 w-4" aria-hidden /> Daha fazla yükle</>}
        </button>
      )}

      {query && page < pages && (
        <p className="text-center text-xs text-gray-500">Arama şimdilik yüklediğin sayfalarda çalışır. Daha fazla sonuç için sayfaları yükleyebilirsin.</p>
      )}
      {!loading && !error && page > 0 && pages <= page && total > 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> Tüm içeriklerin yüklendi.
        </p>
      )}
    </section>
  );
}
