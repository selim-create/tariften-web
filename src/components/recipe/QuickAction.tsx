import type { ReactNode } from "react";

export type QuickTone = "default" | "primary" | "active";

const CIRCLE: Record<QuickTone, string> = {
  default: "border-gray-200 bg-white text-slate-800 group-hover:border-gray-300 group-hover:text-brand",
  primary: "border-brand bg-brand text-white group-hover:bg-brand-dark group-hover:border-brand-dark",
  active: "border-[#1f1a17] bg-[#1f1a17] text-white",
};

/**
 * One round, labelled action in the recipe's quick-action row — the same
 * pattern as the app (Pişir · Haftaya ekle · Alışverişe ekle · …). Wrap it in a
 * <button> or <Link> with `quickActionClass`.
 */
export function QuickActionBody({ icon, label, tone = "default" }: { icon: ReactNode; label: string; tone?: QuickTone }) {
  return (
    <>
      <span className={`grid h-14 w-14 place-items-center rounded-full border transition duration-200 group-hover:-translate-y-0.5 group-disabled:translate-y-0 ${CIRCLE[tone]}`} aria-hidden>
        {icon}
      </span>
      <span className="line-clamp-2 text-[12.5px] font-medium leading-tight text-slate-700">{label}</span>
    </>
  );
}

export const quickActionClass =
  "group flex min-w-0 max-w-[104px] flex-1 flex-col items-center gap-2 rounded-2xl px-1 py-1 text-center transition disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
