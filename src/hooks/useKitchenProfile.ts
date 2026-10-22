"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { type KitchenProfileData, loadKitchenProfile, peekKitchenProfile } from "@/lib/kitchen-profile";

export type KitchenProfileState =
  | { status: "loading"; data: null }
  | { status: "signed-out"; data: null }
  | { status: "error"; data: null }
  | { status: "ready"; data: KitchenProfileData };

/**
 * The signed-in member's kitchen profile, fetched at most once per token per
 * tab (memory cache in lib/kitchen-profile). Callers render nothing until
 * `status === "ready"`, so signed-out readers never see a placeholder.
 */
export function useKitchenProfile(): KitchenProfileState {
  const { user, loading } = useAuth();
  const token = user?.token || "";
  const [result, setResult] = useState<{ token: string; data: KitchenProfileData | null; failed: boolean }>(
    { token: "", data: null, failed: false });

  useEffect(() => {
    if (!token || peekKitchenProfile(token)) return;
    let active = true;
    loadKitchenProfile(token)
      .then(data => { if (active) setResult({ token, data, failed: false }); })
      .catch(() => { if (active) setResult({ token, data: null, failed: true }); });
    return () => { active = false; };
  }, [token]);

  if (loading) return { status: "loading", data: null };
  if (!token) return { status: "signed-out", data: null };
  const data = peekKitchenProfile(token) ?? (result.token === token ? result.data : null);
  if (data) return { status: "ready", data };
  return result.token === token && result.failed ? { status: "error", data: null } : { status: "loading", data: null };
}
