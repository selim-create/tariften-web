"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// İkonlar - Standart Paket (Hata verenler buraya alındı)
import { 
  FaSearch, FaRegBookmark, FaRegMoon, FaArrowRight, FaUser, 
  FaPen, FaPlus, FaBookOpen 
} from "react-icons/fa";
// İkonlar - Yeni Nesil (FA6)
import { FaGear, FaArrowRightFromBracket, FaBars, FaXmark } from "react-icons/fa6"; // FaBars ve FaXmark eklendi

export default function Header() {
  const { user, logout, loading } = useAuth(); // loading eklendi
  const pathname = usePathname();
  const router = useRouter(); 
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [scrolled, setScrolled] = useState(false); // Scroll state eklendi
  
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); 

  // Scroll takibi
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Geçici Fonksiyon: Dark Mode
  const handleDarkMode = () => {
    alert("Karanlık mod altyapısı bir sonraki fazda eklenecektir. 🌙");
  };

  // Arama İşlemi
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recipes?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false); 
    }
  };

  // Arama Kutusunu Aç/Kapat
  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  // Menü dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sayfa değişince menüyü kapat
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false); 
  }, [pathname]);

  // Kullanıcı seviyesini formatla
  const getLevelLabel = (level?: string) => {
    switch (level) {
      case 'pro': return 'Usta Şef';
      case 'intermediate': return 'Hevesli Aşçı';
      case 'beginner': return 'Çırak';
      default: return 'Yeni Üye';
    }
  };

  // Avatar URL
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
        
        {/* NAVIGASYON (Orta) */}
        <nav className={`hidden md:flex items-center space-x-8 text-sm font-medium text-slate-500 transition-opacity duration-300 ${isSearchOpen ? 'lg:opacity-0 pointer-events-none xl:opacity-100 xl:pointer-events-auto' : 'opacity-100'}`}>
          <Link href="/" className={`hover:text-[#db4c3f] transition ${pathname === '/' ? 'text-[#db4c3f] font-bold' : ''}`}>Anasayfa</Link>
          <Link href="/pantry" className={`hover:text-[#db4c3f] transition ${pathname === '/pantry' ? 'text-[#db4c3f] font-bold' : ''}`}>Dolap Modu</Link>
          <Link href="/recipes" className={`hover:text-[#db4c3f] transition ${pathname === '/recipes' ? 'text-[#db4c3f] font-bold' : ''}`}>Tarifler</Link>
        </nav>

        {/* SAĞ AKSİYONLAR */}
        <div className="flex items-center gap-1 md:gap-3 justify-end">
          
          {/* İKON GRUBU */}
          <div className="flex items-center gap-1">
            
            {/* Arama Kutusu */}
            <form onSubmit={handleSearchSubmit} className={`relative flex items-center justify-end transition-all duration-500 ease-in-out ${isSearchOpen ? 'w-[calc(100vw-40px)] md:w-64' : 'w-9'}`}>
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

          {/* Dikey Ayraç */}
          <div className={`hidden md:block w-px h-6 bg-gray-200 mx-1 transition-opacity ${isSearchOpen ? 'opacity-0' : 'opacity-100'}`}></div>
          
          {/* KULLANICI ALANI */}
          {!loading && (
            user ? (
               <div className={`relative transition-opacity duration-300 ${isSearchOpen ? 'hidden md:block' : 'block'}`} ref={menuRef}>
                 <button 
                   onClick={() => setIsMenuOpen(!isMenuOpen)}
                   className="flex items-center gap-3 pl-2 group outline-none text-left"
                 >
                   {/* Avatar */}
                   <div className={`w-9 h-9 rounded-full overflow-hidden border border-transparent group-hover:border-[#db4c3f]/30 ring-2 ring-transparent ${isMenuOpen ? 'ring-[#db4c3f]/20' : ''} relative`}>
                     <Image 
                        src={avatarUrl} 
                        alt="Profil" 
                        fill 
                        className="object-cover"
                        unoptimized={avatarUrl.includes('ui-avatars.com')}
                     />
                   </div>

                   {/* İsim ve Seviye */}
                   <div className="hidden md:flex flex-col items-start justify-center">
                      <span className="text-xs font-bold text-slate-700 group-hover:text-[#db4c3f] transition max-w-[150px] truncate leading-tight">
                        {user.user_display_name || user.user_nicename || "Hesabım"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium leading-tight">
                        {getLevelLabel(user.experience)}
                      </span>
                   </div>
                 </button>

                 {/* DROPDOWN MENU */}
                 {isMenuOpen && (
                   <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in-up origin-top-right">
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
               /* GİRİŞ YAPMAMIŞSA */
               <div className={`transition-opacity duration-300 ${isSearchOpen ? 'hidden' : 'flex'}`}>
                 <div className="hidden md:flex items-center gap-4">
                   <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-[#db4c3f] transition">
                     Giriş Yap
                   </Link>
                   <Link href="/register" className="bg-[#db4c3f] hover:bg-[#b03d32] text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-sm hover:shadow-md flex items-center gap-2 transform hover:-translate-y-0.5">
                     Kayıt Ol <FaArrowRight className="text-[10px]" />
                   </Link>
                 </div>
                 <Link href="/login" className="md:hidden ml-2 text-slate-700 font-bold text-xs bg-gray-100 px-3 py-2 rounded-lg">
                   Giriş
                 </Link>
               </div>
            )
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-2xl text-slate-700 p-2 ml-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)} // Mobilde menüyü açmak için isMenuOpen kullanıyoruz, ayrı bir state yerine
          >
            {isMenuOpen ? <FaXmark /> : <FaBars />}
          </button>

        </div>
      </div>
      
      {/* Mobile Menu Content (Basitleştirilmiş) */}
      {isMenuOpen && !user && ( /* Sadece giriş yapmamışsa veya basit menü için */
         <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 p-4 shadow-lg">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="font-bold text-slate-700">Anasayfa</Link>
              <Link href="/pantry" className="font-bold text-slate-700">Dolap Modu</Link>
              <Link href="/recipes" className="font-bold text-slate-700">Tarifler</Link>
            </nav>
         </div>
      )}
    </header>
  );
}