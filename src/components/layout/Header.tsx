"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import GlobalCreateMenu from "@/components/navigation/GlobalCreateMenu";
import { Bookmark, CalendarDays, ChevronDown, LogOut, Menu, Moon, Search, Settings, ShoppingBasket, Sun, UserRound, X } from "lucide-react";

// `wide`: shown in the desktop bar from lg up only; md–lg has no room beside the
// account buttons (the mobile menu and footer always list it).
const NAV: readonly { href: string; label: string; wide?: boolean; match: readonly string[] }[] = [
  { href: "/recipes", label: "Tarifler", match: ["/recipes", "/recipe/"] },
  { href: "/menus", label: "Menüler", match: ["/menus", "/menu/"] },
  { href: "/pantry", label: "Dolap Modu", match: ["/pantry"] },
  { href: "/rehber", label: "Mutfak Rehberi", wide: true, match: ["/rehber"] },
  { href: "/blog", label: "Blog", match: ["/blog"] },
];

/** Same two tabs as the app (Bu Hafta · Alışveriş); kept in the account menus. */
const KITCHEN = [
  { href: "/bu-hafta", label: "Bu Hafta", icon: CalendarDays },
  { href: "/alisveris", label: "Alışveriş listem", icon: ShoppingBasket },
] as const;

