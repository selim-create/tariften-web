"use client";

import { useState, type ReactNode } from "react";
import { EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSafety } from "@/context/SafetyContext";
import { BLOCKED_PLACEHOLDER_TITLE, recipeBlockView } from "@/lib/ugc-safety";

/**
 * Recipe page of a member the viewer blocked (Core `author_blocked: true`, or
 * the author is in the local block list): a calm placeholder with
 * "Yine de göster" and "Engeli kaldır" instead of the recipe body.
 */
export default function BlockedRecipeGate({ recipeId, authorId, authorName, authorBlocked, children }: {
  recipeId: number; authorId: number; authorName: string; authorBlocked: boolean; children: ReactNode;
}) {
  const { user } = useAuth();
  const safety = useSafety();
  const [revealedFor, setRevealedFor] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core's flag is only meaningful for this member; a local unblock overrides it.
  const flagged = authorBlocked && !!user?.token && (!safety.ready || safety.isBlocked(authorId));
  const view = recipeBlockView({ author: { id: authorId }, author_blocked: flagged }, safety.blockedIds, revealedFor === recipeId);
  if (view === "show") return <>{children}</>;

  const unblock = async () => {
    setBusy(true);
    setError(null);
    try {
      await safety.unblock(authorId);
      setRevealedFor(recipeId);
      safety.notify({ text: `${authorName || "Üye"} için engel kaldırıldı.`, tone: "ok" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Engel şu anda kaldırılamadı. Biraz sonra tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="blocked-recipe-title" className="mx-auto my-6 max-w-xl rounded-3xl border border-gray-200 bg-white px-6 py-10 text-center sm:my-12 sm:px-10">
      <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-gray-100 text-slate-500"><EyeOff className="h-6 w-6" aria-hidden /></span>
      <h1 id="blocked-recipe-title" className="font-heading text-2xl font-bold tracking-[-0.01em] text-slate-900">{BLOCKED_PLACEHOLDER_TITLE}</h1>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-gray-500">
        Bu tarif {authorName ? <span className="font-medium text-slate-700">{authorName}</span> : "engellediğin bir üye"} tarafından paylaşıldı. Tariflerini ve yorumlarını senden gizliyoruz.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
        <button type="button" onClick={() => setRevealedFor(recipeId)} disabled={busy}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-50">
          Yine de göster
        </button>
        {user?.token && (
          <button type="button" onClick={unblock} disabled={busy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Kaldırılıyor</> : "Engeli kaldır"}
          </button>
        )}
      </div>
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-red-700">{error}</p>
    </section>
  );
}
