import { FaInstagram, FaTwitter, FaYoutube, FaTiktok } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">
        
        {/* LOGO */}
        <div className="mb-6">
          <Link href="/">
            <Image 
              src="/logo.svg" 
              alt="Tariften Logo" 
              width={160} 
              height={48} 
              className="h-12 w-auto object-contain opacity-90 hover:opacity-100 transition"
            />
          </Link>
        </div>
        
        <p className="text-gray-500 text-sm max-w-md mb-8 font-light">
          Yapay zeka destekli mutfak asistanınız. Dolabınızdaki malzemelerle harikalar yaratın, israfı önleyin.
        </p>
        
        {/* Sosyal Medya İkonları */}
        <div className="flex space-x-6 text-gray-400 mb-8">
          <a href="https://instagram.com" target="_blank" className="hover:text-brand transition text-2xl"><FaInstagram /></a>
          <a href="https://twitter.com" target="_blank" className="hover:text-brand transition text-2xl"><FaTwitter /></a>
          <a href="https://youtube.com" target="_blank" className="hover:text-brand transition text-2xl"><FaYoutube /></a>
          <a href="https://tiktok.com" target="_blank" className="hover:text-brand transition text-xl"><FaTiktok /></a>
        </div>

        {/* Linkler */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-500 font-medium mb-8">
          <Link href="/hakkimizda" className="hover:text-slate-900 transition">Hakkımızda</Link>
          <Link href="/iletisim" className="hover:text-slate-900 transition">İletişim & Reklam</Link>
          <Link href="/kullanim-kosullari" className="hover:text-slate-900 transition">Kullanım Koşulları</Link>
          <Link href="/gizlilik" className="hover:text-slate-900 transition">Gizlilik Politikası</Link>
        </div>

        <p className="text-xs text-gray-400 border-t border-gray-100 pt-8 w-full max-w-2xl">
          &copy; {new Date().getFullYear()} Tariften Teknoloji A.Ş. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}