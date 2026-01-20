"use client";

import { useState, useEffect } from 'react';
import RejimdeIcon from './icons/RejimdeIcon';

interface Props {
  recipeId: number;
}

interface DietInfo {
  source: string;
  diet_id: number;
  diet_title: string;
  diet_url: string;
  diet_slug: string;
  diet_status: 'active' | 'deleted';
}

export default function RejindeBanner({ recipeId }: Props) {
  const [dietInfo, setDietInfo] = useState<DietInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    async function fetchDietInfo() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.tariften.com/wp-json';
        const res = await fetch(`${apiUrl}/tariften/v1/recipes/${recipeId}/source`, {
          cache: 'no-store'
        });
        
        if (!res.ok) {
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        
        // Sadece rejimde kaynaklı ve aktif diyetleri göster
        if (data.source === 'rejimde' && data.diet_url && data.diet_status !== 'deleted') {
          // URL'in hala geçerli olduğunu kontrol et (opsiyonel)
          setDietInfo(data);
        }
      } catch (e) {
        console.error('Diyet bilgisi alınamadı:', e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDietInfo();
  }, [recipeId]);

  if (loading || !dietInfo || !isVisible) return null;

  return (
    <div className="relative mb-6 animate-in slide-in-from-top-4 duration-500">
      {/* Kapatma butonu */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-gray-600 transition z-10"
        aria-label="Kapat"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <a 
        href={dietInfo.diet_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-5 text-white hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
      >
        {/* Dekoratif arka plan */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative flex items-center gap-4">
          {/* Rejimde Logo */}
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shrink-0 group-hover:scale-110 transition-transform">
            <RejimdeIcon className="w-8 h-8" />
          </div>
          
          {/* İçerik */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white/70 uppercase tracking-wide mb-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd"/>
              </svg>
              Bu tarif şu diyetin parçası
            </p>
            <p className="font-black text-lg leading-tight truncate group-hover:text-white/90 transition">
              {dietInfo.diet_title}
            </p>
            <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
              <span>rejimde.com</span>
              <span>•</span>
              <span>Diyet planını görüntüle</span>
            </p>
          </div>
          
          {/* Ok ikonu */}
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 group-hover:bg-white/30 group-hover:translate-x-1 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </a>
    </div>
  );
}
