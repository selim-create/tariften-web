/**
 * "Evime göre uyarla (N kişi)" — opt-in household adaptation for
 * POST /ai/generate (Core 1.0.62, AI_PERSONALIZATION_ALLERGENS.md).
 *
 * Standard recipes serve 4. Only when the member turns the toggle on does the
 * request carry `adapt_household: true`; otherwise the field is omitted.
 * No imports on purpose: scripts/check-recipe-notes-household-web.test.cjs
 * transpiles and runs this module directly.
 */

export const HOUSEHOLD_MIN = 1;
export const HOUSEHOLD_MAX = 12;

/** Whole household size 1–12 from the kitchen profile, or null (toggle hidden). */
export function householdSizeOf(profile: { household_size?: unknown } | null | undefined): number | null {
  const size = profile?.household_size;
  return typeof size === "number" && Number.isInteger(size) && size >= HOUSEHOLD_MIN && size <= HOUSEHOLD_MAX
    ? size : null;
}

export function householdToggleLabel(size: number): string {
  return `Evime göre uyarla (${size} kişi)`;
}

export type HouseholdRequest = { adaptHousehold?: true };

/** Adapt only when the toggle is on AND the profile still has a size. */
export function householdRequest(enabled: boolean, size: number | null): HouseholdRequest {
  return enabled === true && size !== null ? { adaptHousehold: true } : {};
}

/** Body for POST /ai/generate. `adapt_household` only when explicitly on. */
export function buildGeneratePayload(query: string, options: HouseholdRequest = {}): Record<string, unknown> {
  const payload: Record<string, unknown> = { ingredients: query, type: "suggest" };
  if (options.adaptHousehold === true) payload.adapt_household = true;
  return payload;
}
