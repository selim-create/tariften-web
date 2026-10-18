"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowRight, FaBookOpen, FaCheck, FaChevronDown, FaClock,
  FaPen, FaPlus, FaRotate, FaSearch, FaXmark,
} from "react-icons/fa6";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";
import { getOwnedLibraryPage, type KitchenKind } from "@/lib/owned-library";
import type { Menu, Recipe } from "@/types";

type Item = Recipe | Menu;

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

  return (
    <section className="space-y-5" aria-label={isRecipe ? "Tariflerim" : "Sofralarım"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#cb6654]">
            SENİN MUTFAĞIN
          </span>
          <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-900">
            {isRecipe ? "Tariflerim" : "Sofralarım"}
          </h2>
          <p className="mt-1 text-sm text-[#92847b]">
            {isRecipe ? "Kendi hazırladığın tariflere istediğin zaman dön."
              : "Hazırladığın sofralar ve menüler burada."}
          </p>
        </div>
        <button onClick={() => { setQuery(""); void load(1); }}
          disabled={loading || loadingMore} type="button"
          aria-label="İçeriklerimi yenile"
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#ebddd2] bg-white px-4 text-xs font-bold text-[#ad6652] transition hover:border-[#db4c3f] disabled:opacity-50">
          <FaRotate size={12} /> Yenile
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-[#efe2d7] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-3 rounded-xl bg-[#fbf8f5] px-4">
          <FaSearch aria-hidden className="text-[#a99081]" size={13} />
          <input className="min-h-11 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-[#b4a59c]"
            type="search" autoComplete="off" value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Yüklediğin tarif veya menülerde ara..."
            aria-label="Yüklenen içeriklerde ara" />
          {query && <button type="button" onClick={() => setQuery("")}
            aria-label="Aramayı temizle" className="text-[#ae9587] hover:text-[#db4c3f]"><FaXmark size={12} /></button>}
        </label>
        <span className="px-2 text-xs font-semibold text-[#a18678]" aria-live="polite">
          {loading ? "Yükleniyor…" : `${total} ${isRecipe ? "tarif" : "sofra"}`}
        </span>
      </div>

      {loading && items.length === 0 && (
        <div role="status" className="rounded-2xl border border-[#efe2d7] bg-white p-9 text-center text-sm text-[#967d70]">
          İçeriklerin getiriliyor…
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p>{error}</p>
          <button onClick={() => void load(retryPage)}
            type="button" className="mt-2 font-extrabold text-[#b45337] underline underline-offset-4">
            Tekrar dene
          </button>
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="flex flex-col items-center rounded-[28px] border border-[#efe2d7] bg-white px-6 py-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[#fff1e9] text-[#dc5a46]">
            {isRecipe ? <FaBookOpen size={24} /> : <FaPlus size={24} />}
          </div>
          <h3 className="mt-5 font-heading text-xl font-bold text-slate-900">
            {isRecipe ? "İlk tarifin için yer hazır." : "İlk sofranı birlikte hazırlayalım."}
          </h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#91817a]">
            {isRecipe ? "Mutfağındaki güzel fikirleri paylaşmaya başlayabilirsin."
              : "Yeni bir menü oluşturduğunda burada kolayca bulabileceksin."}
          </p>
          <Link href={isRecipe ? "/recipe/create" : "/menu/create"}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#df5043] px-5 text-sm font-extrabold text-white transition hover:bg-[#bd4037]">
            <FaPlus size={13} /> {isRecipe ? "Tarif yaz" : "Menü oluştur"}
          </Link>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {visible.map(item => {
          const recipe = isRecipe ? item as Recipe : null;
          const menu = !isRecipe ? item as Menu : null;
          const href = isRecipe ? `/recipe/${item.slug}` : `/menu/${item.slug}`;
          const editHref = isRecipe ? `/recipe/edit/${item.id}` : `/menu/edit/${item.slug}`;
          const extra = recipe?.excerpt || menu?.description || "Tariften mutfağından";
          const info = recipe
            ? [recipe.servings && `${recipe.servings} kişilik`, recipe.prep_time && `${recipe.prep_time} dk`].filter(Boolean).join(" · ")
            : menu?.guest_count ? `${menu.guest_count} kişilik` : "Menüyü incele";

          return (
            <article key={item.id} className="overflow-hidden rounded-[20px] border border-[#f0e4da] bg-white shadow-[0_8px_28px_rgba(70,45,35,0.035)] transition hover:border-[#e5c7b8] hover:shadow-md">
              <div className="flex gap-3 p-3">
                <Link href={href} aria-label={item.title}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#fff3e9]">
                  {!item.image || isPlaceholderImage(item.image)
                    ? <ImagePlaceholder title={item.title} variant="card" />
                    : <Image src={item.image} alt={item.title} fill sizes="96px"
                        className="object-cover" unoptimized={item.image.includes("unsplash.com") || item.image.includes("pexels.com")} />}
                </Link>
                <div className="min-w-0 flex-1 py-1">
                  <Link href={href} className="line-clamp-2 font-heading text-[15px] font-extrabold leading-5 text-slate-900 transition hover:text-[#d75042]">{item.title}</Link>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#8d8077]">{extra}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#ac7e67]">
                    <FaClock size={11} /> {info || "Tarifini incele"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#f5eee9] px-4 py-2.5">
                <Link href={href} className="inline-flex items-center gap-2 text-xs font-bold text-[#988479] hover:text-[#d75042]">
                  Görüntüle <FaArrowRight size={10} />
                </Link>
                <Link href={editHref} className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#fff2ec] px-3 text-xs font-extrabold text-[#ca5a48] hover:bg-[#ffe3d7]">
                  <FaPen size={11} /> Düzenle
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && query && visible.length === 0 && total > 0 && (
        <p className="rounded-2xl bg-[#fff9f4] px-5 py-6 text-center text-sm text-[#9a8679]">
          Yüklenen içerikler arasında bu aramayla eşleşen bir sonuç yok.
        </p>
      )}

      {page < pages && !loading && (
        <button type="button" disabled={loadingMore} onClick={() => void load(page + 1)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#e9d5c7] bg-white text-sm font-extrabold text-[#b3624e] transition hover:bg-[#fff7f1] disabled:opacity-60">
          {loadingMore ? "Yükleniyor…" : <><FaChevronDown size={14} /> Daha fazla yükle</>}
        </button>
      )}

      {query && page < pages && (
        <p className="text-center text-xs text-[#9a8579]">Arama şimdilik yüklediğin sayfalarda çalışır. Daha fazla sonuç için sayfaları yükleyebilirsin.</p>
      )}
      {!loading && !error && page > 0 && pages <= page && total > 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-[#9d938c]">
          <FaCheck size={11} className="text-[#439172]" /> Tüm içeriklerin yüklendi.
        </p>
      )}
    </section>
  );
}
