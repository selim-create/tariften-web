"use client";

import { useEffect, useState } from 'react';
import { X } from 'lucide-react'; // İkon kütüphanenize göre değiştirebilirsiniz

export default function AppBanner() {
  const [appLink, setAppLink] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Kullanıcının tarayıcı bilgisini (User Agent) alıyoruz
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Android algılama
    if (/android/i.test(userAgent)) {
      setAppLink('https://play.google.com/store/apps/details?id=com.tariften.app');
      setIsVisible(true);
    } 
    // iOS (iPhone, iPad, iPod) algılama
    else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setAppLink('https://apps.apple.com/my/app/tariften-mutfak-asistan%C4%B1/id6760183583');
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] sm:hidden">
      <div className="flex items-center gap-3">
        {/* Uygulama İkonu - Kendi ikon yolunuzu buraya ekleyin */}
        <img src="/tariften-icon.svg" alt="Tariften App" className="h-10 w-10 rounded-xl" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900">Tariften Mutfak Asistanı</span>
          <span className="text-xs text-gray-500">Uygulamada daha hızlı</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <a 
          href={appLink}
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white no-underline"
        >
          AÇ
        </a>
        <button onClick={() => setIsVisible(false)} className="p-1 text-gray-400">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}