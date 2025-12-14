"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext"; // Auth Context eklendi
import { FaArrowLeft, FaCheck, FaUser, FaLock, FaUtensils } from "react-icons/fa6";
import { useState, useEffect } from "react";

export default function ProfileEditPage() {
  const { user } = useAuth(); // Kullanıcı verisini çek
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
  });

  // Kullanıcı verisi yüklenince formu doldur
  useEffect(() => {
    if (user) {
      // WordPress JWT Auth eklentisi genellikle 'user_email' döner.
      // AuthContext yapımızda 'email' tanımlı olsa da, API'den gelen ham veriyi de (user_email) kontrol ediyoruz.
      const userEmail = user.email || (user as any).user_email || "";

      setFormData({
        fullname: user.user_display_name || user.user_nicename || "",
        email: userEmail,
      });
    }
  }, [user]);

  // Eğer kullanıcı henüz yüklenmediyse (Middleware koruyor ama çift dikiş)
  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#fcfcfc] py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-brand hover:border-brand transition">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 font-heading">Profil Ayarları</h1>
        </div>

        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); alert("Bilgiler güncellendi (Demo)"); }}>
          
          {/* Kişisel Bilgiler */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaUser className="text-brand" /> Kişisel Bilgiler
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    value={formData.fullname} 
                    onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">E-posta</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    disabled 
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mutfak Tercihleri */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaUtensils className="text-brand" /> Mutfak Tercihleri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Beslenme Tipi</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand">
                  <option>Hepçil</option>
                  <option>Vegan</option>
                  <option>Vejetaryen</option>
                  <option>Glutensiz</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Seviye</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand">
                  <option>Acemi</option>
                  <option>Orta Seviye</option>
                  <option>Usta Şef</option>
                </select>
              </div>
            </div>
          </div>

          {/* Şifre Değiştir */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaLock className="text-brand" /> Güvenlik
            </h3>
            <div className="space-y-4">
              <input type="password" placeholder="Mevcut Şifre" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
              <div className="grid grid-cols-2 gap-4">
                <input type="password" placeholder="Yeni Şifre" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
                <input type="password" placeholder="Yeni Şifre (Tekrar)" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="px-8 py-4 bg-brand text-white font-bold rounded-xl shadow-lg hover:bg-brand-dark transition flex items-center gap-2">
              <FaCheck /> Değişiklikleri Kaydet
            </button>
          </div>

        </form>

      </div>
    </main>
  );
}