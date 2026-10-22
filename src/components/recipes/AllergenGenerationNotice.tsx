"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert, X } from "lucide-react";
import {
  ALLERGEN_ATTEMPT_NOTE, ALLERGEN_PROFILE_HREF, type AllergenCaution, type AllergenConflict,
} from "@/lib/recipe-allergens";

function AllergenList({ items, tone }: { items: ReadonlyArray<AllergenConflict>; tone: "conflict" | "caution" }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {items.map(item => (
        <li key={item.key} className="text-[13px] leading-5">
          <strong className={`font-semibold ${tone === "conflict" ? "text-[#8f3a2c]" : "text-[#7a5518]"}`}>{item.label}</strong>
          {item.ingredients.length > 0 && <span className="text-slate-600">: {item.ingredients.join(", ")}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Body of the existing error notice for a 422 `ai_allergen_conflict`: Core's
 * Turkish message stays the headline; this adds the ingredients it found, a
 * plain note that the attempt was used, and the way to the allergen list.
 */
export function AllergenConflictDetails({ conflicts, className = "" }: { conflicts: ReadonlyArray<AllergenConflict>; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <AllergenList items={conflicts} tone="conflict" />
      <p className="text-xs leading-5 text-gray-500">{ALLERGEN_ATTEMPT_NOTE} Güncel hakların Profil&apos;de.</p>
      <Link href={ALLERGEN_PROFILE_HREF} className="inline-flex text-xs font-semibold text-brand underline-offset-4 hover:underline">
        Alerji bilgimi düzenle
      </Link>
    </div>
  );
}

type CautionProps = {
  warning: string;
  cautions: ReadonlyArray<AllergenCaution>;
  confirmLabel: string;
  saving: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * A successful generation with "possible" allergen matches: the member reads
 * Core's warning BEFORE the recipe is saved or published, then decides.
 */
export function AllergenCautionDialog({ warning, cautions, confirmLabel, saving, error, onConfirm, onClose }: CautionProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  return (
    <div className="fixed inset-0 z-[195] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={() => { if (!saving) onClose(); }} aria-hidden />
      <div role="dialog" aria-modal="true" aria-labelledby="allergen-caution-title" aria-describedby="allergen-caution-body"
        className="relative z-10 w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-7">
        <button type="button" onClick={onClose} disabled={saving} aria-label="Kapat"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40">
          <X className="h-5 w-5" aria-hidden />
        </button>
        <span aria-hidden className="ra-icon grid h-10 w-10 place-items-center rounded-full bg-amber-500/10 text-[#a8701a]">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <h3 id="allergen-caution-title" className="mt-4 pr-8 font-heading text-xl font-bold leading-snug text-slate-900">
          Tarifin hazır. Kaydetmeden önce bir bak.
        </h3>
        <p id="allergen-caution-body" className="mt-2 text-sm leading-6 text-slate-600">{warning}</p>
        {cautions.length > 0 && (
          <div className="ra-caution mt-4 rounded-2xl border border-[#efe2c4] bg-[#fffaf0] px-4 py-3">
            <AllergenList items={cautions} tone="caution" />
          </div>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-gray-300 disabled:opacity-50">
            Vazgeç
          </button>
          <button type="button" onClick={onConfirm} disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {saving ? "Kaydediliyor…" : confirmLabel}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          <Link href={ALLERGEN_PROFILE_HREF} className="font-semibold text-slate-600 underline-offset-4 hover:text-brand hover:underline">Alerji bilgimi düzenle</Link>
        </p>
      </div>
    </div>
  );
}
