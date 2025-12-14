import Link from "next/link";
import { FaFireBurner, FaArrowLeft, FaHouse } from "react-icons/fa6";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-4 text-center">
      
      {/* İkon */}
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
        <FaFireBurner className="text-5xl text-red-500" />
      </div>

      {/* Başlık */}
      <h1 className="text-4xl md:text-6xl font-bold text-slate-900 font-heading mb-4">
        Eyvah! Yemek Yandı.
      </h1>

      {/* Açıklama */}
      <p className="text-gray-500 text-lg max-w-md mb-10 leading-relaxed">
        Aradığın sayfa bu mutfakta bulunmuyor. Belki silindi, belki de hiç pişirilmedi.
      </p>

      {/* Aksiyonlar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/" 
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
        >
          <FaHouse className="text-sm" /> Anasayfaya Dön
        </Link>
        <Link 
          href="/recipes" 
          className="px-8 py-4 bg-white border border-gray-200 text-slate-700 font-bold rounded-xl hover:border-brand hover:text-brand transition flex items-center justify-center gap-2"
        >
          <FaArrowLeft className="text-sm" /> Tariflere Bak
        </Link>
      </div>

    </main>
  );
}