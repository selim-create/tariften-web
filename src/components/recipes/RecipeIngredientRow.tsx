"use client";

import RecipeSelect from "@/components/recipes/RecipeSelect";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { RECIPE_UNITS, canTypeRecipeAmount, validateRecipeAmount, validateRecipeUnit } from "@/lib/recipe-measurements";
import { Trash2 } from "lucide-react";

export type RecipeIngredientRowValue = { name: string; amount: string; unit: string };
export default function RecipeIngredientRow({
  index, ingredient, onChange, onRemove,
}: {
  index: number;
  ingredient: RecipeIngredientRowValue;
  onChange: (field: "name" | "amount" | "unit", value: string) => void;
  onRemove: () => void;
}) {
  const amountError = validateRecipeAmount(ingredient.amount);
  const unitError = validateRecipeUnit(ingredient.unit);
  const inputClass = "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-4 focus:ring-brand/10";
  const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#fcfaf8] p-3 ring-1 ring-black/5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_2.75rem] sm:items-end sm:p-4">
      <label className="col-span-2 min-w-0 sm:col-span-1">
        <span className={labelClass}>Malzeme</span>
        <span className="relative block">
          {/* The Lokma illustration follows what the cook types. */}
          <span className="pointer-events-none absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg bg-[#f6efe8]" aria-hidden>
            <LokmaIngredientIcon name={ingredient.name.trim() || "tabak"} size="md" />
          </span>
          <input type="text" aria-label={`${index + 1}. malzemenin adı`} placeholder="Örn. soğan"
            value={ingredient.name} onChange={event => onChange("name", event.target.value)}
            className={`${inputClass} pl-12`} />
        </span>
      </label>
      <label className="min-w-0">
        <span className={labelClass}>Miktar</span>
        <input type="text" inputMode="decimal" aria-label={`${index + 1}. malzemenin miktarı`}
          aria-invalid={!!amountError} placeholder="Örn. 1/2"
          value={ingredient.amount} onChange={event => {
            if (canTypeRecipeAmount(event.target.value)) onChange("amount", event.target.value);
          }}
          className={`${inputClass} tabular-nums`} />
      </label>
      <RecipeSelect label="Birim / boyut" value={ingredient.unit} options={RECIPE_UNITS}
        placeholder="Seç"
        onChange={value => onChange("unit", value)} />
      <button type="button" onClick={onRemove} aria-label={`${index + 1}. malzemeyi kaldır`}
        className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-200 text-xs font-semibold text-slate-500 transition hover:border-transparent hover:bg-[#fdecea] hover:text-brand sm:col-span-1 sm:border-transparent">
        <Trash2 className="h-4 w-4" aria-hidden="true" /><span className="sm:sr-only">Kaldır</span>
      </button>
      {(amountError || unitError) && <p role="alert" className="col-span-2 text-xs font-semibold text-brand-dark sm:col-span-4">
        {index + 1}. malzeme: {amountError || unitError}
      </p>}
    </div>
  );
}
