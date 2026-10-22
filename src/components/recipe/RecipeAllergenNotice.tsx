"use client";

import Link from "next/link";
import { ChevronDown, Info, ShieldAlert } from "lucide-react";
import { useKitchenProfile } from "@/hooks/useKitchenProfile";
import {
  ALLERGEN_DISCLAIMER, ALLERGEN_PROFILE_HREF, type RecipeAllergens,
  allergenNoticeSentences, hasAllergenMatch, matchProfileAllergens, parseRecipeAllergens, publicAllergenSummary,
} from "@/lib/recipe-allergens";

/**
 * Personal allergen band on the recipe page. Renders nothing until the
 * member's kitchen profile is known, and nothing at all for signed-out
 * readers, members without consented allergens, or recipes without a match,
 * so it never reserves space or shifts the page for anyone else.
 */
export default function RecipeAllergenNotice({ allergens }: { allergens?: RecipeAllergens | null }) {
  const kitchen = useKitchenProfile();
  if (kitchen.status !== "ready") return null;
  const { profile, options } = kitchen.data;
  const match = matchProfileAllergens(parseRecipeAllergens(allergens), profile.allergens, profile.allergen_consent_at, options.allergens);
  if (!hasAllergenMatch(match)) return null;
  const strong = match.contains.length > 0;
  const sentences = allergenNoticeSentences(match);

  return (
    <div role="note" aria-label={strong ? "Alerji uyarısı" : "Alerji notu"}
      className={`ra-band ${strong ? "ra-contains border-[#f1d3c6] bg-[#fff6f1] text-[#6e3327]" : "ra-possible border-[#efe2c4] bg-[#fffaf0] text-[#6a4e1e]"} mb-8 flex items-start gap-3 rounded-2xl border px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 lg:mb-10`}>
      <span aria-hidden className={`ra-icon mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${strong ? "bg-[#db4c3f]/10 text-[#b8412f]" : "bg-amber-500/10 text-[#a8701a]"}`}>
        <ShieldAlert className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="ra-text text-[14.5px] leading-6">
            {sentences.map((runs, i) => (
              <span key={i}>
                {i > 0 && " "}
                {runs.map((run, j) => run.strong
                  ? <strong key={j} className="font-semibold">{run.text}</strong>
                  : <span key={j}>{run.text}</span>)}
              </span>
            ))}
          </p>
          <p className="ra-muted mt-0.5 text-xs leading-5 opacity-80">{ALLERGEN_DISCLAIMER}</p>
        </div>
        <Link href={ALLERGEN_PROFILE_HREF}
          className="ra-link inline-flex shrink-0 items-center self-start whitespace-nowrap text-[13px] font-semibold underline decoration-current/30 underline-offset-4 transition hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:self-center">
          Alerji bilgimi düzenle
        </Link>
      </div>
    </div>
  );
}

/**
 * Public, collapsed allergen line under the ingredient list. Shown only when
 * Core found at least one certain allergen; signed-in members get Core's own
 * option labels, everyone else the local fallback map in lib/recipe-allergens.
 */
export function RecipeAllergenInfo({ allergens }: { allergens?: RecipeAllergens | null }) {
  const kitchen = useKitchenProfile();
  const options = kitchen.status === "ready" ? kitchen.data.options.allergens : null;
  const summary = publicAllergenSummary(parseRecipeAllergens(allergens), options);
  if (!summary) return null;
  const count = summary.contains.length + summary.possible.length;

  return (
    <details className="group border-t border-gray-100 pt-1">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg py-3 text-sm text-slate-600 transition hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 font-medium">
          <Info className="h-4 w-4 text-gray-400" aria-hidden strokeWidth={1.75} /> Alerjen bilgisi
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          {count} alerjen
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden />
        </span>
      </summary>
      <div className="space-y-1 pb-2 text-sm leading-6 text-slate-700">
        <p><span className="text-gray-500">İçerir:</span> {summary.contains.join(", ")}</p>
        {summary.possible.length > 0 && <p><span className="text-gray-500">İçerebilir:</span> {summary.possible.join(", ")}</p>}
        <p className="pt-1 text-xs leading-5 text-gray-500">{ALLERGEN_DISCLAIMER}</p>
      </div>
    </details>
  );
}
