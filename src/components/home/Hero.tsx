"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSearch } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";

const PLACEHOLDERS = [
  "Dolapta sadece yumurta ve yoğurt var...",
  "Akşama misafir var, havalı bir şey lazım...",
  "15 dakikada hazırlayabileceğim fit bir tarif...",
  "Canım tatlı çekiyor ama diyetteyim...",
  "İtalyan mutfağından makarna harici ne var?"
];

export default function Hero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  
  // Typewriter State
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const currentFullText = PLACEHOLDERS[placeholderIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        setDisplayText(currentFullText.substring(0, displayText.length + 1));
        setTypingSpeed(50);
        if (displayText === currentFullText) {
          setIsDeleting(true);
          setTypingSpeed(2000);
        }
      } else {
        setDisplayText(currentFullText.substring(0, displayText.length - 1));
        setTypingSpeed(30);
        if (displayText === "") {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, placeholderIndex, typingSpeed]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      router.push(`/recipes?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePillClick = (tag: string) => {
    router.push(`/recipes?q=${encodeURIComponent(tag)}`);
  }

  return (
    <section className="relative flex flex-col items-center justify-center px-4 py-24 overflow-hidden">
      
      {/* Arkaplan Efektleri */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#db4c3f]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-3xl text-center space-y-8 relative z-10">
        
        {/* Başlık */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider mb-2 animate-fade-in-up">
            <FaWandMagicSparkles /> Yapay Zeka Mutfak Asistanı
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight font-heading leading-tight">
            Bugün ne <span className="text-brand">pişiriyoruz?</span>
          </h1>
          <p className="text-gray-500 text-lg md:text-xl font-light max-w-xl mx-auto">
            Malzemeleri yaz, gerisini yapay zekaya bırak.
          </p>
        </div>

        {/* SİHİRLİ ARAMA KUTUSU */}
        <form onSubmit={handleSearch} className="relative group w-full mx-auto transform transition-all duration-300 hover:scale-[1.01]">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#db4c3f] to-orange-400 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          
          <div className="relative bg-white rounded-2xl flex items-center shadow-xl">
            <div className="pl-6 text-[#db4c3f] text-xl animate-pulse">
              <FaWandMagicSparkles />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={displayText + "|"} 
              className="w-full py-5 px-4 bg-transparent text-lg text-slate-800 placeholder-gray-400 focus:outline-none font-medium"
            />
            <button type="submit" className="m-2 bg-[#db4c3f] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#b03d32] transition flex items-center gap-2 shadow-lg shadow-[#db4c3f]/20">
              Oluştur
            </button>
          </div>
        </form>

        {/* AKILLI HAPLAR */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: "🥑", text: "Elimde avokado var" },
            { icon: "⏱️", text: "15 dakikada akşam yemeği" },
            { icon: "💪", text: "Spor sonrası protein" },
            { icon: "🌱", text: "Vegan ve glutensiz" }
          ].map((pill, idx) => (
            <button 
              key={idx} 
              onClick={() => handlePillClick(pill.text)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-[#db4c3f] hover:text-[#db4c3f] hover:bg-orange-50 transition shadow-sm"
            >
              <span>{pill.icon}</span> {pill.text}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}