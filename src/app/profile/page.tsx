"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // Auth Context
import { FaUser, FaPen, FaFire, FaBasketShopping, FaBookOpen, FaChevronRight, FaLeaf, FaUtensils, FaArrowRightFromBracket } from "react-icons/fa6";

export default function ProfilePage() {
  const { user, logout } = useAuth(); // Kullanıcı verisi ve çıkış fonksiyonu

  // Eğer kullanıcı henüz yüklenmediyse veya yoksa (Middleware koruyor ama yine de)
  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#fcfcfc] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        
        {/* ÜST BİLGİ KARTI */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8 mb-8 relative overflow-hidden">
          {/* Dekoratif Arkaplan */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-brand/10 flex items-center justify-center text-brand text-4xl border-4 border-white shadow-lg uppercase font-bold">
              {/* Baş harfi göster veya ikon */}
              {user.user_display_name?.[0] || user.user_nicename?.[0] || <FaUser />}
            </div>
            <Link href="/profile/edit" className="absolute bottom-0 right-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs hover:scale-110 transition shadow-md">
              <FaPen />
            </Link>
          </div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading mb-1">
              {user.user_display_name || user.user_nicename}
            </h1>
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mb-4">
              <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">Acemi Şef</span>
              <span>•</span>
              <span>{user.email}</span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <FaLeaf className="text-green-500" /> Hepçil
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                <FaUtensils className="text-orange-500" /> Başlangıç
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
             <button className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 bg-brand text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition shadow-lg shadow-brand/20">
               Premium'a Geç 👑
             </button>
             <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2 text-gray-400 hover:text-red-500 text-sm font-medium transition"
             >
               <FaArrowRightFromBracket /> Çıkış Yap
             </button>
          </div>
        </div>

        {/* İSTATİSTİKLER (Şimdilik Statik) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
              <FaFire />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">0</div>
              <div className="text-xs text-gray-500">Tarif Pişirildi</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              <FaBookOpen />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">0</div>
              <div className="text-xs text-gray-500">Tarif Kaydedildi</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              <FaBasketShopping />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">0</div>
              <div className="text-xs text-gray-500">Malzeme Kurtarıldı</div>
            </div>
          </div>
        </div>

        {/* MENÜLER & KISAYOLLAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Hızlı Menü */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-900 mb-4 font-heading">Kısayollar</h3>
            <div className="space-y-2">
              <Link href="/cookbook" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-xl transition group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><FaBookOpen className="text-xs" /></span>
                  <span className="font-medium text-slate-700">Tarif Defterim</span>
                </div>
                <FaChevronRight className="text-gray-300 group-hover:text-brand" />
              </Link>
              <Link href="/pantry" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-xl transition group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><FaBasketShopping className="text-xs" /></span>
                  <span className="font-medium text-slate-700">Dolap Yönetimi</span>
                </div>
                <FaChevronRight className="text-gray-300 group-hover:text-brand" />
              </Link>
              <Link href="/profile/edit" className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-xl transition group">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center"><FaUser className="text-xs" /></span>
                  <span className="font-medium text-slate-700">Profil Ayarları</span>
                </div>
                <FaChevronRight className="text-gray-300 group-hover:text-brand" />
              </Link>
            </div>
          </div>

          {/* Son Aktiviteler (Boş Durum) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-3">🍳</div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-heading">Henüz Pişirmedin</h3>
            <p className="text-sm text-gray-500 mb-4">İlk tarifini denemek için sabırsızlanıyoruz!</p>
            <Link href="/" className="text-brand font-bold text-sm hover:underline">Tarif Keşfet</Link>
          </div>

        </div>

      </div>
    </main>
  );
}