"use client";

import { useId } from "react";
import { Users } from "lucide-react";
import { householdToggleLabel } from "@/lib/household-adapt";

/**
 * Opt-in "Evime göre uyarla (N kişi)" switch for AI recipe screens. Renders
 * nothing without a household size in the kitchen profile. Default is off:
 * standard recipes are written for 4.
 */
export default function HouseholdAdaptToggle({
  size, checked, onChange, disabled = false, tone = "light", className = "",
}: {
  size: number | null;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const id = useId();
  if (size === null) return null;
  const dark = tone === "dark";
  const hint = checked ? `Tarif ${size} kişiye göre yazılır.` : "Kapalıyken tarif 4 kişilik hazırlanır.";

  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${dark ? "bg-white/5 ring-1 ring-white/10" : "bg-gray-50"} ${className}`}>
      <Users aria-hidden className={`h-4 w-4 shrink-0 ${dark ? "text-slate-400" : "text-gray-400"}`} />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={`block cursor-pointer text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
          {householdToggleLabel(size)}
        </label>
        <p id={`${id}-hint`} className={`text-xs ${dark ? "text-slate-400" : "text-gray-500"}`}>{hint}</p>
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} aria-describedby={`${id}-hint`}
        disabled={disabled} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${checked ? "bg-brand" : dark ? "bg-slate-600" : "bg-gray-300"}`}>
        <span aria-hidden className={`inline-block h-5 w-5 rounded-full bg-[#fff] shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}
