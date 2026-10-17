"use client";

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
  if (loading && !data) return <div role="status" className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-slate-500">Kullanım hakların kontrol ediliyor…</div>;
  if (!data) return error ? <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error} Haklarını kaybetmezsin; son kontrol sunucuda yapılır.</div> : null;
  return (
    <section aria-label="Kullanım haklarım" className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-bold text-slate-900">Kullanım haklarım</h2>
        <span className="rounded-full px-3 py-1 bg-[#eff7f0] text-[#296443] text-xs font-bold">
          {data.tier === "administrator" ? "Yönetici · Sınırsız" : data.tier === "internal" ? "Dahili Hesap · Sınırsız" : "Standart Üye"}
        </span>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Üyelik seçenekleri">
        {data.tier === "administrator" || data.tier === "internal"
          ? <span className="rounded-full border border-[#cce6da] bg-[#eef8f0] px-3 py-1.5 text-xs font-bold text-[#317b57]">{data.tier === "administrator" ? "Yönetici · Sınırsız" : "Dahili Hesap · Sınırsız"}</span>
          : <span className="rounded-full border border-[#e6d3c7] bg-[#fff5ee] px-3 py-1.5 text-xs font-bold text-[#a95642]">Standart Üye</span>}
        <button type="button" disabled title="Henüz yayında değil" className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 opacity-65">Premium · Yakında</button>
        <button type="button" disabled title="Henüz yayında değil" className="cursor-not-allowed rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400 opacity-65">Premium + · Yakında</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kinds.map((kind) => {
          const q = data.quotas[kind];
          const unlimited = q.limit === null;
          const percentage = unlimited ? 0 : q.limit ? Math.min(100, (q.used / q.limit) * 100) : 100;
          return <div key={kind} className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">{labels[kind]}</p>
            <p className="text-xl font-extrabold text-slate-900 mt-1">{unlimited ? "Sınırsız" : `${q.remaining} / ${q.limit} kaldı`}</p>
            {!unlimited && <div aria-hidden="true" className="w-full rounded-full bg-slate-200 h-1.5 mt-3 overflow-hidden"><div className="h-full rounded-full bg-[#db4c3f]" style={{ width: `${percentage}%` }} /></div>}
            {!unlimited && q.remaining === 0 && <p className="text-xs text-amber-800 mt-2">Yeni hak: {quotaReset(data, kind)}</p>}
          </div>;
        })}
      </div>
      {data.account?.login && <p className="text-xs text-slate-500 mt-3">Bu kullanım hakları <strong>{data.account.login}</strong> (WordPress kullanıcı #{data.account.id}) hesabına aittir.</p>}
      <p className="text-xs text-slate-500 mt-3">Menünün içindeki tarifler günlük bağımsız tarif hakkını tüketmez. Kotalar sunucuda kontrol edilir. Sınırsız içerik hakkı, küresel AI bütçesini kaldırmaz.</p>
    </section>
  );
}
