"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * The site's calm modal (same shell as "Hesabı sil" and "Ellerine sağlık!"):
 * dimmed backdrop, white rounded card, Escape and backdrop close, focus kept
 * inside while open and returned to the opener afterwards.
 */
export default function SafetyDialog({ titleId, onClose, busy = false, children }: {
  titleId: string; onClose: () => void; busy?: boolean; children: ReactNode;
}) {
  const card = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => { closeRef.current = onClose; busyRef.current = busy; }, [onClose, busy]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = card.current?.querySelector<HTMLElement>("[data-autofocus]")
      ?? card.current?.querySelector<HTMLElement>("input, textarea, button:not([disabled])");
    first?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab" || !card.current) return;
      const focusable = [...card.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled])")];
      if (!focusable.length) return;
      const firstEl = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); firstEl.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[210] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <section ref={card} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl sm:pb-6">
        <button type="button" onClick={onClose} disabled={busy} aria-label="Kapat"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40">
          <X className="h-5 w-5" aria-hidden />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
