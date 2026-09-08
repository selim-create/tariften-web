"use client";

import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaTwitter, FaYoutube, FaTiktok, FaFacebookF, FaPinterest } from "react-icons/fa6";
import NewsletterForm from "@/components/newsletter/NewsletterForm";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-x-12 lg:gap-y-12 mb-12">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="Tariften" width={150} height={50} className="h-auto" />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 lg:pr-8">
              Yapay zeka destekli mutfak asistanınız ile mutfakta harikalar yaratmaya hazır mısınız! Sadece evdeki malzemeleri söyleyin, gerisini bize bırakın.
            </p>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/tariftencom/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition"><FaInstagram size={18} /></a>
              <a href="https://www.facebook.com/tariften" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition"><FaFacebookF size={18} /></a>
              <a href="https://x.com/tariften" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition"><FaTwitter size={18} /></a>
              <a href="https://www.youtube.com/@tariften" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition"><FaYoutube size={18} /></a>
              <a href="https://www.tiktok.com/@tariftencom" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition"><FaTiktok size={18} /></a>
              <a href="https://tr.pinterest.com/tariftencom/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition"><FaPinterest size={18} /></a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-4">Keşfet</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/recipes" className="hover:text-[#db4c3f] transition">Tarifler</Link></li>
              <li><Link href="/pantry" className="hover:text-[#db4c3f] transition">Dolap Asistanı</Link></li>
              <li><Link href="/cookbook" className="hover:text-[#db4c3f] transition">Tarif Defterim</Link></li>
              <li><Link href="/menus" className="hover:text-[#db4c3f] transition">Menüler</Link></li>
            </ul>
          </div>

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

          <div className="lg:col-span-4 lg:row-span-2 flex flex-col gap-8">
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Uygulamamızı İndirin</h4>
              <p className="text-sm text-slate-500 mb-4">Mutfak asistanınız her an yanınızda olsun. Hemen mobil uygulamamızı indirin.</p>
              <div className="flex flex-row items-center gap-3">
                <a href="https://apps.apple.com/my/app/tariften-mutfak-asistan%C4%B1/id6760183583" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                  <img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/tr-tr?size=250x83&amp;releaseDate=1700000000" alt="App Store'dan İndirin" className="h-10 w-auto" />
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.tariften.app" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/tr_badge_web_generic.png" alt="Google Play'den Alın" className="h-14 w-auto -mt-2" />
                </a>
              </div>
            </div>

            <NewsletterForm source="tariften_footer" />
          </div>

          <div className="lg:col-span-8 border-t border-gray-100 pt-8 lg:border-t-0 lg:pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:gap-8">
              <a href="https://hipmedya.com" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center">
                <span className="font-black text-2xl text-slate-900 tracking-tighter hover:text-[#db4c3f] transition duration-300">hip<span className="text-[#db4c3f]">medya</span></span>
              </a>
              <div className="h-10 w-px bg-gray-200 hidden sm:block"></div>
              <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 font-medium">
                <li><a href="https://kidsgourmet.com.tr" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">kidsgourmet.com.tr</a></li>
                <li><a href="https://rejimde.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-emerald-600 transition">rejimde.com</a></li>
                <li><a href="https://hipinup.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">hipinup.com</a></li>
                <li><a href="https://piyasavizyon.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">piyasavizyon.com</a></li>
                <li><a href="https://direktspor.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#db4c3f] transition">direktspor.com</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            Copyright © {currentYear} Tariften bir <a href="https://hipmedya.com" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-500 hover:text-[#db4c3f] transition">Hip Medya</a> markasıdır. Tüm Hakları Saklıdır. İçerikler kaynak gösterilmeden paylaşılamaz.
          </p>
          <p className="text-xs text-slate-300 font-mono">v1.0.0</p>
        </div>
      </div>
    </footer>
  );
}
