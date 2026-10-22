"use client";

import { useKitchenProfile } from "@/hooks/useKitchenProfile";
import { householdSizeOf } from "@/lib/household-adapt";

/**
 * The signed-in member's household size (1–12) from the kitchen profile, or
 * null while loading, signed out, on error or when the profile has none.
 * Null hides the "Evime göre uyarla" toggle, so the request stays standard.
 */
export function useHouseholdSize(): number | null {
  const kitchen = useKitchenProfile();
  return kitchen.status === "ready" ? householdSizeOf(kitchen.data.profile) : null;
}
