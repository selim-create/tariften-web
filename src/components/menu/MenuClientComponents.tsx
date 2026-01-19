"use client";

import { useState } from "react";
import { Menu } from "@/types";
import { FaShareNodes, FaCheck, FaCartShopping, FaFire, FaXmark, FaCopy, FaClipboardList, FaPenToSquare } from "react-icons/fa6";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

// ---------------------------
// Success Modal (Şık Bildirim)
// ---------------------------
function SuccessModal({ message, onClose }: { message: string, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center transform transition-all scale-100 border border-gray-100">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-2xl">
                    <FaCheck />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Başarılı!</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <button 
                    onClick={onClose}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
                >
                    Tamam
                </button>
            </div>
        </div>
    );
}

// ---------------------------
// Header Actions (Paylaş / Düzenle)
// ---------------------------
export function MenuHeaderActions({ menu }: { menu: Menu }) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: menu.title,
          text: menu.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // DEBUG: Yetki kontrolü için konsola log basıyoruz
  // Eğer butonu göremiyorsanız tarayıcı konsolundan (F12) bu değerleri kontrol edin.
  // console.log("User ID:", user?.id, "Menu Author ID:", menu.author_id);

  // Yetki Kontrolü: String'e çevirerek karşılaştırıyoruz (Type safety)
  const canEdit = user && (String(user.id) === String(menu.author_id));

  return (
    <div className="flex items-center gap-3 font-sans shrink-0 print:hidden">
      
      {/* Sadece yetkili kullanıcı varsa Buton ve Çizgi görünür */}
      {canEdit && (
        <>
            <Link 
                href={`/menu/edit/${menu.slug}`}
                className="group w-12 h-12 rounded-full bg-[#db4c3f] border border-transparent flex items-center justify-center text-white hover:bg-red-600 hover:scale-105 transition shadow-lg relative"
                title="Menüyü Düzenle"
            >
                <FaPenToSquare />
                {/* Tooltip */}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                    Düzenle
                </span>
            </Link>
            
            {/* Ayırıcı Çizgi - Sadece edit butonu varsa görünür */}
            <div className="h-8 w-px bg-white/20 mx-1"></div>
        </>
      )}

      <button 
        onClick={handleShare} 
        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition relative" 
        title="Paylaş"
      >
        {copied ? <FaCheck /> : <FaShareNodes />}
      </button>
    </div>
  );
}

// ---------------------------
// Footer Actions (Alışveriş / Pilot)
// ---------------------------
export function MenuFooterActions({ menu }: { menu: Menu }) {
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showPilotSelection, setShowPilotSelection] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tüm malzemeleri topla ve birleştir
  const getIngredients = () => {
    const list: Record<string, {name: string, amount: number, unit: string}> = {};
    menu.sections.forEach(s => s.recipes.forEach(r => {
        if(r.ingredients) {
            r.ingredients.forEach(i => {
                const key = `${i.name}-${i.unit}`.toLowerCase();
                const amt = parseFloat(i.amount.toString()) || 0;
                
                if(list[key]) {
                    list[key].amount += amt;
                } else {
                    list[key] = { name: i.name, amount: amt, unit: i.unit };
                }
            });
        }
    }));
    return Object.values(list);
  };

  const shoppingList = getIngredients();

  const copyList = () => {
    const text = shoppingList.map(i => `- ${i.amount > 0 ? i.amount : ''} ${i.unit} ${i.name}`).join('\n');
    const header = `📋 *${menu.title} - Alışveriş Listesi*\n\n`;
    const footer = `\nBu liste Tariften.com tarafından oluşturulmuştur.`;
    
    navigator.clipboard.writeText(header + text + footer);
    
    setSuccessMessage("Liste panoya kopyalandı! Whatsapp veya Notlar uygulamasına yapıştırabilirsiniz.");
  };

  return (
    <>
      {successMessage && <SuccessModal message={successMessage} onClose={() => setSuccessMessage(null)} />}

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto print:hidden">
         <button 
            onClick={() => setShowShoppingList(true)}
            className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-slate-700 font-bold hover:bg-gray-50 transition w-full md:w-auto flex items-center justify-center gap-2"
         >
            <FaClipboardList className="text-gray-400"/> Alışveriş Listesi
         </button>
         <button 
            onClick={() => setShowPilotSelection(true)}
            className="px-8 py-3 rounded-xl bg-[#db4c3f] text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition flex items-center justify-center gap-2 w-full md:w-auto"
         >
            <FaFire /> Pişirmeye Başla
         </button>
      </div>

      {/* MODAL: Alışveriş Listesi */}
      {showShoppingList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowShoppingList(false)}>
            <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl transform transition-all scale-100">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-3xl">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FaCartShopping className="text-[#db4c3f]"/> Alışveriş Listesi
                    </h3>
                    <button onClick={() => setShowShoppingList(false)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 hover:text-slate-900 transition"><FaXmark/></button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                    {shoppingList.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400 mb-2">Malzeme bilgisi bulunamadı.</p>
                            <p className="text-xs text-gray-400">Tarifler henüz detaylandırılmamış olabilir.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {shoppingList.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-slate-700 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0 mt-0.5"></div>
                                    <div className="flex-grow text-sm">
                                        <span className="font-bold text-slate-900">{item.amount > 0 ? Number(item.amount.toFixed(2)) : ''} {item.unit}</span> <span className="text-slate-600">{item.name}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
                    <button onClick={copyList} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 hover:scale-[1.02] transition shadow-lg">
                        <FaCopy /> Listeyi Kopyala
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL: Pilot Seçimi */}
      {showPilotSelection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={(e) => e.target === e.currentTarget && setShowPilotSelection(false)}>
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-3xl">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FaFire className="text-[#db4c3f]"/> Pilot Modu
                    </h3>
                    <button onClick={() => setShowPilotSelection(false)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-300 hover:text-slate-900 transition"><FaXmark/></button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-500 mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
                        👨‍🍳 <strong>Şefin Tavsiyesi:</strong> Pişirmeye başlamak istediğiniz yemeği seçin. Asistan adım adım sizi yönlendirecek.
                    </p>
                    <div className="space-y-3">
                        {menu.sections.map((section, sIdx) => (
                            <div key={sIdx}>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{section.title}</h4>
                                <div className="space-y-2 mb-4">
                                    {section.recipes.map(recipe => (
                                        <Link 
                                            key={recipe.id} 
                                            href={`/pilot/${recipe.slug}`} 
                                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-orange-50 border border-gray-100 hover:border-orange-200 transition group"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0 shadow-sm">
                                                {isPlaceholderImage(recipe.image) ? (
                                                  <ImagePlaceholder title={recipe.title} variant="card" />
                                                ) : (
                                                  // eslint-disable-next-line @next/next/no-img-element
                                                  <img src={recipe.image} className="w-full h-full object-cover" alt="" />
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-slate-900 group-hover:text-[#db4c3f] transition line-clamp-1">{recipe.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span>⏱️ {recipe.prep_time} dk</span>
                                                    <span>🔥 {recipe.calories} kcal</span>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-[#db4c3f] group-hover:border-orange-200 transition shadow-sm">
                                                <FaFire className="text-sm" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
}