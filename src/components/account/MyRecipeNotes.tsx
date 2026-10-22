"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Loader2, Lock, NotebookPen, RotateCw, Trash2 } from "lucide-react";
import RecipeCover from "@/components/recipe/RecipeCover";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { isPlaceholderImage } from "@/lib/utils";
import { RecipeNoteError, deleteMyNote, formatNoteDate, listMyNotes, type NoteListItem } from "@/lib/recipe-notes";

/**
 * "Notlarım": the member's private recipe notes, newest first (GET /me/notes).
 * Fetched in the browser with the member's token; nothing is cached.
 */
export default function MyRecipeNotes({ token }: { token: string }) {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryPage, setRetryPage] = useState(1);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
  const sequence = useRef(0);

  /** Fetch a page; stale answers (a newer request started) are ignored. */
  const fetchPage = useCallback((nextPage: number) => {
    const version = ++sequence.current;
    const current = () => version === sequence.current;
    return listMyNotes(token, nextPage).then(result => {
      if (!current()) return;
      setNotes(previous => nextPage === 1 ? result.notes : [
        ...previous,
        ...result.notes.filter(item => !previous.some(old => old.recipeId === item.recipeId)),
      ]);
      setPage(result.page);
      setPages(result.pages);
      setTotal(result.total);
      setRetryPage(1);
    }, (reason: unknown) => {
      if (!current()) return;
      setRetryPage(nextPage);
      setError(reason instanceof Error ? reason.message : "Notların yüklenemedi.");
    }).finally(() => {
      if (!current()) return;
      setLoading(false);
      setLoadingMore(false);
    });
  }, [token]);

  const load = (nextPage: number) => {
    if (nextPage === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    return fetchPage(nextPage);
  };

  useEffect(() => {
    // Initial state is already "loading"; state changes only in the callbacks.
    void fetchPage(1);
    const counter = sequence;
    return () => { counter.current++; };
  }, [fetchPage]);

  const remove = async (recipeId: number) => {
    if (deleting !== null) return;
    setDeleting(recipeId);
    setRowError(null);
    try {
      await deleteMyNote(token, recipeId);
      setNotes(previous => previous.filter(item => item.recipeId !== recipeId));
      setTotal(previous => Math.max(0, previous - 1));
      setConfirming(null);
    } catch (reason) {
      setRowError({ id: recipeId, message: reason instanceof RecipeNoteError ? reason.message : "Not silinemedi." });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="space-y-6" aria-label="Notlarım">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm text-gray-500">
          <Lock className="h-3.5 w-3.5" aria-hidden /> Tariflere düştüğün notlar. Yalnızca sen görürsün.
        </p>
        <div className="flex items-center gap-2">
          <span className="px-1 text-sm text-gray-500 tabular-nums" aria-live="polite">
            {loading ? "Yükleniyor…" : `${total} not`}
          </span>
          <button type="button" onClick={() => void load(1)} disabled={loading || loadingMore}
            aria-label="Notlarımı yenile" title="Yenile"
            className="grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-slate-600 transition hover:border-gray-300 hover:text-slate-900 disabled:opacity-50">
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading && notes.length === 0 && (
        <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Notların getiriliyor…
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p>{error}</p>
          <button type="button" onClick={() => void load(retryPage)} className="mt-2 font-semibold text-brand underline underline-offset-4">
            Tekrar dene
          </button>
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8]"><LokmaIngredientIcon name="limon" size="xl" /></span>
          <h2 className="font-heading text-xl font-semibold text-slate-900">Henüz bir notun yok.</h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Bir tarifi pişirirken “tuzu azalt” ya da “10 dk fazla” gibi notlar al; hepsi burada toplanır.
          </p>
          <Link href="/recipes" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-5 font-semibold text-white transition hover:bg-brand-dark">Tarifleri keşfet</Link>
        </div>
      )}

      {notes.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white">
          {notes.map(item => {
            const href = item.available && item.slug ? `/recipe/${item.slug}` : null;
            const title = item.title || "Tarif";
            const date = formatNoteDate(item.updatedAt);
            const isConfirming = confirming === item.recipeId;
            return (
              <li key={item.recipeId} className="flex gap-4 px-4 py-4 sm:px-5">
                <div className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5 ${href ? "" : "grid place-items-center"}`}>
                  {!href ? (
                    <NotebookPen className="h-5 w-5 text-gray-400" aria-hidden />
                  ) : !item.image || isPlaceholderImage(item.image) ? (
                    <RecipeCover title={title} compact />
                  ) : (
                    <Image src={item.image} alt="" fill unoptimized sizes="64px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {href ? (
                    <Link href={href} className="line-clamp-1 font-heading text-[16px] font-semibold leading-snug text-slate-900 transition hover:text-brand">{title}</Link>
                  ) : (
                    <p className="text-sm font-medium text-gray-500">Bu tarif artık erişilebilir değil</p>
                  )}
                  {item.excerpt && (
                    <p className={`mt-1 line-clamp-2 text-sm leading-relaxed ${href ? "text-slate-600" : "text-gray-400"}`}>{item.excerpt}</p>
                  )}
                  {date && <p className="mt-1.5 text-xs text-gray-500">{date}</p>}

                  {isConfirming && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <p className="mr-auto text-sm font-medium text-slate-700">Bu not silinsin mi?</p>
                      <button type="button" onClick={() => setConfirming(null)} disabled={deleting !== null}
                        className="h-9 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900">Vazgeç</button>
                      <button type="button" onClick={() => void remove(item.recipeId)} disabled={deleting !== null}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                        {deleting === item.recipeId && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Sil
                      </button>
                    </div>
                  )}
                  {rowError?.id === item.recipeId && <p role="alert" className="mt-2 text-xs text-red-700">{rowError.message}</p>}
                </div>
                {!isConfirming && (
                  <button type="button" onClick={() => { setRowError(null); setConfirming(item.recipeId); }}
                    aria-label={href ? `${title} notunu sil` : "Erişilemeyen tarifin notunu sil"} title="Notu sil"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {page < pages && !loading && (
        <button type="button" disabled={loadingMore} onClick={() => void load(page + 1)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-60">
          {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yükleniyor…</> : <><ChevronDown className="h-4 w-4" aria-hidden /> Daha fazla yükle</>}
        </button>
      )}
    </section>
  );
}
