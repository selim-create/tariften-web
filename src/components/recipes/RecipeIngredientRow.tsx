"use client";

import RecipeSelect from "@/components/recipes/RecipeSelect";
import { RECIPE_UNITS, canTypeRecipeAmount, validateRecipeAmount, validateRecipeUnit } from "@/lib/recipe-measurements";
import { FaTrash } from "react-icons/fa6";

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
  const inputClass = "min-h-12 w-full rounded-xl border border-[#ead9cb] bg-white px-3 py-2.5 text-sm text-[#27343a] outline-none focus:border-[#db4c3f]";
  const labelClass = "mb-1.5 block text-xs font-bold text-[#78665b]";
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#eee2d7] bg-[#fffcf8] p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_2.75rem] sm:items-end">
      <label className="col-span-2 min-w-0 sm:col-span-1">
        <span className={labelClass}>Malzeme</span>
        <input type="text" aria-label={`${index + 1}. malzemenin adı`} placeholder="Örn. soğan"
          value={ingredient.name} onChange={event => onChange("name", event.target.value)}
          className={inputClass} />
      </label>
      <label className="min-w-0">
        <span className={labelClass}>Miktar</span>
        <input type="text" inputMode="decimal" aria-label={`${index + 1}. malzemenin miktarı`}
          aria-invalid={!!amountError} placeholder="Örn. 1/2"
          value={ingredient.amount} onChange={event => {
            if (canTypeRecipeAmount(event.target.value)) onChange("amount", event.target.value);
          }}
          className={inputClass} />
      </label>
      <RecipeSelect label="Birim / boyut" value={ingredient.unit} options={RECIPE_UNITS}
        placeholder="Seç (isteğe bağlı)"
        onChange={value => onChange("unit", value)} />
      <button type="button" onClick={onRemove} aria-label={`${index + 1}. malzemeyi kaldır`}
        className="absolute right-4 top-4 hidden h-12 w-11 items-center justify-center rounded-xl text-[#a58f80] transition hover:bg-[#fee9e6] hover:text-[#bb4639] sm:flex">
        <FaTrash aria-hidden="true" />
      </button>
      <div className="col-span-2 flex items-center justify-end sm:hidden">
        <button type="button" aria-label={`${index + 1}. malzemeyi kaldır`} onClick={onRemove}
          className="inline-flex gap-2 rounded-xl border border-[#eedbd2] px-3 py-2 text-xs font-bold text-[#ad6254]">
          <FaTrash aria-hidden="true" /> Kaldır
        </button>
      </div>
      {(amountError || unitError) && <p role="alert" className="col-span-2 text-xs font-semibold text-[#b34236] sm:col-span-4">
        {index + 1}. malzeme: {amountError || unitError}
      </p>}
    </div>
  );
}
