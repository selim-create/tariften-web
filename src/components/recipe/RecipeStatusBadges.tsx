"use client";

import { useState } from "react";
import { Globe2, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { recipeBadgeState, setRecipeVisibility, type RecipeVisibility } from "@/lib/media-recipe-import";
import type { Recipe } from "@/types";

/**
 * Title-row badges on the recipe page: "AI Tahmini Tarif" for everyone, and
 * for the owner of a photo/notebook recipe its visibility with a switch.
 */
export default function RecipeStatusBadges({ recipe }: { recipe: Pick<Recipe, "id" | "ai_estimated" | "visibility" | "source_kind" | "author"> }) {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState<RecipeVisibility>(recipe.visibility === "private" ? "private" : "public");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const state = recipeBadgeState({ ...recipe, visibility }, user?.id);
  if (!state.aiEstimated && !state.privateForOwner && !state.canToggleVisibility) return null;

  const change = async (next: RecipeVisibility) => {
    if (!user?.token || busy) return;
    setBusy(true);
    setError("");
    try {
      setVisibility(await setRecipeVisibility(user.token, recipe.id, next));
      setConfirming(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Görünürlük değiştirilemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-2">
        {state.aiEstimated && (
          <span title="Bu tarif bir yemek fotoğrafına bakılarak tahmin edildi; birebir tarif değildir."
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[#fff4ee] px-3 text-[12px] font-semibold text-[#c2463a] ring-1 ring-[#f1d5c8]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI Tahmini Tarif
          </span>
        )}
        {state.privateForOwner && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-[12px] font-semibold text-slate-700 ring-1 ring-slate-200">
            <LockKeyhole className="h-3.5 w-3.5" aria-hidden /> Sadece sen görüyorsun
          </span>
        )}
        {state.canToggleVisibility && !state.privateForOwner && (
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-[12px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
            <Globe2 className="h-3.5 w-3.5" aria-hidden /> Herkese açık
          </span>
        )}
        {state.canToggleVisibility && !confirming && (
          <button type="button" disabled={busy}
            onClick={() => visibility === "private" ? setConfirming(true) : void change("private")}
            className="inline-flex h-7 items-center gap-1.5 rounded-full px-2 text-[12px] font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-60">
            {busy && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {visibility === "private" ? "Herkese aç" : "Sadece bana göster"}
          </button>
        )}
      </div>
      {confirming && (
        <div role="group" aria-label="Herkese açma onayı" className="mt-3 max-w-md rounded-2xl border border-slate-200 bg-white p-3.5 text-[13px] leading-5 text-slate-600">
          Tarifin Tariften&apos;de herkese açık olacak{state.aiEstimated ? "; “AI Tahmini Tarif” etiketi kalır" : ""}. İstediğin zaman yeniden gizleyebilirsin.
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void change("public")}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Globe2 className="h-3.5 w-3.5" aria-hidden />} Evet, herkese aç
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirming(false)}
              className="inline-flex min-h-9 items-center rounded-xl px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:text-slate-900">Vazgeç</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
