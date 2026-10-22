"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type ReadyItem = { id: number; status: string; title?: string; recipe_slug?: string };

function stored(userId: number): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(`tariften_ready_seen_${userId}`) || "[]");
    return Array.isArray(v) ? v.filter((n): n is number => Number.isSafeInteger(n) && n > 0) : [];
  } catch { return []; }
}

export default function VideoRecipeReadyNotice() {
  const { user } = useAuth();
  const [ready, setReady] = useState<ReadyItem | null>(null);
  const pathname = usePathname() || "";

  useEffect(() => {
    const token = user?.token;
    const userId = user?.id;
    if (!token || !userId) { setReady(null); return; }
    let active = true;
    const check = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/recipe-social/video/history", {
          headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
        });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (!data || typeof data !== "object" || !("jobs" in data) || !Array.isArray(data.jobs)) return;
        const seen = new Set(stored(userId));
        const unread = (data.jobs as unknown[]).find((job): job is ReadyItem =>
          !!job && typeof job === "object" &&
          ["needs_review", "published"].includes((job as ReadyItem).status) &&
          Number.isSafeInteger((job as ReadyItem).id) &&
          !seen.has((job as ReadyItem).id));
        if (active) setReady(unread || null);
      } catch { /* The notice cannot interrupt normal browsing. */ }
    };
    void check();
    const poll = setInterval(() => { void check(); }, 60000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      clearInterval(poll);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [user?.id, user?.token]);

  if (!ready || !user?.id) return null;
  // Transfer pages already list this; cooking mode must not be interrupted.
  if (["/recipe/aktarimlarim", "/recipe/aktar", "/recipe/social", "/recipe/kendi-videon"].some(path => pathname.startsWith(path)) || pathname.startsWith("/pilot/")) return null;
  // Pages with a fixed bottom action bar on phones: sit above it.
  const lifted = pathname === "/recipe/create" || pathname.startsWith("/recipe/edit/");

  const acknowledge = () => {
    const seen = stored(user.id);
    if (!seen.includes(ready.id)) {
      localStorage.setItem(`tariften_ready_seen_${user.id}`,
        JSON.stringify([...seen, ready.id].slice(-100)));
    }
    setReady(null);
  };

  return (
    <aside role="status" aria-live="polite" aria-label="Hazır tarif bildirimi"
      className={`fixed right-5 z-[105] w-[min(390px,calc(100vw-40px))] overflow-hidden rounded-3xl bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)] ring-1 ring-black/5 ${lifted ? "bottom-24 sm:bottom-5" : "bottom-5"}`}>
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fdf1ea] text-brand">
          <BellRing className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">Tariften&apos;den haber var</p>
          <h3 className="mt-1 font-heading text-base font-bold text-slate-900">
            {ready.status === "published" ? "Tarifin yayımlandı!" : "Tarifin için kontrol gerekiyor"}
          </h3>
          <p className="mt-1 hidden text-[13px] leading-5 text-slate-500 sm:block">
            {ready.status === "published"
              ? (ready.title ? `${ready.title} yayında. Afiyet olsun!` : "Tarifin hazır ve yayında.")
              : "Bazı ayrıntılar netleştirilmeli. Taslağını inceleyebilirsin."}
          </p>
          <Link href={ready.status === "published" && ready.recipe_slug
            ? `/recipe/${encodeURIComponent(ready.recipe_slug)}`
            : `/recipe/aktar?job=${ready.id}`} onClick={acknowledge}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition hover:bg-brand-dark">
            <Check className="h-3.5 w-3.5" /> {ready.status === "published" ? "Tarifi aç" : "Taslağı incele"}
          </Link>
        </div>
        <button type="button" onClick={acknowledge} aria-label="Bildirimi kapat"
          className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