function isActive(pathname: string, match: readonly string[]) {
  return match.some(prefix => pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`));
}

function Avatar({ url, name, size }: { url?: string; name: string; size: number }) {
  // No third-party generated avatars: a quiet initial on the brand cream.
  if (url) {
    return (
      <span className="relative block shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5" style={{ width: size, height: size }}>
        <Image src={url} alt="" fill sizes={`${size}px`} unoptimized className="object-cover" />
      </span>
    );
  }
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full bg-[#f6efe8] font-heading text-sm font-semibold text-brand ring-1 ring-black/5"
      style={{ width: size, height: size }}>
      {name.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "T"}
    </span>
  );
}

const iconButton = "grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-gray-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const pathname = usePathname() || "/";
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      setIsMobileOpen(false);
      setIsSearchOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Close every overlay on navigation.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsMenuOpen(false);
      setIsMobileOpen(false);
      setIsSearchOpen(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isMobileOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/recipes?q=${encodeURIComponent(query)}`);
    setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    const next = !isSearchOpen;
    setIsSearchOpen(next);
    if (next) setTimeout(() => searchInputRef.current?.focus(), 60);
  };

  const displayName = user?.user_display_name || user?.user_nicename || "Hesabım";

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${scrolled ? "border-gray-200 bg-white/90 backdrop-blur-md" : "border-gray-100 bg-white"}`}>
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">

        <Link href="/" aria-label="Tariften anasayfa"
          className={`flex shrink-0 items-center transition-opacity ${isSearchOpen ? "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-100" : ""}`}>
          <Image src="/logo.svg" alt="Tariften" width={160} height={40} priority className="h-8 w-auto" />
        </Link>

        <nav aria-label="Ana menü"
          className={`hidden items-center gap-0 md:flex lg:gap-1 ${isSearchOpen ? "lg:pointer-events-none lg:opacity-0 xl:pointer-events-auto xl:opacity-100" : ""}`}>
          {NAV.map(item => {
            const active = isActive(pathname, item.match);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={`relative whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition lg:px-3 ${item.wide ? "hidden lg:block" : ""} ${active ? "text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
                {item.label}
                {active && <span aria-hidden className="absolute inset-x-2.5 -bottom-[13px] h-[2px] rounded-full bg-brand lg:inset-x-3" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center justify-end gap-1">
          <form role="search" onSubmit={handleSearchSubmit}
            className={`relative flex items-center justify-end transition-[width] duration-300 ease-out ${isSearchOpen ? "w-[calc(100vw-88px)] md:w-64" : "w-9"}`}>
            <label htmlFor="header-search" className="sr-only">Tarif ara</label>
            <input
              id="header-search"
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tarif ara"
              tabIndex={isSearchOpen ? 0 : -1}
              className={`absolute right-0 top-0 h-9 rounded-full border border-gray-200 bg-gray-50 pl-4 pr-10 text-sm text-slate-800 outline-none transition-all duration-300 focus:border-brand/40 focus:ring-4 focus:ring-brand/10 ${isSearchOpen ? "w-full opacity-100" : "pointer-events-none w-0 opacity-0"}`}
            />
            <button type="button" onClick={toggleSearch} aria-label={isSearchOpen ? "Aramayı kapat" : "Tarif ara"} aria-expanded={isSearchOpen}
              className={`relative z-10 ${iconButton} ${isSearchOpen ? "text-slate-900" : ""}`}>
              {isSearchOpen ? <X className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
          </form>

          <div className={isSearchOpen ? "hidden" : "flex items-center gap-1"}>
            <GlobalCreateMenu />
            <Link href="/cookbook" aria-label="Tarif defterim" title="Tarif defterim"
              className={`${iconButton} hidden sm:grid ${isActive(pathname, ["/cookbook"]) ? "text-brand" : ""}`}>
              <Bookmark className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
            <button type="button" onClick={toggleDarkMode} aria-label={isDarkMode ? "Açık temaya geç" : "Koyu temaya geç"}
              title={isDarkMode ? "Açık tema" : "Koyu tema"} className={`${iconButton} hidden sm:grid`}>
              {isDarkMode ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
          </div>

          <span aria-hidden className={`mx-2 hidden h-6 w-px bg-gray-200 md:block ${isSearchOpen ? "opacity-0" : ""}`} />

          <div className="hidden md:block">
            {!loading && (user ? (
              <div className="relative" ref={menuRef}>
                <button type="button" onClick={() => setIsMenuOpen(open => !open)}
                  aria-haspopup="menu" aria-expanded={isMenuOpen} aria-label="Hesap menüsü"
                  className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-brand">
                  <Avatar url={user.avatar_url} name={displayName} size={32} />
                  <span className="max-w-[140px] truncate text-sm font-medium text-slate-700">{displayName}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition ${isMenuOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>

                {isMenuOpen && (
                  <div role="menu" className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
                    <div className="border-b border-gray-100 px-4 pb-3 pt-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                      {user.user_email && <p className="truncate text-xs text-gray-500">{user.user_email}</p>}
                    </div>
                    <div className="py-1">
                      <Link role="menuitem" href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-gray-50 hover:text-slate-900">
                        <UserRound className="h-4 w-4 text-gray-400" aria-hidden /> Profilim
                      </Link>
                      <Link role="menuitem" href="/cookbook" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-gray-50 hover:text-slate-900">
                        <Bookmark className="h-4 w-4 text-gray-400" aria-hidden /> Tarif defterim
                      </Link>
                      {KITCHEN.map(({ href, label, icon: Icon }) => (
                        <Link key={href} role="menuitem" href={href} aria-current={isActive(pathname, [href]) ? "page" : undefined}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-gray-50 hover:text-slate-900">
                          <Icon className="h-4 w-4 text-gray-400" aria-hidden /> {label}
                        </Link>
                      ))}
                      <Link role="menuitem" href="/profile/edit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-gray-50 hover:text-slate-900">
                        <Settings className="h-4 w-4 text-gray-400" aria-hidden /> Hesap ayarları
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <button role="menuitem" type="button" onClick={logout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-600 transition hover:bg-gray-50 hover:text-red-600">
                        <LogOut className="h-4 w-4 text-gray-400" aria-hidden /> Çıkış yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`items-center gap-2 ${isSearchOpen ? "hidden" : "flex"}`}>
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900">Giriş yap</Link>
                <Link href="/register" className="inline-flex h-9 items-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark">Kayıt ol</Link>
              </div>
            ))}
          </div>

          <button type="button" onClick={() => setIsMobileOpen(open => !open)}
            aria-label={isMobileOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={isMobileOpen} aria-controls="mobile-menu"
            className={`${iconButton} md:hidden ${isSearchOpen ? "hidden" : ""}`}>
            {isMobileOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Mobile menu: sits under the header bar so the close button stays where it was tapped. */}
      <div id="mobile-menu" hidden={!isMobileOpen}
        onClick={(event) => { if ((event.target as HTMLElement).closest("a")) setIsMobileOpen(false); }}
        className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-gray-100 bg-white px-4 pb-10 pt-4 md:hidden">
        {user ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 p-4">
            <Avatar url={user.avatar_url} name={displayName} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{displayName}</p>
              {user.user_email && <p className="truncate text-xs text-gray-500">{user.user_email}</p>}
            </div>
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-2">
            <Link href="/login" className="grid h-11 place-items-center rounded-xl border border-gray-200 text-sm font-semibold text-slate-800">Giriş yap</Link>
            <Link href="/register" className="grid h-11 place-items-center rounded-xl bg-brand text-sm font-semibold text-white">Kayıt ol</Link>
          </div>
        )}

        <nav aria-label="Mobil menü" className="divide-y divide-gray-100">
          {NAV.map(item => {
            const active = isActive(pathname, item.match);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between py-4 font-heading text-lg font-semibold ${active ? "text-brand" : "text-slate-900"}`}>
                {item.label}
              </Link>
            );
          })}
          <Link href="/cookbook" className="flex items-center gap-3 py-4 text-[15px] text-slate-700">
            <Bookmark className="h-[18px] w-[18px] text-gray-400" aria-hidden /> Tarif defterim
          </Link>
          {KITCHEN.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={isActive(pathname, [href]) ? "page" : undefined}
              className={`flex items-center gap-3 py-4 text-[15px] ${isActive(pathname, [href]) ? "text-brand" : "text-slate-700"}`}>
              <Icon className="h-[18px] w-[18px] text-gray-400" aria-hidden /> {label}
            </Link>
          ))}
          {user && (
            <>
              <Link href="/profile" className="flex items-center gap-3 py-4 text-[15px] text-slate-700">
                <UserRound className="h-[18px] w-[18px] text-gray-400" aria-hidden /> Profilim
              </Link>
              <Link href="/profile/edit" className="flex items-center gap-3 py-4 text-[15px] text-slate-700">
                <Settings className="h-[18px] w-[18px] text-gray-400" aria-hidden /> Hesap ayarları
              </Link>
            </>
          )}
          <button type="button" onClick={toggleDarkMode} className="flex w-full items-center gap-3 py-4 text-left text-[15px] text-slate-700">
            {isDarkMode ? <Sun className="h-[18px] w-[18px] text-gray-400" aria-hidden /> : <Moon className="h-[18px] w-[18px] text-gray-400" aria-hidden />}
            {isDarkMode ? "Açık tema" : "Koyu tema"}
          </button>
          {user && (
            <button type="button" onClick={() => { logout(); setIsMobileOpen(false); }}
              className="flex w-full items-center gap-3 py-4 text-left text-[15px] text-red-600">
              <LogOut className="h-[18px] w-[18px]" aria-hidden /> Çıkış yap
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
