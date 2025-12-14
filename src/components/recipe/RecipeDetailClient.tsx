"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  FaCheck, FaLightbulb, FaThumbsUp, FaXmark, FaClock
} from "react-icons/fa6";
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toggleInteraction } from "@/lib/api";

export default function RecipeDetailClient({ recipe }: { recipe: Recipe }) {
  const { user } = useAuth();
  
  // --- STATE ---
  const [servings, setServings] = useState(parseInt(recipe.servings) || 2);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [cookedCount, setCookedCount] = useState(100 + (recipe.id * 163) % 3900);
  const [isCooked, setIsCooked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- BESİN DEĞERLERİ (TAHMİNİ HESAPLAMA) ---
  const calories = parseInt(recipe.calories) || 450;
  const macros = {
    protein: Math.round(calories * 0.25 / 4) + "g", // %25 Protein
    carbs: Math.round(calories * 0.45 / 4) + "g",   // %45 Karb
    fat: Math.round(calories * 0.30 / 9) + "g"      // %30 Yağ
  };

  // --- ADIMLARI HAZIRLA ---
  let steps: string[] = [];
  if (recipe.steps && recipe.steps.length > 0) {
    steps = recipe.steps;
  } else if (recipe.content) {
    steps = recipe.content
      .replace(/<[^>]*>/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5);
  }

  // --- MALZEMELERİ HAZIRLA ---
  // Eğer API'den malzeme gelmezse demo göster (Fallback)
  const DEMO_INGREDIENTS = [
    { name: "Tavuk Göğsü", amount: "500", unit: "gr" },
    { name: "Mantar", amount: "400", unit: "gr" },
  ];
  const ingredients = (recipe.ingredients && recipe.ingredients.length > 0) 
    ? recipe.ingredients 
    : DEMO_INGREDIENTS;

  const handleServings = (delta: number) => {
    const newValue = servings + delta;
    if (newValue > 0 && newValue <= 20) setServings(newValue);
  };

  const toggleIngredient = (index: number) => {
    if (checkedIngredients.includes(index)) {
      setCheckedIngredients(prev => prev.filter(i => i !== index));
    } else {
      setCheckedIngredients(prev => [...prev, index]);
    }
  };

  const toggleStep = (index: number) => {
    if (completedSteps.includes(index)) {
      setCompletedSteps(prev => prev.filter(i => i !== index));
    } else {
      setCompletedSteps(prev => [...prev, index]);
    }
  };

  const handleCooked = async () => {
    if (!user) return alert("Lütfen giriş yapın.");
    if (isCooked) return;

    setIsCooked(true);
    setCookedCount(prev => prev + 1);
    setShowSuccessModal(true);

    await toggleInteraction(user.token, recipe.id, 'cooked');
  };

  const baseServings = parseInt(recipe.servings) || 2;

  return (
    <div className="w-full">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
        {/* SOL KOLON: Malzemeler */}
        <div className="lg:col-span-4">
          
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm sticky top-24 z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 font-heading">Malzemeler</h3>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button onClick={() => handleServings(-1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-brand font-bold">-</button>
                <span className="w-8 text-center font-bold text-sm">{servings}</span>
                <button onClick={() => handleServings(1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-brand font-bold">+</button>
              </div>
            </div>

            <ul className="space-y-3">
              {ingredients.map((item, idx) => {
                let displayAmount = item.amount;
                const numericAmount = parseFloat(item.amount);

                if (!isNaN(numericAmount)) {
                  const scaled = (numericAmount / baseServings) * servings;
                  displayAmount = Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
                }

                const isChecked = checkedIngredients.includes(idx);

                return (
                  <li 
                    key={idx} 
                    onClick={() => toggleIngredient(idx)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isChecked ? 'bg-green-50 border-green-100 opacity-60' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isChecked ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                      {isChecked && <FaCheck className="text-[10px]" />}
                    </div>
                    <span className={`flex-1 text-sm font-medium ${isChecked ? 'line-through text-gray-400' : 'text-slate-700'}`}>
                      <strong className="text-brand">{displayAmount} {item.unit}</strong> {item.name}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3 text-yellow-800 text-sm">
              <FaLightbulb className="text-yellow-500 text-lg flex-shrink-0 mt-0.5" />
              <p><strong>Şefin İpucu:</strong> Malzemeleri oda sıcaklığında kullanmak lezzeti artırır.</p>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: Hazırlanış */}
        <div className="lg:col-span-8 space-y-10">
          
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 font-heading">Adım Adım Hazırlanış</h2>
            <div className="text-sm text-gray-500 font-medium">{steps.length} Adım</div>
          </div>

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const isCompleted = completedSteps.includes(idx);
              return (
                <div 
                  key={idx} 
                  onClick={() => toggleStep(idx)}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group 
                    ${isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-brand/30'}`}
                >
                  <div className="flex gap-5">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors 
                      ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand group-hover:text-white'}`}>
                      {isCompleted ? <FaCheck /> : idx + 1}
                    </div>
                    <p className={`text-lg leading-relaxed ${isCompleted ? 'text-gray-400 line-through' : 'text-slate-700'}`}>
                      {step}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Besin Değerleri (Aşağıda) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 font-heading">1 Porsiyon İçin Besin Değerleri</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Protein</span><span className="font-bold text-slate-700">{macros.protein}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[25%]"></div></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Karbonhidrat</span><span className="font-bold text-slate-700">{macros.carbs}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-orange-400 w-[45%]"></div></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Yağ</span><span className="font-bold text-slate-700">{macros.fat}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-400 w-[30%]"></div></div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Değerler yaklaşık olarak hesaplanmıştır.</p>
          </div>

          {/* Sosyal Kanıt & Pişirdim */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold font-heading mb-1">Bu tarifi denedin mi?</h3>
              <p className="text-slate-400">Şu ana kadar <strong className="text-brand">{cookedCount.toLocaleString()}</strong> kişi bu tarifi pişirdi.</p>
            </div>

            <button 
              onClick={handleCooked}
              disabled={isCooked}
              className={`relative z-10 px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition transform active:scale-95 shadow-lg
                ${isCooked ? 'bg-green-500 text-white cursor-default' : 'bg-white text-slate-900 hover:bg-brand hover:text-white'}`}
            >
              {isCooked ? <><FaCheck /> Listene Eklendi</> : <><FaThumbsUp /> Ben de Pişirdim</>}
            </button>
          </div>

          {/* Benzer Tarifler (Espirili Başlık ile Geri Döndü) */}
          <div className="pt-12 border-t border-gray-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6 font-heading">
              Bunu Sevenler Şunlara da Düştü 😍
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-lg transition cursor-pointer group">
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-4xl">🍝</div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 group-hover:text-brand transition">Körili Tavuk</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">Aynı malzemelerle yapabileceğin, baharatlı bir alternatif.</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-600">
                    <FaClock className="text-brand" /> 30dk
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-lg transition cursor-pointer group">
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center text-4xl">🥘</div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-slate-800 group-hover:text-brand transition">Mantar Sote</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">Et yemek istemezsen, mantarın en lezzetli hali.</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-600">
                    <FaClock className="text-brand" /> 20dk
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all scale-100 text-center relative">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <FaXmark className="text-xl" />
            </button>

            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce-in">
              <FaCheck />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-heading">Ellerine Sağlık Şefim! 👨‍🍳</h3>
            <p className="text-gray-500 mb-8">
              Harika bir iş çıkardın. Bu tarif pişirdiklerim listesine eklendi.
            </p>
            
            <button onClick={() => setShowSuccessModal(false)} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark transition shadow-lg shadow-brand/20">
              Tamamdır
            </button>
          </div>
        </div>
      )}

    </div>
  );
}