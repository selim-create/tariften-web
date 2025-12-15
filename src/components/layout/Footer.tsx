import Link from "next/link";
import Image from "next/image";
import { FaInstagram, FaTwitter, FaYoutube, FaTiktok } from "react-icons/fa6";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Marka */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/logo.svg" alt="Tariften" width={150} height={50} className="h-auto" />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Yapay zeka destekli mutfak asistanınız ile dolabınızdaki malzemeleri değerlendirin, israfı önleyin.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaInstagram />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaTwitter />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaYoutube />
              </a>
              <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-slate-600 hover:bg-[#db4c3f] hover:text-white transition">
                <FaTiktok />
              </a>
            </div>
          </div>

          {/* Linkler */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Keşfet</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/recipes" className="hover:text-[#db4c3f] transition">Tarifler</Link></li>
              <li><Link href="/pantry" className="hover:text-[#db4c3f] transition">Dolap Asistanı</Link></li>
              <li><Link href="/cookbook" className="hover:text-[#db4c3f] transition">Tarif Defterim</Link></li>
              <li><Link href="/blog" className="hover:text-[#db4c3f] transition">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Kurumsal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/about" className="hover:text-[#db4c3f] transition">Hakkımızda</Link></li>
              <li><Link href="/contact" className="hover:text-[#db4c3f] transition">İletişim & Reklam</Link></li>
              <li><Link href="/terms" className="hover:text-[#db4c3f] transition">Kullanım Koşulları</Link></li>
              <li><Link href="/privacy" className="hover:text-[#db4c3f] transition">Gizlilik Politikası</Link></li>
            </ul>
          </div>

          {/* Bülten (Opsiyonel) */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Bülten</h4>
            <p className="text-xs text-slate-500 mb-3">Haftalık en popüler tarifler e-postana gelsin.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="E-posta adresin" 
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-[#db4c3f]"
              />
              <button className="bg-[#db4c3f] text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-[#c2410c] transition">
                Kayıt
              </button>
            </form>
          </div>

        </div>

        <div className="border-t border-gray-100 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            Copyright © {currentYear} Tariften bir <a href="https://hipmedya.com" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-[#db4c3f] transition">Hip Medya</a> markasıdır. Tüm Hakları Saklıdır. İçerikler kaynak gösterilmeden paylaşılamaz.
          </p>
          <p className="text-xs text-slate-300 font-mono">
            v1.0.0
          </p>
        </div>

      </div>
    </footer>
  );
}