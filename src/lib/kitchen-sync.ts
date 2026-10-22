/**
 * "Bu Hafta" plan and "Alışveriş" list on the web — pure document helpers and
 * the sync engine. No React and no browser globals beyond an injected fetch,
 * so scripts/check-kitchen-sync-web.test.cjs runs it directly.
 *
 * The document lives on the member's account (Core /me/kitchen) and is the
 * same one the app edits. The web keeps no offline copy: it loads the server
 * document, applies edits optimistically, writes them ~800 ms later with the
 * revision it started from and, on 409, merges three-way (mergeKitchen, kept
 * byte-identical with the app) and writes again. Edits made while a request
 * is in flight are kept, exactly like the app's `adopt`.
 *
 * Semantics mirror tariften-mobile/lib/kitchen-store.ts: entry ids
 * `${recipeId}-${day}-${Date.now()}`, manual keys `manual:${Date.now()}`, one
 * shopping source per recipe (adding again replaces it), shopping rows are the
 * recipes' own ingredient rows and checked keys are the merged row keys from
 * buildShoppingList (same function, same keys as the app).
 */
import { EMPTY_DOC, mergeKitchen, sameKitchen } from "./kitchen-merge";
import type { MergeDoc, MergeManual, MergePlan, MergeShopping } from "./kitchen-merge";
import { buildShoppingList, itemAmountText } from "./menu-shopping-list";
import type { ShoppingItem } from "./menu-shopping-list";

export type PlannedRecipe = MergePlan;
export type ShoppingSource = MergeShopping;
export type ManualItem = MergeManual;
export type KitchenState = MergeDoc;

/** Core limits (class-tariften-kitchen-sync.php). */
export const KITCHEN_LIMITS = { plan: 200, shopping: 60, ingredients: 120, manual: 200, manualName: 80, checked: 600 } as const;

export const emptyKitchen = (): KitchenState => ({ version: 1, plan: [], shopping: [], manual: [], checked: [] });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

/** Same filter as the app's sanitize: keeps only rows the screens can render. */
export function sanitizeKitchen(raw: unknown): KitchenState {
  if (!isRecord(raw)) return emptyKitchen();
  const plan = Array.isArray(raw.plan) ? raw.plan : [];
  const shopping = Array.isArray(raw.shopping) ? raw.shopping : [];
  const manual = Array.isArray(raw.manual) ? raw.manual : [];
  const checked = Array.isArray(raw.checked) ? raw.checked : [];
  return {
    version: 1,
    plan: plan.filter((p): p is PlannedRecipe => isRecord(p) && typeof p.slug === "string" && typeof p.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.day)),
    shopping: shopping.filter((s): s is ShoppingSource => isRecord(s) && typeof s.title === "string" && Array.isArray(s.ingredients)),
    manual: manual.filter((m): m is ManualItem => isRecord(m) && typeof m.name === "string"),
    checked: checked.filter((k): k is string => typeof k === "string"),
  };
}

/** Field over Core's limits, or null. Checked before an edit is applied. */
export function kitchenLimitField(state: KitchenState): keyof typeof KITCHEN_LIMITS | null {
  if (state.plan.length > KITCHEN_LIMITS.plan) return "plan";
  if (state.shopping.length > KITCHEN_LIMITS.shopping) return "shopping";
  if (state.shopping.some(s => s.ingredients.length > KITCHEN_LIMITS.ingredients)) return "ingredients";
  if (state.manual.length > KITCHEN_LIMITS.manual) return "manual";
  if (state.checked.length > KITCHEN_LIMITS.checked) return "checked";
  return null;
}

const LIMIT_MESSAGES: Record<keyof typeof KITCHEN_LIMITS, string> = {
  plan: `Haftalık planda en fazla ${KITCHEN_LIMITS.plan} tarif olabilir.`,
  shopping: `Alışveriş listesinde en fazla ${KITCHEN_LIMITS.shopping} tarif olabilir.`,
  ingredients: `Bir tarifin en fazla ${KITCHEN_LIMITS.ingredients} malzemesi listeye eklenebilir.`,
  manual: `Listeye en fazla ${KITCHEN_LIMITS.manual} ürün ekleyebilirsin.`,
  manualName: `Ürün adı en fazla ${KITCHEN_LIMITS.manualName} karakter olabilir.`,
  checked: "İşaretli ürün çok fazla; önce işaretlileri temizle.",
};
export const kitchenLimitMessage = (field: keyof typeof KITCHEN_LIMITS) => LIMIT_MESSAGES[field];

/* ------------------------------------------------------------ days */

export const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
export const DAY_LONG = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"] as const;

