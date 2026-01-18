"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FaArrowRight, FaRobot, FaBookOpen, FaBasketShopping, FaFireBurner, FaUtensils } from "react-icons/fa6";

// Ziyaretçiler için Rastgele Gösterilecek Bannerlar
const GUEST_BANNERS = [
  {
    title: "Kendi Tarif Defterini Oluştur",
    desc: "Beğendiğin tarifleri kaydet, dolabındaki malzemeleri yönet ve sana özel haftalık planlar oluştur.",
    button: "Hemen Kayıt Ol",
    icon: <FaBookOpen className="text-4xl text-white/50 mb-4" />,
    color: "bg-slate-900",
    accent: "bg-[#db4c3f]"
  },
  {
    title: "Dolap Asistanı ile İsrafı Önle",
    desc: "Evde ne varsa onu pişir! Malzemelerini gir, yapay zeka sana uygun tarifleri anında bulsun.",
    button: "Dolabını Yönet",
    icon: <FaBasketShopping className="text-4xl text-white/50 mb-4" />,
    color: "bg-blue-900",
    accent: "bg-blue-500"
  },
  {
    title: "Yapay Zeka Mutfak Şefi",
    desc: "Ne pişireceğine karar veremiyor musun? AI Şef'e danış, saniyeler içinde sana özel reçete hazırlasın.",
    button: "Şimdi Dene",
    icon: <FaRobot className="text-4xl text-white/50 mb-4" />,
    color: "bg-purple-900",
    accent: "bg-purple-500"
  }
];

export default function HomeCTA() {
  const { user } = useAuth();
  
  // Rastgele Banner Seçimi için State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    // Sayfa her yüklendiğinde rastgele bir index seç
    setCurrentBannerIndex(Math.floor(Math.random() * GUEST_BANNERS.length));
  }, []);

  const banner = GUEST_BANNERS[currentBannerIndex];

  // DURUM 1: GİRİŞ YAPMIŞ KULLANICI İÇİN
  if (user) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden text-center md:text-left">
            {/* Arkaplan Efekti */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#db4c3f] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl">
                <span className="inline-block py-1 px-3 rounded-full bg-[#db4c3f]/20 text-[#db4c3f] text-xs font-bold uppercase tracking-wider mb-4 border border-[#db4c3f]/20">
                  Hoşgeldin Şef {user.user_display_name?.split(' ')[0]} 👋
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white font-heading mb-4 leading-tight">
                  Mutfağını Yönetmeye Nereden Başlamak İstersin?
                </h2>
                <p className="text-slate-400 text-lg">
                  Senin için hazırladığımız araçlarla zaman kazan ve harika lezzetler yarat.
                </p>
              </div>

              {/* Kısayol Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                <Link href="/pantry" className="bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl flex items-center gap-4 transition group">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
                    <FaBasketShopping />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm">Dolap Asistanı</h4>
                    <p className="text-xs text-slate-400">Malzemelerini yönet</p>
                  </div>
                </Link>

                <Link href="/recipe/create" className="bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl flex items-center gap-4 transition group">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
                    <FaFireBurner />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm">Tarif Oluştur</h4>
                    <p className="text-xs text-slate-400">Kendi tarifini yaz</p>
                  </div>
                </Link>

                <Link href="/cookbook" className="bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl flex items-center gap-4 transition group">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl group-hover:scale-110 transition">
                    <FaBookOpen />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm">Tarif Defterim</h4>
                    <p className="text-xs text-slate-400">Favorilerin burada</p>
                  </div>
                </Link>

                <Link href="/recipes" className="bg-[#db4c3f] hover:bg-[#b03d32] border border-[#db4c3f] p-5 rounded-2xl flex items-center gap-4 transition group shadow-lg shadow-[#db4c3f]/20">
                  <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center text-xl group-hover:animate-pulse">
                    <FaRobot />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm">AI Şef</h4>
                    <p className="text-xs text-white/80">Sana özel öneri</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // DURUM 2: MİSAFİR KULLANICI İÇİN (RASTGELE BANNER)
  return (
    <section className="py-20 px-4">
      <div className={`container mx-auto max-w-5xl ${banner.color} rounded-[2.5rem] p-8 md:p-16 text-center relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className={`absolute top-0 right-0 w-64 h-64 ${banner.accent} rounded-full blur-[100px] opacity-30`}></div>
        
        <div className="relative z-10 flex flex-col items-center">
          {banner.icon}
          <h2 className="text-3xl md:text-5xl font-bold text-white font-heading mb-6">
            {banner.title}
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
            {banner.desc}
          </p>
          <Link href="/register" className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition shadow-xl hover:scale-105 transform duration-200">
            {banner.button} <FaArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}