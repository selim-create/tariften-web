import { Utensils } from 'lucide-react';

interface ImagePlaceholderProps {
  title?: string;
  variant?: 'card' | 'detail';
  className?: string;
}

export function ImagePlaceholder({ 
  title = "Lezzetli Tarif", 
  variant = 'card',
  className = '' 
}: ImagePlaceholderProps) {
  
  if (variant === 'detail') {
    // Tarif Detay Sayfası için büyük placeholder
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-gray-900 ${className}`}>
        {/* Arkaplan Deseni */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', 
            backgroundSize: '32px 32px' 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black opacity-90" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-orange-600 rounded-full blur-[100px] opacity-20" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-yellow-600 rounded-full blur-[100px] opacity-10" />

        {/* İçerik */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl border border-gray-700 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-sm">
            <Utensils className="text-orange-500 w-8 h-8 animate-pulse" />
          </div>
          
          <span className="text-orange-500 font-bold tracking-widest text-xs uppercase mb-2">
            Görsel Hazırlanıyor
          </span>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 max-w-xs leading-tight">
            {title}
          </h2>
          
          <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
            Bu lezzetli tarifin fotoğrafı fırında, pişmek üzere! Çok yakında burada olacak.
          </p>

          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center text-white font-bold text-xs">
              t
            </div>
            <span className="text-gray-500 font-medium text-sm">tariften.com</span>
          </div>
        </div>
      </div>
    );
  }

  // Tarif Listesi (Card) için küçük placeholder
  return (
    <div className={`w-full h-full bg-gray-50 flex flex-col items-center justify-center relative p-6 text-center group-hover:bg-orange-50/30 transition-colors ${className}`}>
      {/* Arka plan deseni */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
      />
      
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform duration-300">
        <Utensils className="text-orange-400 w-5 h-5" />
      </div>
      
      <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1 opacity-80">
        Görsel Hazırlanıyor
      </span>
      <span className="text-[10px] text-gray-400 max-w-[150px]">
        Bu lezzet fırında, yakında burada!
      </span>
    </div>
  );
}
