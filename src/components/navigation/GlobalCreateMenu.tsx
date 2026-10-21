"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { FaLink, FaPen, FaPlus, FaUtensils, FaXmark, FaArrowRight, FaWandMagicSparkles } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";

const ACTIONS = [
  {
    href: "/recipes?quick=1", title: "AI ile Tarif Oluştur",
    description: "Tarif adı veya malzemelerini yaz; AI Şef hazırlasın.",
    icon: FaWandMagicSparkles,
  },
  {
    href: "/recipe/aktar", title: "Tarif Aktar",
    description: "Reels, TikTok, YouTube bağlantısı veya tarif metni.",
    icon: FaLink,
  },
  {
    href: "/recipe/create", title: "Tarifimi Kendim Yazacağım",
    description: "Malzemeleri, adımları ve görseli kendin belirle.",
    icon: FaPen,
  },
  {
    href: "/menu/create", title: "Menü Oluştur",
    description: "Günlük sofran veya özel davetin için bir menü hazırla.",
    icon: FaUtensils,
  },
] as const;

export default function GlobalCreateMenu() {
  const [opened, setOpened] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const titleId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpened(false); }, [pathname]);

  useEffect(() => {
    if (!opened) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpened(false);
        trigger.current?.focus();
      } else if (event.key === "Tab" && dialog.current) {
        const focusable = [...dialog.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href]:not([aria-hidden="true"])'
        )];
        if (!focusable.length) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
      trigger.current?.focus();
    };
  }, [opened]);

  const navigate = (href: string) => {
    setOpened(false);
    router.push(user?.token ? href : "/login");
  };

  const sheet = opened ? (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-5">
      <button type="button" aria-label="Ekle menüsünü kapat"
        onClick={() => setOpened(false)}
        className="absolute inset-0 w-full cursor-default bg-[#14202a]/55 backdrop-blur-[3px]" />
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="relative w-full max-w-[520px] overflow-hidden rounded-t-[30px] border border-[#f3e2d7] bg-[#fffbf7] px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-6 shadow-[0_25px_90px_rgba(24,35,40,0.23)] sm:rounded-[30px] sm:p-8">
        <div className="mx-auto mb-5 h-1 w-11 rounded-full bg-[#e1d6cc] sm:hidden" />
        <div className="mb-6 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.19em] text-[#c95847]">TARİFTEN · MUTFAĞIM</p>
            <h2 id={titleId} className="mt-2 font-heading text-[25px] font-extrabold tracking-tight text-[#182c32]">
              Ne eklemek istersin?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#95877e]">Mutfaktaki güzel fikirler burada başlar.</p>
          </div>
          <button ref={closeButton} type="button" aria-label="Ekle menüsünü kapat"
            onClick={() => setOpened(false)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#f1e5dc] bg-white text-[#9a8a80] transition hover:bg-[#fff0e9] hover:text-[#d44f41]">
            <FaXmark size={14} />
          </button>
        </div>

        <div className="space-y-3">
          {ACTIONS.map(({ href, title, description, icon: Icon }, index) => (
            <button key={href} type="button" onClick={() => navigate(href)}
              className={`group flex min-h-[73px] w-full items-center gap-3.5 rounded-[19px] border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#e9bfae] hover:shadow-md ${index === 0 ? "border-[#ebbdaf] bg-[#fff0e9]" : "border-[#eee0d4] bg-white"}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-[#da5545] ${index === 0 ? "bg-white" : "bg-[#fff0e5]"}`}>
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-[#24343a]">{title}</span>
                <span className="mt-1 block text-xs leading-5 text-[#90857e]">{description}</span>
              </span>
              <FaArrowRight size={12} className="shrink-0 text-[#cf9b85] transition group-hover:translate-x-1" />
            </button>
          ))}
        </div>

      </div>
    </div>
  ) : null;

  return (
    <>
      <button type="button" ref={trigger} aria-label="Tarif veya menü ekle"
        aria-haspopup="dialog" aria-expanded={opened}
        title="Tarif veya menü ekle"
        onClick={() => setOpened(true)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        <FaPlus size={14} />
      </button>
      {typeof document !== "undefined" && sheet && createPortal(sheet, document.body)}
    </>
  );
}
