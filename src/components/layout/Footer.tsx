"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaFacebookF, FaPinterest } from "react-icons/fa6";
import { subscribeNewsletter } from "@/lib/api";
import RejimdeIcon from '@/components/icons/RejimdeIcon';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    try {
      const result = await subscribeNewsletter(email);
      if (result.success) {
        setSubmitStatus("success");
        setEmail("");
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus("idle"), 5000);
      }
    } catch (error) {
      console.error("Newsletter error:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-x-12 lg:gap-y-12 mb-12">
          
          {/* 1. Sütun: Marka ve Sosyal Medya (4 Sütun) */}
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="Tariften" width={150} height={50} className="h-auto" />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 lg:pr-8">
              Yapay zeka destekli mutfak asistanınız ile mutfakta harikalar yaratmaya hazır mısınız! Sadece evdeki malzemeleri söyleyin, gerisini bize bırakın.
            </p>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/tariftencom/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaInstagram size={18} />
              </a>
              <a href="https://www.facebook.com/tariften" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaFacebookF size={18} />
              </a>
              <a href="https://x.com/tariften" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaTwitter size={18} />
              </a>
              <a href="https://www.youtube.com/@tariften" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaYoutube size={18} />
              </a>
              <a href="https://www.tiktok.com/@tariftencom" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaTiktok size={18} />
              </a>
              <a href="https://tr.pinterest.com/tariftencom/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaPinterest size={18} />
              </a>
            </div>
          </div>

          {/* 2. Sütun: Keşfet (2 Sütun) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-4">Keşfet</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/recipes" className="hover:text-[#db4c3f] transition">Tarifler</Link></li>
              <li><Link href="/pantry" className="hover:text-[#db4c3f] transition">Dolap Asistanı</Link></li>
              <li><Link href="/cookbook" className="hover:text-[#db4c3f] transition">Tarif Defterim</Link></li>
              <li><Link href="/menus" className="hover:text-[#db4c3f] transition">Menüler</Link></li>
            </ul>
          </div>

          {/* 3. Sütun: Kurumsal (2 Sütun) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-4">Kurumsal</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/about" className="hover:text-[#db4c3f] transition">Hakkımızda</Link></li>
              <li><Link href="/contact" className="hover:text-[#db4c3f] transition">İletişim & Reklam</Link></li>
              <li><Link href="/terms" className="hover:text-[#db4c3f] transition">Kullanım Koşulları</Link></li>
              <li><Link href="/privacy" className="hover:text-[#db4c3f] transition">Gizlilik Politikası</Link></li>
              <li><Link href="/kvkk" className="hover:text-[#db4c3f] transition">KVKK</Link></li>
            </ul>
          </div>

          {/* 4. Sütun: Bülten & Mobil Uygulama (4 Sütun - 2 Satır Yüksekliğinde) */}
          <div className="lg:col-span-4 lg:row-span-2 flex flex-col gap-10">
            {/* Uygulama İndirme Banner Alanı */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Uygulamamızı İndirin</h4>
              <p className="text-sm text-slate-500 mb-4">
                Mutfak asistanınız her an yanınızda olsun. Hemen mobil uygulamamızı indirin.
              </p>
              <div className="flex flex-row items-center gap-3">
                <a 
                  href="https://apps.apple.com/my/app/tariften-mutfak-asistan%C4%B1/id6760183583" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <img 
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/tr-tr?size=250x83&amp;releaseDate=1700000000" 
                    alt="App Store'dan İndirin" 
                    className="h-10 w-auto"
                  />
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.tariften.app" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <img 
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/tr_badge_web_generic.png" 
                    alt="Google Play'den Alın" 
                    className="h-14 w-auto -mt-2" 
                  />
                </a>
              </div>
            </div>

            {/* Bülten */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 mb-2">Haftalık Bülten</h4>
              <p className="text-xs text-slate-500 mb-4">En popüler tarifler ve mutfak sırları e-postana gelsin.</p>
              {submitStatus === "success" ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs text-green-700 font-medium">
                  Kaydınız alındı! Lezzetli haberler için takipte kalın. ✨
                </div>
              ) : submitStatus === "error" ? (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs text-red-700 font-medium">
                  Bir hata oluştu. Lütfen daha sonra tekrar deneyin.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-posta adresin" 
                    required
                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-[#db4c3f] shadow-sm"
                  />
                  <button type="submit" className="bg-[#db4c3f] text-white rounded-lg px-4 py-2 text-sm font-bold hover:bg-[#c2410c] transition shadow-sm whitespace-nowrap">
                    Kayıt Ol
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 5. Bölüm: İş Birlikleri (Alt satır, ilk 8 Sütuna yayılır) */}
          <div className="lg:col-span-8 border-t border-gray-100 pt-8 lg:border-t-0 lg:pt-0">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-8">
              {/* Hip Medya Logosu */}
              <a href="https://hipmedya.com" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center">
                {/* İleride SVG veya PNG eklemek isterseniz buraya <Image src="/hipmedya.svg" ... /> ekleyebilirsiniz. Şimdilik tipografik bir logo görünümü: */}
                <span className="font-black text-2xl text-slate-900 tracking-tighter hover:text-[#db4c3f] transition duration-300">
                  hip<span className="text-[#db4c3f]">medya</span>
                </span>
              </a>
              
              {/* Ayırıcı Çizgi (Sadece masaüstünde) */}
              <div className="h-10 w-px bg-gray-200 hidden sm:block"></div>
              
              {/* Partner Linkleri */}
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 font-medium">
                <li>
                  <a href="https://kidsgourmet.com.tr" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">
                    kidsgourmet.com.tr
                  </a>
                </li>
                <li>
                  <a href="https://rejimde.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-emerald-600 transition">
                   rejimde.com
                  </a>
                </li>
                <li>
                  <a href="https://hipinup.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">
                    hipinup.com
                  </a>
                </li>
                <li>
                  <a href="https://piyasavizyon.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">
                    piyasavizyon.com
                  </a>
                </li>
                <li>
                  <a href="https://direktspor.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">
                    direktspor.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Alt Bilgi */}
        <div className="border-t border-gray-100 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            Copyright © {currentYear} Tariften bir <a href="https://hipmedya.com" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-500 hover:text-[#db4c3f] transition">Hip Medya</a> markasıdır. Tüm Hakları Saklıdır. İçerikler kaynak gösterilmeden paylaşılamaz.
          </p>
          <p className="text-xs text-slate-300 font-mono">
            v1.0.0
          </p>
        </div>

      </div>
    </footer>
  );
}