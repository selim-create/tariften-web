"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChefHat, CircleCheck, X } from "lucide-react";
import { KITCHEN_STEPS, filledStepCount, getKitchenProfile } from "@/lib/kitchen-profile";

/**
 * Calm profile card for the optional kitchen profile. Uses /auth/me's
 * `kitchen_profile_completed` when Core sends it, otherwise asks Core once.
 */
export default function KitchenProfileCard({ token, completed }: { token: string; completed?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const justSaved = params.get("mutfak") === "kaydedildi";
  const [fetched, setFetched] = useState<{ completed: boolean; filled: number } | null>(null);
  const [noticeOpen, setNoticeOpen] = useState(justSaved);

  useEffect(() => {
    if (typeof completed === "boolean" || !token) return;
    let cancelled = false;
    getKitchenProfile(token)
      .then(({ profile }) => { if (!cancelled) setFetched({ completed: profile.completed_at !== null, filled: filledStepCount(profile) }); })
      .catch(() => { /* The card stays in its neutral "Tamamla" state. */ });
    return () => { cancelled = true; };
  }, [completed, token]);

  const done = justSaved || completed === true || fetched?.completed === true;
  const dismiss = () => {
    setNoticeOpen(false);
    router.replace(pathname, { scroll: false });
  };

  return (
    <div className="space-y-3">
      {noticeOpen && (
        <div role="status" className="kp-ok flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <span className="flex-1 text-sm font-medium">Mutfak profilin kaydedildi. Önerilerimizi buna göre şekillendireceğiz.</span>
          <button type="button" onClick={dismiss} aria-label="Bildirimi kapat"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-emerald-800 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
      <section aria-labelledby="kitchen-profile-card" className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <span aria-hidden className="kp-tint grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fdf1ea] text-[#a8362b]">
          <ChefHat className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="kitchen-profile-card" className="font-heading text-lg font-bold text-slate-900">Mutfak profilin</h2>
            {done
              ? <span className="kp-ok inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"><Check className="h-3 w-3" aria-hidden /> Tamamlandı</span>
              : <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{fetched && fetched.filled > 0 ? `${fetched.filled} / ${KITCHEN_STEPS.length} adım` : "İsteğe bağlı"}</span>}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {done
              ? "Hane, beslenme, sevmediklerin, ekipman ve alerjilerin. İstediğin zaman güncelleyebilirsin."
              : "Birkaç kısa soruyla sana uygun tarifleri öne çıkaralım. Her adım atlanabilir."}
          </p>
        </div>
        <Link href="/profile/kitchen"
          className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${done
            ? "border border-gray-200 bg-white text-slate-700 hover:border-brand/40 hover:text-brand"
            : "bg-brand text-white hover:bg-brand-dark"}`}>
          {done ? "Düzenle" : "Tamamla"} <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
