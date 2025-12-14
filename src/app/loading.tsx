import { FaUtensils } from "react-icons/fa6";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      
      {/* Animasyonlu İkon */}
      <div className="relative mb-6">
        {/* Dönen Dış Halka */}
        <div className="w-16 h-16 border-4 border-gray-100 border-t-[#db4c3f] rounded-full animate-spin"></div>
        
        {/* Ortadaki Sabit İkon */}
        <div className="absolute inset-0 flex items-center justify-center text-[#db4c3f]">
          <FaUtensils className="text-lg animate-pulse" />
        </div>
      </div>

      {/* Metin */}
      <h3 className="text-lg font-bold text-slate-800 font-heading animate-pulse">
        Lezzetler Yükleniyor...
      </h3>
      <p className="text-xs text-gray-400 mt-2 font-medium">
        Mutfağı hazırlıyoruz
      </p>

    </div>
  );
}