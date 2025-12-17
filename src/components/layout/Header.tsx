"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// İkonlar - Standart Paket
import { 
  FaSearch, FaRegBookmark, FaRegMoon, FaArrowRight, FaUser, 
  FaPen, FaPlus, FaBookOpen 
} from "react-icons/fa";
// İkonlar - Yeni Nesil (FA6)
import { FaGear, FaArrowRightFromBracket, FaBars, FaXmark } from "react-icons/fa6";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter(); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [scrolled, setScrolled] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); 

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDarkMode = () => {
    alert("Karanlık mod altyapısı bir sonraki fazda eklenecektir. 🌙");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recipes?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false); 
    }
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false); 
  }, [pathname]);

  const avatarUrl = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_display_name || "User")}&background=random&color=fff`;

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-white border-b border-gray-100"
      }`}>
      <div className="container mx-auto px-4 h-16 flex justify-between items-center relative">
        
        {/* LOGO */}
        <Link href="/" className={`flex items-center group transition-opacity duration-300 ${isSearchOpen ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}>
          <Image 
            src="/logo.svg" 
            alt="Tariften Logo" 
            width={160} 
            height={40} 
            priority
            className="h-9 w-auto object-contain opacity-90 group-hover:opacity-100 transition" 
          />
        </Link>
        
        {/* NAVIGASYON (Desktop) */}
        <nav className={`hidden md:flex items-center space-x-8 text-sm font-medium text-slate-500 transition-opacity duration-300 ${isSearchOpen ? 'lg:opacity-0 pointer-events-none xl:opacity-100 xl:pointer-events-auto' : 'opacity-100'}`}>
          <Link href="/" className={`hover:text-[#db4c3f] transition ${pathname === '/' ? 'text-[#db4c3f] font-bold' : ''}`}>Anasayfa</Link>
          <Link href="/menus" className={`hover:text-[#db4c3f] transition ${pathname === '/menus' ? 'text-[#db4c3f] font-bold' : ''}`}>Menüler</Link>
          <Link href="/pantry" className={`hover:text-[#db4c3f] transition ${pathname === '/pantry' ? 'text-[#db4c3f] font-bold' : ''}`}>Dolap Modu</Link>
          <Link href="/recipes" className={`hover:text-[#db4c3f] transition ${pathname === '/recipes' ? 'text-[#db4c3f] font-bold' : ''}`}>Tarifler</Link>
        </nav>

        {/* SAĞ AKSİYONLAR */}
        <div className="flex items-center gap-1 md:gap-3 justify-end">
          
          <div className="flex items-center gap-1">
            <form onSubmit={handleSearchSubmit} className={`relative flex items-center justify-end transition-all duration-500 ease-in-out ${isSearchOpen ? 'w-[calc(100vw-80px)] md:w-64' : 'w-9'}`}>
               <input
                 ref={searchInputRef}
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Tarif ara..."
                 className={`absolute right-0 top-0 h-9 bg-gray-100 text-slate-800 text-sm rounded-full pl-4 pr-10 border border-transparent focus:border-[#db4c3f] focus:ring-1 focus:ring-[#db4c3f] outline-none transition-all duration-300 ${isSearchOpen ? 'w-full opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}
               />
               <button 
                 type="button" 
                 onClick={toggleSearch}
                 className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors relative z-10 ${isSearchOpen ? 'bg-[#db4c3f] text-white hover:bg-[#c2410c]' : 'hover:bg-gray-100 text-slate-500 hover:text-[#db4c3f]'}`}
                 title="Ara"
               >
                 <FaSearch className="text-sm" />
               </button>
            </form>

            <Link href="/cookbook" className={`w-9 h-9 rounded-full hover:bg-gray-100 text-slate-500 hover:text-[#db4c3f] flex items-center justify-center transition ${isSearchOpen ? 'hidden md:flex' : 'flex'}`} title="Tarif Defterim">
              <FaRegBookmark className="text-sm" />
            </Link>
            <button 
              onClick={handleDarkMode} 
              className={`w-9 h-9 rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}
              title="Karanlık Mod"
            >
              <FaRegMoon className="text-sm" />
            </button>
          </div>

          <div className={`hidden md:block w-px h-6 bg-gray-200 mx-1 transition-opacity ${isSearchOpen ? 'opacity-0' : 'opacity-100'}`}></div>
          
          {/* DESKTOP KULLANICI ALANI */}
          <div className="hidden md:block">
            {!loading && (
                user ? (
                /* GİRİŞ YAPMIŞSA: Profil Dropdown */
                <div className={`relative transition-opacity duration-300 ${isSearchOpen ? 'hidden md:block' : 'block'}`} ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-3 pl-2 group outline-none text-left"
                  >
                    {/* Avatar SOLDA */}
                    <div className={`w-9 h-9 rounded-full bg-[#db4c3f]/10 border border-transparent group-hover:border-[#db4c3f]/30 flex items-center justify-center text-[#db4c3f] transition ring-2 ring-transparent ${isMenuOpen ? 'ring-[#db4c3f]/20' : ''} overflow-hidden relative`}>
                      <Image 
                          src={avatarUrl} 
                          alt="Profil" 
                          fill 
                          className="object-cover"
                          unoptimized={avatarUrl.includes('ui-avatars.com')}
                      />
                    </div>

                    {/* İsim SAĞDA */}
                    <div className="hidden md:flex flex-col items-start justify-center">
                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#db4c3f] transition max-w-[150px] truncate leading-tight">
                          {user.user_display_name || user.user_nicename || "Hesabım"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium leading-tight">Şef</span>
                    </div>
                  </button>

                  {/* DROPDOWN MENU */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in-up origin-top-right">
                        {/* Header Kısmı */}
                        <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                          <p className="text-xs font-bold text-slate-800">{user.user_display_name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{user.user_email}</p>
                        </div>

                        <div className="py-1">
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#db4c3f] transition">
                            <FaUser className="text-xs" /> Profili Görüntüle
                          </Link>
                          <Link href="/profile/edit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#db4c3f] transition">
                            <FaPen className="text-xs" /> Profili Düzenle
                          </Link>
                          <Link href="/cookbook" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#db4c3f] transition">
                            <FaBookOpen className="text-xs" /> Tarif Defterim
                          </Link>
                        </div>

                        <div className="border-t border-gray-50 py-1">
                          <Link href="/recipe/create" className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#db4c3f] font-bold hover:bg-orange-50 transition">
                            <FaPlus className="text-xs" /> Tarif Oluştur
                          </Link>
                        </div>

                        <div className="border-t border-gray-50 py-1">
                          <Link href="/profile/edit" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-slate-900 transition">
                            <FaGear className="text-xs" /> Ayarlar
                          </Link>
                          <button 
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition text-left"
                          >
                            <FaArrowRightFromBracket className="text-xs" /> Çıkış Yap
                          </button>
                        </div>
                    </div>
                  )}
                </div>
                ) : (
                <div className={`transition-opacity duration-300 flex items-center gap-4 ${isSearchOpen ? 'hidden' : 'flex'}`}>
                    <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-[#db4c3f] transition">
                    Giriş Yap
                    </Link>
                    <Link href="/register" className="bg-[#db4c3f] hover:bg-[#b03d32] text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-sm hover:shadow-md flex items-center gap-2 transform hover:-translate-y-0.5">
                    Kayıt Ol <FaArrowRight className="text-[10px]" />
                    </Link>
                </div>
                )
            )}
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button 
            className="md:hidden text-2xl text-slate-700 p-2 ml-2 z-50 relative"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <FaXmark /> : <FaBars />}
          </button>

        </div>
      </div>
      
      {/* MOBILE MENU OVERLAY */}
      <div className={`md:hidden fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"} pt-20 px-6 overflow-y-auto`}>
         <nav className="flex flex-col gap-6">
            {/* Kullanıcı Kartı (Mobilde) */}
            {user ? (
               <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 relative">
                    <Image 
                        src={avatarUrl} 
                        alt="Profile" 
                        fill 
                        className="object-cover"
                        unoptimized={avatarUrl.includes('ui-avatars.com')}
                    />
                  </div>
                  <div>
                      <div className="font-bold text-slate-800 text-lg">{user.user_display_name}</div>
                      <div className="text-xs text-[#db4c3f] font-bold uppercase">Şef</div>
                  </div>
               </div>
            ) : (
               <div className="bg-orange-50 rounded-2xl p-6 text-center mb-4">
                  <h3 className="font-bold text-slate-800 mb-2">Hoş Geldiniz!</h3>
                  <p className="text-xs text-slate-500 mb-4">Tariften dünyasına katılın.</p>
                  <div className="flex gap-3">
                    <Link href="/login" className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white font-bold text-slate-700 text-sm" onClick={() => setIsMenuOpen(false)}>Giriş</Link>
                    <Link href="/register" className="flex-1 py-2.5 rounded-xl bg-[#db4c3f] text-white font-bold text-sm" onClick={() => setIsMenuOpen(false)}>Kayıt Ol</Link>
                  </div>
               </div>
            )}

            <div className="flex flex-col gap-4 text-lg font-bold text-slate-700">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:text-[#db4c3f]">Anasayfa</Link>
              <Link href="/menus" onClick={() => setIsMenuOpen(false)} className="hover:text-[#db4c3f]">Menüler</Link>
              <Link href="/pantry" onClick={() => setIsMenuOpen(false)} className="hover:text-[#db4c3f]">Dolap Asistanı</Link>
              <Link href="/recipes" onClick={() => setIsMenuOpen(false)} className="hover:text-[#db4c3f]">Tarifler</Link>
              
              {user && (
                <>
                  <hr className="border-gray-100 my-2" />
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-base font-medium text-slate-600">
                    <FaUser /> Profilim
                  </Link>
                  <Link href="/cookbook" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-base font-medium text-slate-600">
                    <FaBookOpen /> Tarif Defterim
                  </Link>
                  <Link href="/recipe/create" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-base font-medium text-[#db4c3f]">
                    <FaPlus /> Tarif Oluştur
                  </Link>
                  <Link href="/profile/edit" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-base font-medium text-slate-600">
                    <FaGear /> Ayarlar
                  </Link>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-3 text-base font-medium text-red-500 mt-2">
                    <FaArrowRightFromBracket /> Çıkış Yap
                  </button>
                </>
              )}
            </div>
         </nav>
      </div>
    </header>
  );
}