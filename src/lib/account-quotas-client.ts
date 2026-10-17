"use client";

import { useCallback, useEffect, useState } from "react";

export type QuotaKind = "menu_month" | "recipe_day" | "recipe_ai_day";
export type Quota = {
  limit: number | null;
  used: number;
  remaining: number | null;
  reset_at: string;
  available: boolean;
};
export type Quotas = { success: true; tier: string; account?: { id: number; login: string }; quotas: Record<QuotaKind, Quota> };

export function quotaReached(data: Quotas | null, kind: QuotaKind): boolean {
  const q = data?.quotas?.[kind];
  return !!q && q.available && q.remaining !== null && q.remaining <= 0;
}

export function quotaReset(data: Quotas | null, kind: QuotaKind): string {
  const raw = data?.quotas?.[kind]?.reset_at;
  if (!raw) return "";
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? "" : value.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export async function fetchAccountQuotas(token: string): Promise<Quotas> {
  const res = await fetch("/api/account/quotas", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
  const payload: unknown = await res.json();
  if (!res.ok || !payload || typeof payload !== "object" || !("success" in payload) || payload.success !== true) {
    const msg = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
      ? payload.message : "Kullanım hakları alınamadı.";
    throw new Error(msg);
  }
  const data = payload as Quotas;
  if (!data.quotas?.menu_month || !data.quotas?.recipe_day || !data.quotas?.recipe_ai_day) {
    throw new Error("Kullanım hakları yanıtı eksik.");
  }
  return data;
}

export function useAccountQuotas(token?: string | null) {
  const [data, setData] = useState<Quotas | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const reload = useCallback(async () => {
    if (!token) { setData(null); setError(""); return null; }
    setLoading(true);
    try {
      const result = await fetchAccountQuotas(token);
      setData(result);
      setError("");
      return result;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kotalar sorgulanamadı.");
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}
