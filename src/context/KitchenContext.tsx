"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  type KitchenSnapshot, type KitchenState, type KitchenSync, type PlanInput, type ShoppingInput,
  addManualItem, addRecipeToShopping, addToPlan, clearChecked, createKitchenSync, emptyKitchen,
  removeFromPlan, removeManualItem, removeRecipeFromShopping, toggleChecked,
} from "@/lib/kitchen-sync";

/**
 * One sync engine per signed-in token for the whole tab. It stays idle until
 * a screen that shows the plan or the list mounts (useKitchen), then loads
 * the account document and refetches whenever the window regains focus.
 */
type Ctx = { sync: KitchenSync | null; acquire: (sync: KitchenSync) => () => void };
const KitchenContext = createContext<Ctx | null>(null);

const IDLE: KitchenSnapshot = {
  state: emptyKitchen(), rev: 0, base: null, status: "idle", dirty: false, loaded: false, error: "", updatedAt: null,
};
const noopSubscribe = () => () => {};
const idleSnapshot = () => IDLE;

export function KitchenProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const token = user?.token || "";
  // Creating the engine does no I/O; loading starts when a screen acquires it.
  const sync = useMemo(() => (token ? createKitchenSync({ token }) : null), [token]);
  const users = useRef(0);

  useEffect(() => {
    if (!sync) return;
    const onFocus = () => { if (users.current > 0) void sync.refresh(); };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void sync.flush(true);
      else onFocus();
    };
    const onHide = () => { void sync.flush(true); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      // Pending edits of this account are written before the engine is dropped.
      void sync.flush(true);
    };
  }, [sync]);

  const acquire = useCallback((target: KitchenSync) => {
    users.current += 1;
    void target.refresh();
    return () => { users.current = Math.max(0, users.current - 1); };
  }, []);

  const value = useMemo(() => ({ sync, acquire }), [sync, acquire]);
  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}

export type KitchenApi = {
  /** Signed-in member with a token; false while auth is still loading. */
  signedIn: boolean;
  authLoading: boolean;
  snapshot: KitchenSnapshot;
  state: KitchenState;
  refresh: () => void;
  addToPlan: (recipe: PlanInput, day: string) => string;
  removeFromPlan: (entryId: string) => string;
  addRecipeToShopping: (recipe: ShoppingInput) => string;
  removeRecipeFromShopping: (recipeId: number) => string;
  addManualItem: (name: string) => string;
  removeManualItem: (key: string) => string;
  toggleChecked: (key: string) => string;
  clearChecked: () => string;
};

export function useKitchen(): KitchenApi {
  const ctx = useContext(KitchenContext);
  const { user, loading } = useAuth();
  const sync = ctx?.sync ?? null;
  const snapshot = useSyncExternalStore(sync ? sync.subscribe : noopSubscribe, sync ? sync.getSnapshot : idleSnapshot, idleSnapshot);

  useEffect(() => {
    if (!ctx || !sync) return;
    return ctx.acquire(sync);
  }, [ctx, sync]);

  return useMemo(() => {
    const edit = (change: (state: KitchenState, at: number) => KitchenState) =>
      sync ? sync.edit(change) : "Planın ve listen için giriş yapmalısın.";
    return {
      signedIn: !!user?.token,
      authLoading: loading,
      snapshot,
      state: snapshot.state,
      refresh: () => { void sync?.refresh(); },
      addToPlan: (recipe, day) => edit((s, at) => addToPlan(s, recipe, day, at)),
      removeFromPlan: id => edit(s => removeFromPlan(s, id)),
      addRecipeToShopping: recipe => edit((s, at) => addRecipeToShopping(s, recipe, at)),
      removeRecipeFromShopping: id => edit(s => removeRecipeFromShopping(s, id)),
      addManualItem: name => edit((s, at) => addManualItem(s, name, at)),
      removeManualItem: key => edit(s => removeManualItem(s, key)),
      toggleChecked: key => edit(s => toggleChecked(s, key)),
      clearChecked: () => edit(s => clearChecked(s)),
    };
  }, [sync, snapshot, user?.token, loading]);
}

/** Login link that brings the member back to where they were. */
export function loginHref(path: string): string {
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
}
