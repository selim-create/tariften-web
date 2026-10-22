"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, Lock, NotebookPen, PenLine, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  NOTE_MAX_LENGTH, RecipeNoteError, deleteMyNote, formatNoteDate, getMyNote, isNoteTooLong,
  normalizeNoteInput, noteLength, saveMyNote, type RecipeNote,
} from "@/lib/recipe-notes";

type Load =
  | { status: "loading" }
  | { status: "hidden" }
  | { status: "error"; message: string; login: boolean }
  | { status: "ready"; note: RecipeNote | null };

/**
 * "Notum": the signed-in member's private note on this recipe. Fetched in the
 * browser with the member's token (no-store) — never server-rendered, never
 * cached — so it can only ever be shown to its owner. Guests see one quiet line.
 */
export default function RecipeNoteCard({ recipeId }: { recipeId: number }) {
  const { user, loading: authLoading } = useAuth();
  const token = user?.token || "";
  const pathname = usePathname();
  const ids = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [load, setLoad] = useState<{ token: string; state: Load }>({ token: "", state: { status: "loading" } });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<{ message: string; login: boolean } | null>(null);
  const [status, setStatus] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyNote(token, recipeId)
      .then(note => { if (active) setLoad({ token, state: { status: "ready", note } }); })
      .catch((reason: unknown) => {
        if (!active) return;
        const err = reason instanceof RecipeNoteError ? reason : null;
        // 404: the recipe is not visible to this member; show nothing at all.
        if (err?.status === 404) { setLoad({ token, state: { status: "hidden" } }); return; }
        setLoad({ token, state: {
          status: "error",
          login: err?.status === 401,
          message: err?.status === 401 ? err.message : "Notun şu anda yüklenemedi.",
        } });
      });
    return () => { active = false; };
  }, [token, recipeId, attempt]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (authLoading) return null;

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;
  if (!token) {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <NotebookPen className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        <span>Bu tarife kendine not almak için <Link href={loginHref} className="font-semibold text-brand hover:underline">giriş yap</Link>.</span>
      </p>
    );
  }

  // A different account on the same tab never sees the previous member's note.
  const state: Load = load.token === token ? load.state : { status: "loading" };
  if (state.status === "hidden") return null;
  const note = state.status === "ready" ? state.note : null;

  const startEditing = () => {
    setDraft(note?.note ?? "");
    setError(null);
    setConfirmDelete(false);
    setEditing(true);
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const fail = (reason: unknown) => {
    const err = reason instanceof RecipeNoteError ? reason : null;
    setError({ message: err?.message || "Not kaydedilemedi. Biraz sonra tekrar dene.", login: err?.status === 401 });
  };

  const save = async () => {
    if (busy || isNoteTooLong(draft)) return;
    setBusy("save");
    setError(null);
    try {
      const saved = await saveMyNote(token, recipeId, draft);
      setLoad({ token, state: { status: "ready", note: saved } });
      setEditing(false);
      setStatus(saved ? "Notun kaydedildi." : note ? "Notun silindi." : "");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy("delete");
    setError(null);
    try {
      await deleteMyNote(token, recipeId);
      setLoad({ token, state: { status: "ready", note: null } });
      setConfirmDelete(false);
      setEditing(false);
      setStatus("Notun silindi.");
    } catch (reason) {
      fail(reason);
    } finally {
      setBusy(null);
    }
  };

  const length = noteLength(draft);
  const tooLong = isNoteTooLong(draft);
  const unchanged = normalizeNoteInput(draft) === normalizeNoteInput(note?.note ?? "");
  const updated = note ? formatNoteDate(note.updatedAt) : "";

  return (
    <section aria-labelledby={`${ids}-title`} className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span aria-hidden className="kp-tint grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fdf1ea] text-[#a8362b]">
            <NotebookPen className="h-4 w-4" />
          </span>
          <div>
            <h2 id={`${ids}-title`} className="font-heading text-lg font-bold text-slate-900">Notum</h2>
            <p className="flex items-center gap-1 text-xs text-gray-500"><Lock className="h-3 w-3" aria-hidden /> Yalnızca sen görürsün</p>
          </div>
        </div>
        {state.status === "ready" && !editing && !note && (
          <button type="button" onClick={startEditing}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-brand/40 hover:text-brand">
            <PenLine className="h-4 w-4" aria-hidden /> Not ekle
          </button>
        )}
      </div>

      <div className="mt-4">
        {state.status === "loading" && (
          <p role="status" className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Notun yükleniyor…
          </p>
        )}

        {state.status === "error" && (
          <p role="alert" className="text-sm text-slate-600">
            {state.message}{" "}
            {state.login
              ? <Link href={loginHref} className="font-semibold text-brand hover:underline">Giriş yap</Link>
              : <button type="button" onClick={() => setAttempt(n => n + 1)} className="font-semibold text-brand hover:underline">Tekrar dene</button>}
          </p>
        )}

        {state.status === "ready" && !editing && !note && (
          <p className="text-sm leading-relaxed text-gray-500">
            Tuzu azalttın mı, süreyi uzattın mı? Bir dahaki sefere hatırlaman için kendine not bırak.
          </p>
        )}

        {state.status === "ready" && !editing && note && (
          <>
            {/* Plain text only: React escapes it; line breaks are kept. */}
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-700">{note.note}</p>
            {confirmDelete ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-gray-50 p-3">
                <p className="mr-auto text-sm font-medium text-slate-700">Notu silmek istiyor musun?</p>
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy !== null}
                  className="h-9 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:text-slate-900">Vazgeç</button>
                <button type="button" onClick={() => void remove()} disabled={busy !== null}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
                  {busy === "delete" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Sil
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                {updated && <p className="mr-auto text-xs text-gray-500">Son güncelleme: {updated}</p>}
                <button type="button" onClick={startEditing}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-brand">
                  <PenLine className="h-4 w-4" aria-hidden /> Düzenle
                </button>
                <button type="button" onClick={() => { setError(null); setConfirmDelete(true); }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-red-600">
                  <Trash2 className="h-4 w-4" aria-hidden /> Sil
                </button>
              </div>
            )}
          </>
        )}

        {state.status === "ready" && editing && (
          <form onSubmit={event => { event.preventDefault(); void save(); }}>
            <label htmlFor={`${ids}-text`} className="sr-only">Notun</label>
            <textarea id={`${ids}-text`} ref={textareaRef} value={draft} rows={4}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void save(); }
                if (event.key === "Escape" && !busy) { event.preventDefault(); setEditing(false); setError(null); }
              }}
              placeholder="Örn. tuzu azalt, fırında 10 dk fazla tut."
              aria-describedby={`${ids}-count`} aria-invalid={tooLong || undefined}
              className={`min-h-[112px] w-full resize-y rounded-2xl border bg-white p-4 text-[15px] leading-relaxed transition focus:outline-none focus:ring-4 ${tooLong ? "border-red-300 focus:ring-red-100" : "border-gray-200 focus:border-brand/40 focus:ring-brand/10"}`} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p id={`${ids}-count`} aria-live="polite"
                className={`mr-auto text-xs tabular-nums ${tooLong ? "font-semibold text-red-600" : "text-gray-500"}`}>
                {length.toLocaleString("tr-TR")} / {NOTE_MAX_LENGTH.toLocaleString("tr-TR")}
                {tooLong && " · Not çok uzun"}
                {!tooLong && note && normalizeNoteInput(draft) === "" && " · Boş kaydedersen not silinir"}
              </p>
              <button type="button" onClick={() => { setEditing(false); setError(null); }} disabled={busy !== null}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 transition hover:text-slate-900">Vazgeç</button>
              <button type="submit" disabled={busy !== null || tooLong || unchanged}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
                {busy === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Kaydet
              </button>
            </div>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error.message}
            {error.login && <> <Link href={loginHref} className="font-semibold underline underline-offset-2">Giriş yap</Link></>}
          </p>
        )}
        <p aria-live="polite" className={status ? "mt-3 text-xs font-medium text-emerald-700" : "sr-only"}>{status}</p>
      </div>
    </section>
  );
}
