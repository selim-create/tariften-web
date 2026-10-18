/**
 * A lightweight, offline validation contract for the manual recipe studio.
 * Mirrors the Mobile manual editor's field requirements without calling AI.
 * Server-side authentication and quota checks remain authoritative.
 */
import { validateRecipeAmount, validateRecipeUnit } from './recipe-measurements';

export type ManualRecipeIngredient = { name: string; amount: string; unit: string };
export type ManualRecipeDraft = {
  title: string;
  servings: string;
  prep_time: string;
  cook_time: string;
  calories: string;
  ingredients: ManualRecipeIngredient[];
  steps: string[];
};
export type ManualRecipeStage = 1 | 2 | 3;
export type ManualRecipeValidation = { stage: ManualRecipeStage; message: string };

export function validateManualRecipeStage(
  draft: ManualRecipeDraft,
  through: ManualRecipeStage = 3,
): ManualRecipeValidation | null {
  if (!draft.title.trim()) return { stage: 1, message: "Önce tarifine bir isim ver." };
  if (draft.title.length > 180) {
    return { stage: 1, message: "Tarif adını biraz kısalt (en fazla 180 karakter)." };
  }
  if (!/^[1-9]\d*$/.test(draft.servings.trim()) || Number(draft.servings) > 36) {
    return { stage: 1, message: "Tarifin kaç kişilik olduğunu belirt (1–36)." };
  }
  for (const field of ["prep_time", "cook_time", "calories"] as const) {
    if (draft[field].trim() && (!/^\d+$/.test(draft[field].trim()) || Number(draft[field]) > 9999)) {
      return { stage: 1, message: "Süre ve kalori alanlarında 0–9999 arasında bir sayı kullan." };
    }
  }
  if (through === 1) return null;

  if (!draft.ingredients.length || draft.ingredients.some(item => !item.name.trim())) {
    return { stage: 2, message: "Her malzeme satırına bir isim yaz." };
  }
  if (draft.ingredients.length > 40) {
    return { stage: 2, message: "Tarifine en fazla 40 malzeme ekleyebilirsin." };
  }
  for (const row of draft.ingredients) {
    const issue = validateRecipeAmount(row.amount) || validateRecipeUnit(row.unit);
    if (issue) return { stage: 2, message: issue };
  }
  if (through === 2) return null;

  if (!draft.steps.length || draft.steps.some(item => !item.trim())) {
    return { stage: 3, message: "Tarifin bütün hazırlanış adımlarını doldur." };
  }
  if (draft.steps.length > 40) {
    return { stage: 3, message: "Tarifine en fazla 40 hazırlanış adımı ekleyebilirsin." };
  }
  return null;
}
