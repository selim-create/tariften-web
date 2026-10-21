"use client";

import { Loader2 } from "lucide-react";
import { type QuotaKind, type Quotas, quotaReset } from "@/lib/account-quotas-client";

const labels: Record<QuotaKind, string> = {
  menu_month: "Bu ay menü",
  recipe_day: "Bugün tarif ekleme",
  recipe_ai_day: "Bugün AI tarif denemesi",
};

export default function QuotaPanel({
  data, error, loading, kinds = ["menu_month", "recipe_day", "recipe_ai_day"],
}: {
  data: Quotas | null;
  error?: string;
  loading?: boolean;
  kinds?: QuotaKind[];
}) {
  if (loading && !data) return <div role="status" className="flex items-center gap-2 rounded-3xl border border-gray-200 bg-white p-5 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Kullanım hakların kontrol ediliyor…</div>;
  if (!data) return error ? <div role="status" className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">{error}</div> : null;
  const unlimitedTier = data.tier === "administrator" || data.tier === "internal";
  return (
    <section aria-label="Kullanım haklarım" className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Üyelik seçenekleri">
        {unlimitedTier
          ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">{data.tier === "administrator" ? "Yönetici · Sınırsız" : "Dahili Hesap · Sınırsız"}</span>
          : <span className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Standart Üye</span>}
        <button type="button" disabled title="Henüz yayında değil" className="cursor-not-allowed rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-400">Premium · Yakında</button>
        <button type="button" disabled title="Henüz yayında değil" className="cursor-not-allowed rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-400">Premium + · Yakında</button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kinds.map((kind) => {
          const q = data.quotas[kind];
          const unlimited = q.limit === null;
          const percentage = unlimited ? 0 : q.limit ? Math.min(100, (q.used / q.limit) * 100) : 100;
          return <div key={kind} className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">{labels[kind]}</p>
            <p className="mt-1 font-heading text-xl font-bold tabular-nums text-slate-900">{unlimited ? "Sınırsız" : `${q.remaining} / ${q.limit} kaldı`}</p>
            {!unlimited && <div aria-hidden="true" className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-brand" style={{ width: `${percentage}%` }} /></div>}
            {!unlimited && q.remaining === 0 && <p className="mt-2 text-xs text-amber-800">Yeni hak: {quotaReset(data, kind)}</p>}
          </div>;
        })}
      </div>
    </section>
  );
}