export function localDay(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday-first week containing `date`. */
export function weekDays(date = new Date()): Date[] {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Week `offset` weeks away from the week containing `from`. */
export function weekAt(offset: number, from = new Date()): Date[] {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset * 7);
  return weekDays(base);
}

/* ------------------------------------------------------------ edits (pure) */

export type PlanInput = { id: number; slug: string; title: string; image?: string };
export type ShoppingInput = {
  id: number; slug: string; title: string; servings?: number | null;
  ingredients: { name?: unknown; amount?: unknown; unit?: unknown }[] | undefined | null;
};

export function addToPlan(state: KitchenState, recipe: PlanInput, day: string, now = Date.now()): KitchenState {
  const entry: PlannedRecipe = {
    id: `${recipe.id}-${day}-${now}`, recipeId: recipe.id, slug: recipe.slug, title: recipe.title, day, addedAt: now,
  };
  // Core accepts only https images; anything else is simply left out.
  if (recipe.image && /^https:\/\//i.test(recipe.image) && recipe.image.length <= 600) entry.image = recipe.image;
  return { ...state, plan: [...state.plan, entry] };
}

export function removeFromPlan(state: KitchenState, entryId: string): KitchenState {
  return { ...state, plan: state.plan.filter(entry => entry.id !== entryId) };
}

const text = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : "").trim();

/** One source per recipe: adding a recipe again replaces its rows. */
export function addRecipeToShopping(state: KitchenState, recipe: ShoppingInput, now = Date.now()): KitchenState {
  const rows = (recipe.ingredients || [])
    .map(row => ({ name: text(row?.name), amount: text(row?.amount), unit: text(row?.unit) }))
    .filter(row => row.name);
  const servings = typeof recipe.servings === "number" && recipe.servings > 0 ? recipe.servings : null;
  const source: ShoppingSource = {
    recipeId: recipe.id, slug: recipe.slug, title: recipe.title, servings, ingredients: rows, addedAt: now,
  };
  return { ...state, shopping: [...state.shopping.filter(s => s.recipeId !== recipe.id), source] };
}

export function removeRecipeFromShopping(state: KitchenState, recipeId: number): KitchenState {
  return { ...state, shopping: state.shopping.filter(s => s.recipeId !== recipeId) };
}

export function addManualItem(state: KitchenState, name: string, now = Date.now()): KitchenState {
  const clean = name.trim().slice(0, KITCHEN_LIMITS.manualName);
  if (!clean) return state;
  return { ...state, manual: [...state.manual, { key: `manual:${now}`, name: clean, addedAt: now }] };
}

export function removeManualItem(state: KitchenState, key: string): KitchenState {
  return { ...state, manual: state.manual.filter(m => m.key !== key), checked: state.checked.filter(k => k !== key) };
}

export function toggleChecked(state: KitchenState, key: string): KitchenState {
  const checked = state.checked.includes(key) ? state.checked.filter(k => k !== key) : [...state.checked, key];
  return { ...state, checked };
}

/** Removes checked manual rows and clears every check (recipe rows stay). */
export function clearChecked(state: KitchenState): KitchenState {
  const done = new Set(state.checked);
  return { ...state, manual: state.manual.filter(m => !done.has(m.key)), checked: [] };
}

export function isInShopping(state: KitchenState, recipeId: number): boolean {
  return state.shopping.some(source => source.recipeId === recipeId);
}

/** Merged recipe rows, identical to the app's shoppingRows (same keys). */
export function shoppingRows(state: KitchenState): ShoppingItem[] {
  return buildShoppingList(state.shopping.map(source => ({ title: source.title, ingredients: source.ingredients })));
}

/* ------------------------------------------------------------ sync engine */

export type KitchenStatus = "idle" | "loading" | "ready" | "saving" | "error";

export type KitchenSnapshot = {
  state: KitchenState;
  rev: number;
  /** Last copy both sides agreed on (the server document at the last sync). */
  base: KitchenState | null;
  status: KitchenStatus;
  /** Unsaved local edits exist. */
  dirty: boolean;
  loaded: boolean;
  error: string;
  updatedAt: string | null;
};

type Timer = ReturnType<typeof setTimeout>;
export type KitchenSyncOptions = {
  token: string;
  fetch?: typeof fetch;
  endpoint?: string;
  debounceMs?: number;
  retryMs?: number;
  maxConflictRetries?: number;
  setTimer?: (fn: () => void, ms: number) => Timer;
  clearTimer?: (timer: Timer) => void;
  now?: () => number;
};

export type KitchenSync = ReturnType<typeof createKitchenSync>;

type ServerDoc = { state: KitchenState; rev: number; updatedAt: string | null };

function serverDoc(value: unknown): ServerDoc | null {
  if (!isRecord(value) || typeof value.rev !== "number" || !Number.isInteger(value.rev) || value.rev < 0) return null;
  return { state: sanitizeKitchen(value.state), rev: value.rev, updatedAt: typeof value.updated_at === "string" ? value.updated_at : null };
}

function messageFrom(status: number, payload: unknown): string {
  const data = isRecord(payload) ? payload : {};
  const raw = typeof data.message === "string" ? data.message.trim() : "";
  if (raw && !/<\/?[a-z][\s\S]*>/i.test(raw)) return raw;
  if (status === 401 || status === 403) return "Oturumunun süresi dolmuş. Lütfen yeniden giriş yap.";
  if (status === 413) return "Liste çok büyüdü; tamamlananları temizleyip yeniden dene.";
  if (status === 400) return "Liste kaydedilemedi: geçersiz veri.";
  return "Liste şu anda kaydedilemedi. Biraz sonra tekrar denenecek.";
}

export function createKitchenSync(options: KitchenSyncOptions) {
  const doFetch: typeof fetch = options.fetch ?? ((...args) => globalThis.fetch(...args));
  const endpoint = options.endpoint ?? "/api/account/kitchen";
  const debounceMs = options.debounceMs ?? 800;
  const retryMs = options.retryMs ?? 5000;
  const maxConflicts = options.maxConflictRetries ?? 3;
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? (timer => clearTimeout(timer));
  const now = options.now ?? (() => Date.now());
  const token = options.token;

  let snap: KitchenSnapshot = {
    state: emptyKitchen(), rev: 0, base: null, status: "idle", dirty: false, loaded: false, error: "", updatedAt: null,
  };
  const listeners = new Set<() => void>();
  let busy = false;
  let pushAgain = false;
  let pullAgain = false;
  let timer: Timer | null = null;
  let disposed = false;
  let failures = 0;

  const set = (patch: Partial<KitchenSnapshot>) => {
    snap = { ...snap, ...patch };
    for (const listener of listeners) listener();
  };

  async function request(method: "GET" | "PUT", body?: unknown, keepalive = false) {
    const json = body === undefined ? undefined : JSON.stringify(body);
    const res = await doFetch(endpoint, {
      method,
      headers: json
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { Authorization: `Bearer ${token}` },
      body: json,
      cache: "no-store",
      ...(keepalive && json && json.length < 60000 ? { keepalive: true } : {}),
    });
    let data: unknown = null;
    try { data = await res.json(); } catch { /* handled by callers */ }
    return { status: res.status, data };
  }

  function schedule(ms: number) {
    if (disposed) return;
    if (timer) clearTimer(timer);
    timer = setTimer(() => { timer = null; void push(); }, ms);
  }

  /**
   * Take a server document. Anything changed here since `snapshot` (the copy
   * the request started from) is merged back on top, so typing during a save
   * is never lost; if that leaves local changes, another write follows.
   */
  function adopt(server: ServerDoc, snapshot: KitchenState) {
    const next = sameKitchen(snap.state, snapshot) ? server.state : mergeKitchen(snapshot, snap.state, server.state);
    const dirty = !sameKitchen(next, server.state);
    set({ state: next, base: server.state, rev: server.rev, updatedAt: server.updatedAt, dirty, loaded: true, error: "" });
    if (dirty) pushAgain = true;
  }

  async function pull(): Promise<void> {
    if (disposed || !token) return;
    if (busy) { pullAgain = true; return; }
    busy = true;
    if (!snap.loaded) set({ status: "loading" });
    let failed = "";
    try {
      const snapshot = snap.state;
      const got = await request("GET");
      const remote = got.status === 200 ? serverDoc(got.data) : null;
      if (!remote) {
        failed = messageFrom(got.status, got.data);
      } else if (!snap.loaded) {
        set({ state: remote.state, base: remote.state, rev: remote.rev, updatedAt: remote.updatedAt, dirty: false, loaded: true, error: "" });
      } else if (!snap.dirty) {
        adopt(remote, snapshot);
      } else {
        // Unsaved edits here and possibly new ones there: merge, then write.
        const merged = mergeKitchen(snap.base ?? EMPTY_DOC, snap.state, remote.state);
        const dirty = !sameKitchen(merged, remote.state);
        set({ state: merged, base: remote.state, rev: remote.rev, updatedAt: remote.updatedAt, dirty, error: "" });
        if (dirty) pushAgain = true;
      }
    } catch {
      failed = "Bağlantı kurulamadı. İnternet bağlantını kontrol et.";
    } finally {
      busy = false;
      set({ status: failed ? "error" : "ready", error: failed });
      drain();
    }
  }

  async function push(keepalive = false): Promise<void> {
    if (disposed || !token || !snap.loaded) return;
    if (!snap.dirty) return;
    if (busy) { pushAgain = true; return; }
    busy = true;
    set({ status: "saving" });
    let failed = "";
    let retryLater = false;
    try {
      const snapshot = snap.state;
      let sending = snapshot;
      let baseRev = snap.rev;
      let base = snap.base ?? EMPTY_DOC;
      for (let attempt = 0; attempt <= maxConflicts; attempt++) {
        const put = await request("PUT", { state: sending, base_rev: baseRev }, keepalive);
        if (put.status === 200) {
          const saved = serverDoc(put.data);
          if (saved) adopt(saved, snapshot);
          else { failed = messageFrom(502, put.data); retryLater = true; }
          break;
        }
        if (put.status === 409) {
          const inner = isRecord(put.data) && isRecord(put.data.data) ? put.data.data : {};
          const current = serverDoc(inner.current);
          if (!current) { failed = messageFrom(409, put.data); retryLater = true; break; }
          const merged = mergeKitchen(base, sending, current.state);
          if (sameKitchen(merged, current.state)) { adopt(current, snapshot); break; }
          // Remember what the server has now, in case the retries run out.
          set({ base: current.state, rev: current.rev });
          base = current.state;
          baseRev = current.rev;
          sending = merged;
          if (attempt === maxConflicts) { failed = "Liste başka bir cihazda değişiyor; birazdan yeniden denenecek."; retryLater = true; }
          continue;
        }
        failed = messageFrom(put.status, put.data);
        if (put.status === 400 || put.status === 413) {
          // The server refused this content; show what the account really has.
          set({ state: snap.base ?? emptyKitchen(), dirty: false });
        } else if (put.status !== 401 && put.status !== 403) {
          retryLater = true;
        }
        break;
      }
    } catch {
      failed = "Bağlantı kurulamadı; değişikliklerin bu sekmede duruyor, bağlantı gelince kaydedilecek.";
      retryLater = true;
    } finally {
      busy = false;
      failures = failed ? failures + 1 : 0;
      set({ status: failed ? "error" : snap.dirty ? "saving" : "ready", error: failed });
      // Back off while offline: 5 s, 10 s, 20 s … up to a minute.
      if (retryLater && snap.dirty) schedule(Math.min(60000, retryMs * 2 ** Math.max(0, failures - 1)));
      else drain();
    }
  }

  function drain() {
    if (disposed) return;
    if (pullAgain) { pullAgain = false; void pull(); return; }
    if (pushAgain) { pushAgain = false; if (snap.dirty) schedule(0); }
  }

  return {
    getSnapshot: () => snap,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    load: () => pull(),
    refresh: () => pull(),
    /**
     * Apply an edit optimistically and schedule the write. Returns an error
     * message when the edit would break Core's limits (nothing is changed).
     */
    edit(change: (state: KitchenState, at: number) => KitchenState): string {
      if (!snap.loaded) return "Listen henüz yükleniyor.";
      const next = change(snap.state, now());
      if (next === snap.state) return "";
      const over = kitchenLimitField(next);
      if (over) return kitchenLimitMessage(over);
      set({ state: next, dirty: true });
      schedule(debounceMs);
      return "";
    },
    /** Write now (e.g. when the tab is hidden); keepalive lets it finish on unload. */
    flush(keepalive = false) {
      if (timer) { clearTimer(timer); timer = null; }
      return push(keepalive);
    },
    dispose() {
      disposed = true;
      if (timer) clearTimer(timer);
      listeners.clear();
    },
  };
}

/* ------------------------------------------------------------ list rows */

export type KitchenListRow = {
  key: string;
  name: string;
  /** "300 gram", "1 adet + 1 tutam" or "" — summed or as written, never estimated. */
  amount: string;
  /** Recipe titles that use this row (empty for manual rows). */
  recipes: string[];
  manual: boolean;
};

/** Recipe rows (merged, same keys as the app) followed by manual rows. */
export function kitchenListRows(state: KitchenState): KitchenListRow[] {
  return [
    ...shoppingRows(state).map(item => ({
      key: item.key, name: item.name, amount: itemAmountText(item), recipes: item.recipes, manual: false,
    })),
    ...state.manual.map(item => ({ key: item.key, name: item.name, amount: "", recipes: [], manual: true })),
  ];
}

/** Plain-text list for the clipboard (same wording as the app's share). */
export function kitchenListText(rows: KitchenListRow[]): string {
  const lines = rows.map(row => `- ${row.amount ? `${row.amount} ` : ""}${row.name}`);
  return `Alışveriş listem\n\n${lines.join("\n")}\n\nTariften ile hazırlandı · tariften.com`;
}
