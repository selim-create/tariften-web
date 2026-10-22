"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";

export type MoreMenuItem = { key: string; label: string; icon: ReactNode; onSelect: () => void };

/**
 * A small "⋯" button with a short popover menu. Keyboard: Enter/Space opens,
 * arrows move, Escape closes and returns focus; a click outside closes it.
 */
export default function MoreMenu({ label, items, size = "md", className = "" }: {
  label: string; items: MoreMenuItem[]; size?: "sm" | "md"; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
  }, [open]);

  const onMenuKey = (event: React.KeyboardEvent) => {
    const entries = [...(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const index = entries.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    else if (event.key === "ArrowDown") { event.preventDefault(); entries[(index + 1) % entries.length]?.focus(); }
    else if (event.key === "ArrowUp") { event.preventDefault(); entries[(index - 1 + entries.length) % entries.length]?.focus(); }
    else if (event.key === "Tab") setOpen(false);
  };

  if (items.length === 0) return null;
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <div ref={root} className={`relative ${className}`}>
      <button ref={trigger} type="button" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open}
        aria-controls={open ? menuId : undefined} onClick={() => setOpen(v => !v)}
        className={`grid ${box} place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${open ? "bg-gray-100 text-slate-700" : ""}`}>
        <Ellipsis className="h-[18px] w-[18px]" aria-hidden />
      </button>
      {open && (
        <div ref={list} id={menuId} role="menu" aria-label={label} onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-40 mt-1.5 w-60 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
          {items.map(item => (
            <button key={item.key} type="button" role="menuitem" tabIndex={-1}
              onClick={() => { setOpen(false); item.onSelect(); }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 outline-none transition hover:bg-gray-50 focus-visible:bg-gray-50">
              <span className="grid h-5 w-5 shrink-0 place-items-center text-gray-400" aria-hidden>{item.icon}</span>
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
