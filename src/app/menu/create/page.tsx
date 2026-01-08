"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { generateAIMenu } from "@/lib/api";
import { FaWandMagicSparkles, FaArrowRight, FaArrowLeft, FaCheck, FaUtensils, FaUserGroup, FaChampagneGlasses } from "react-icons/fa6";

export default function CreateMenuPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Concept, 2: Details, 3: Review
  
  const [formData, setFormData] = useState({
    concept: "",
    guest_count: 4,
    event_type: "Akşam Yemeği",
    diet: "Normal",
    cuisine: "Türk"
  });

  const handleSubmit = async () => {
    if (!user || !user.token) {
        // Basit bir login yönlendirmesi yerine daha şık bir uyarı yapılabilir
        alert("Giriş yapmalısınız."); 
        router.push("/login");
        return;
    }
    setLoading(true);
    try {
      const res = await generateAIMenu(user.token, formData);
      if (res.success && res.slug) {
        router.push(`/menu/${res.slug}`);
      } else {
        alert(res.message);
        setLoading(false);
      }
    } catch (error) {
      alert("Hata oluştu.");
      setLoading(false);
    }
  };

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  if (loading) {
      return (
          <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 relative mb-8">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#db4c3f] rounded-full border-t-transparent animate-spin"></div>
                  <FaWandMagicSparkles className="absolute inset-0 m-auto text-2xl text-[#db4c3f] animate-pulse"/>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2 font-heading">Sihir Yapılıyor...</h2>
              <p className="text-gray-500 max-w-md">
                  "{formData.concept}" konseptine uygun, {formData.guest_count} kişilik özel menünüz ve tarifleriniz hazırlanıyor.
              </p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col pt-24 pb-12">
      
      {/* Progress */}
      <div className="container mx-auto max-w-3xl px-6 mb-12">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              <span className={step >= 1 ? "text-[#db4c3f]" : ""}>01 Konsept</span>
              <span className={step >= 2 ? "text-[#db4c3f]" : ""}>02 Detaylar</span>
              <span className={step >= 3 ? "text-[#db4c3f]" : ""}>03 Onay</span>
          </div>
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#db4c3f] transition-all duration-500 ease-out" 
                style={{ width: `${(step/3)*100}%` }}
              ></div>
          </div>
      </div>

      <div className="container mx-auto max-w-3xl px-6 flex-grow flex flex-col justify-center">
        
        {/* STEP 1: CONCEPT */}
        {step === 1 && (
            <div className="animate-fade-in-up">
                <h1 className="text-4xl md:text-5xl font-bold font-heading text-slate-900 mb-6">
                    Bugün neyi kutluyoruz?
                </h1>
                <p className="text-xl text-gray-500 mb-10">
                    Özel bir davet, romantik bir akşam yemeği veya sadece kendinizi şımartacağınız bir pazar kahvaltısı...
                </p>
                <div className="relative">
                    <input 
                        type="text" 
                        autoFocus
                        value={formData.concept}
                        onChange={(e) => setFormData({...formData, concept: e.target.value})}
                        placeholder="Örn: Yılbaşı, Vegan Brunch, İtalyan Gecesi..."
                        className="w-full text-3xl md:text-4xl font-bold bg-transparent border-b-2 border-gray-200 py-4 focus:border-[#db4c3f] outline-none placeholder:text-gray-300 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && formData.concept && next()}
                    />
                </div>
                
                <div className="mt-12 flex justify-end">
                    <button 
                        onClick={next} 
                        disabled={!formData.concept}
                        className="group flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Devam Et 
                        <FaArrowRight className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>
        )}

        {/* STEP 2: DETAILS */}
        {step === 2 && (
            <div className="animate-fade-in-up">
                <h1 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 mb-8">
                    Biraz detay verelim.
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Kişi Sayısı */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            <FaUserGroup /> Kişi Sayısı
                        </label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" min="1" max="20" 
                                value={formData.guest_count}
                                onChange={(e) => setFormData({...formData, guest_count: parseInt(e.target.value)})}
                                className="flex-grow h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#db4c3f]"
                            />
                            <div className="w-12 h-12 flex items-center justify-center bg-[#fff5f5] text-[#db4c3f] font-bold text-xl rounded-xl">
                                {formData.guest_count}
                            </div>
                        </div>
                    </div>

                    {/* Etkinlik Türü */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            <FaUtensils /> Öğün Tipi
                        </label>
                        <select 
                            value={formData.event_type}
                            onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-slate-800 focus:ring-2 focus:ring-[#db4c3f]"
                        >
                            <option>Kahvaltı</option>
                            <option>Öğle Yemeği</option>
                            <option>Beş Çayı</option>
                            <option>Akşam Yemeği</option>
                            <option>Kokteyl</option>
                        </select>
                    </div>

                     {/* Diyet */}
                     <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition md:col-span-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                            <FaUtensils /> Diyet Tercihi
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {["Normal", "Vejetaryen", "Vegan", "Glutensiz", "Düşük Karb"].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => setFormData({...formData, diet: opt})}
                                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition border ${formData.diet === opt ? 'bg-[#db4c3f] text-white border-[#db4c3f]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                    <button onClick={back} className="text-gray-400 font-bold hover:text-slate-900 transition flex items-center gap-2">
                        <FaArrowLeft /> Geri
                    </button>
                    <button 
                        onClick={next}
                        className="group flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-800 transition"
                    >
                        Son Adım 
                        <FaArrowRight className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 3 && (
            <div className="animate-fade-in-up text-center max-w-xl mx-auto">
                 <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                     <FaChampagneGlasses />
                 </div>
                 <h1 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 mb-4">
                    Her şey harika görünüyor!
                 </h1>
                 <p className="text-gray-500 mb-8">
                     Yapay zeka şefimiz şimdi <strong>{formData.concept}</strong> konseptinde, <strong>{formData.guest_count} kişilik</strong> muazzam bir menü planlayacak.
                 </p>

                 <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm mb-8 text-left">
                     <div className="flex justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-400">Konsept</span>
                         <span className="font-bold text-slate-800">{formData.concept}</span>
                     </div>
                     <div className="flex justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-400">Kişi</span>
                         <span className="font-bold text-slate-800">{formData.guest_count}</span>
                     </div>
                     <div className="flex justify-between py-2 border-b border-gray-50">
                         <span className="text-gray-400">Öğün</span>
                         <span className="font-bold text-slate-800">{formData.event_type}</span>
                     </div>
                     <div className="flex justify-between py-2">
                         <span className="text-gray-400">Tercih</span>
                         <span className="font-bold text-slate-800">{formData.diet}</span>
                     </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <button 
                        onClick={handleSubmit}
                        className="w-full bg-[#db4c3f] text-white py-4 rounded-full text-lg font-bold shadow-xl shadow-red-500/30 hover:bg-red-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        <FaWandMagicSparkles /> Menüyü Oluştur
                    </button>
                    <button onClick={back} className="text-gray-400 font-bold hover:text-slate-900 transition">
                        Düzenle
                    </button>
                 </div>
            </div>
        )}

      </div>
    </div>
  );
}