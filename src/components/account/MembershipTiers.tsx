/**
 * Product teaser only. Premium plans do not have entitlements or checkout yet.
 * Intentionally disabled so no subscription or billing behavior is implied.
 */
export default function MembershipTiers({ compact = false }: { compact?: boolean }) {
  return <div aria-label="Tariften üyelik seçenekleri" className={compact
    ? "flex flex-wrap items-center gap-2"
    : "grid grid-cols-3 gap-2"}>
    <span className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[#edd1c6] bg-[#fff0e9] px-2 py-2 text-center text-[11px] font-bold text-[#bb4b3f]">
      Standart Üye
    </span>
    {(["Premium", "Premium +"] as const).map(tier =>
      <button key={tier} type="button" disabled aria-disabled="true"
        title={tier + " üyeliği henüz yayında değil"}
        className="inline-flex min-h-9 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] font-semibold text-slate-400 opacity-70"
      >{tier} <span className="text-[9px] font-normal">Yakında</span></button>
    )}
  </div>;
}
