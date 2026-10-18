"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { FaBookOpen, FaPen, FaPlus, FaUtensils, FaXmark, FaArrowRight } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";

const ACTIONS = [
  {
    href: "/recipe/create", title: "Tarifini kendin yaz",
    description: "Malzemeler, adımlar ve fotoğraf tamamen senin elinde.",
    icon: FaPen,
  },
  {
    href: "/recipe/import", title: "Mutfak notlarından aktar",
    description: "Tarifini anlat; birlikte düzenleyelim.",
    icon: FaBookOpen,
  },
  {
    href: "/menu/create", title: "Yeni menü oluştur",
    description: "Davetin veya günlük sofran için bir menü hazırla.",
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
          {ACTIONS.map(({ href, title, description, icon: Icon }) => (
            <button key={href} type="button" onClick={() => navigate(href)}
              className="group flex min-h-[87px] w-full items-center gap-4 rounded-[20px] border border-[#eee0d4] bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-[#e9bfae] hover:shadow-md">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#fff0e5] text-[#da5545]">
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
        <p className="mt-5 text-center text-[11px] leading-5 text-[#a09288]">
          {user?.token
            ? "Yeni tarifin sen yayınladığında açılır; mevcut tarif düzenlemeleri yönetici onayına sunulur."
            : "Devam etmek için hesabına giriş yapabilirsin."}
        </p>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button type="button" ref={trigger} aria-label="Tarif veya menü ekle"
        aria-haspopup="dialog" aria-expanded={opened}
        title="Tarif veya menü ekle"
        onClick={() => setOpened(true)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[13px] bg-[#e14f43] text-white shadow-[0_5px_14px_rgba(219,76,63,0.17)] transition hover:-translate-y-0.5 hover:bg-[#c84538]">
        <FaPlus size={14} />
      </button>
      {typeof document !== "undefined" && sheet && createPortal(sheet, document.body)}
    </>
  );
}
