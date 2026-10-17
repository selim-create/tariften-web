/** Visual-only Turkish presentation, never mutates ingredient data in WP. */
export function capitalizeIngredientTr(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, 1).toLocaleUpperCase("tr-TR") + trimmed.slice(1);
}

/**
 * Scale only unambiguous decimal amounts. Ignore missing, NaN, fractional
 * phrases and unknown serving sizes; never render "NaN" or invent a number.
 */
export function formatIngredientAmount(
  amount: unknown, unit: unknown, baseServings: unknown, servings: unknown,
): string {
  const incoming = (typeof amount === "number" || typeof amount === "string") ? String(amount).trim() : "";
  const raw = /^(?:nan|undefined|null|infinity|-infinity)$/i.test(incoming) ? "" : incoming;
  const unitText = typeof unit === "string" ? unit.trim() : "";
  let quantity = raw;
  if (/^\d+(?:[.,]\d+)?$/.test(raw)) {
    const parsed = Number(raw.replace(",", "."));
    const base = Number(baseServings);
    const target = Number(servings);
    if (Number.isFinite(parsed) && Number.isFinite(base) && base > 0 && Number.isFinite(target) && target > 0) {
      const scaled = parsed * target / base;
      const rounded = Math.round(scaled * 100) / 100;
      quantity = Number.isFinite(rounded) ? String(rounded).replace(".", ",") : raw;
    }
  }
  return [quantity, unitText].filter(Boolean).join(" ");
}
