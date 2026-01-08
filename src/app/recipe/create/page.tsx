"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createRecipe, getTerms, uploadMedia } from "@/lib/api"; // uploadMedia eklendi
import { 
  FaArrowRight, FaArrowLeft, FaCheck, FaPlus, FaTrash, 
  FaClock, FaFire, FaImage, FaVideo, FaCloudArrowUp, FaLink, FaXmark, FaSpinner
} from "react-icons/fa6";

export default function CreateRecipePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false); // Medya yükleniyor mu?
  const [mediaType, setMediaType] = useState<'upload' | 'url' | 'video'>('upload');
  const [previewUrl, setPreviewUrl] = useState(""); // Görsel önizlemesi için

  // MODAL STATE
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'input'>('success');
  const [modalMessage, setModalMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputCallback, setInputCallback] = useState<(val: string) => void>(() => {});

  // FORM VERİLERİ
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    image: "" as string | number, // ID (number) veya URL (string) olabilir
    prep_time: "",
    cook_time: "",
    calories: "",
    servings: "",
    cuisine: [] as string[],
    meal_type: [] as string[],
    difficulty: [] as string[],
    diet: [] as string[],
    ingredients: [{ name: "", amount: "", unit: "" }],
    steps: [""],
    chef_tip: "",
    serving_weight: "",
  });

  const [options, setOptions] = useState({
    cuisine: [] as string[],
    meal_type: [] as string[],
    difficulty: [] as string[],
    diet: [] as string[]
  });

  useEffect(() => {
    async function fetchTerms() {
        const terms = await getTerms();
        if (terms) {
            setOptions({
                cuisine: terms.cuisine || ["Türk Mutfağı"],
                meal_type: terms.meal_type || ["Akşam Yemeği"],
                difficulty: terms.difficulty || ["Kolay"],
                diet: terms.diet || ["Vegan"]
            });
        }
    }
    fetchTerms();
  }, []);

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  // --- YENİ DOSYA YÜKLEME MANTIĞI ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !user.token) return; // user.token kontrolü eklendi

    // 1. Önizleme göster (Kullanıcı bekletilmez)
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMediaUploading(true);

    // 2. Sunucuya Yükle
    const formData = new FormData();
    formData.append("file", file);

    // user.token kesinlikle string olduğu için hata vermeyecek
    const mediaId = await uploadMedia(user.token, formData);
    
    if (mediaId) {
      handleInputChange("image", mediaId); // Başarılıysa ID kaydet
    } else {
      showError("Görsel yüklenemedi. Lütfen tekrar deneyin.");
      setPreviewUrl(""); // Önizlemeyi geri al
    }
    setMediaUploading(false);
  };

  const showSuccess = (msg: string) => { setModalMessage(msg); setModalType('success'); setShowModal(true); };
  const showError = (msg: string) => { setModalMessage(msg); setModalType('error'); setShowModal(true); };
  
  const showInput = (title: string, callback: (val: string) => void) => {
    setModalMessage(title);
    setModalType('input');
    setInputCallback(() => callback);
    setShowModal(true);
  };

  const handleCategoryChange = (category: keyof typeof options, value: string) => {
    if (value === "new") {
      showInput(`Yeni ${category} ekle:`, (newCat) => {
        if (!newCat.trim()) return;
        setOptions(prev => ({ ...prev, [category]: [...prev[category], newCat] }));
        handleInputChange(category, [newCat]);
      });
    } else {
      handleInputChange(category, [value]);
    }
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  };
  const addIngredient = () => setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, { name: "", amount: "", unit: "" }] }));
  const removeIngredient = (index: number) => setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
  
  const updateStep = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData(prev => ({ ...prev, steps: newSteps }));
  };
  const addStep = () => setFormData(prev => ({ ...prev, steps: [...prev.steps, ""] }));
  const removeStep = (index: number) => setFormData(prev => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }));

  const handleSubmit = async () => {
    if (!user || !user.token) return showError("Lütfen giriş yapın."); // Token kontrolü eklendi
    if (!formData.title.trim()) return showError("Lütfen bir tarif başlığı girin.");
    
    setLoading(true);
    try {
      const result = await createRecipe(user.token, formData);
      
      if (result.success) {
        showSuccess("Tarif başarıyla oluşturuldu! 🎉");
        
        // DÜZELTME: Slug ile yönlendirme
        const redirectTarget = result.slug || result.id;
        setTimeout(() => router.push(`/recipe/${redirectTarget}`), 2000);
        
      } else {
        showError(result.message || "Bir hata oluştu.");
      }
    } catch (error: any) {
      showError(error.message || "Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center text-gray-500 min-h-screen flex items-center justify-center">Bu sayfayı görmek için giriş yapmalısınız.</div>;

  return (
    <main className="min-h-screen bg-[#fcfcfc] py-10 px-4 relative">
      <div className="container mx-auto max-w-3xl">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 font-heading">Yeni Tarif Oluştur</h1>
          <p className="text-gray-500">Adım {step} / 3</p>
          <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-brand h-full transition-all duration-500" style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
           
           {step === 1 && (
             <div className="space-y-6 animate-fade-in">
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tarif Başlığı</label>
                    <input type="text" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-brand" placeholder="Örn: Avokado Tost" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Kısa Açıklama (Spot)</label>
                    <textarea value={formData.excerpt} onChange={(e) => handleInputChange("excerpt", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand h-24 resize-none" placeholder="Tarifiniz hakkında kısa ve iştah açıcı bir özet..." />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Şefin İpucu (Opsiyonel)</label>
                    <textarea value={formData.chef_tip} onChange={(e) => handleInputChange("chef_tip", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand h-20 resize-none" placeholder="Bu tarife özel bir ipucu... (Boş bırakılırsa otomatik oluşturulur)" />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Görsel / Video</label>
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => setMediaType('upload')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'upload' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaCloudArrowUp className="inline mr-1"/> Dosya</button>
                        <button onClick={() => setMediaType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'url' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaLink className="inline mr-1"/> URL</button>
                        <button onClick={() => setMediaType('video')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'video' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaVideo className="inline mr-1"/> Video</button>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand/50 transition bg-gray-50 relative overflow-hidden">
                        {(previewUrl || formData.image) ? (
                            <div className="relative h-48 w-full group">
                                <img src={previewUrl || (formData.image as string)} alt="Preview" className="h-full w-full object-contain rounded-lg" />
                                <button onClick={() => { handleInputChange("image", ""); setPreviewUrl(""); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"><FaTrash /></button>
                                {mediaUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold rounded-lg">Yükleniyor...</div>}
                            </div>
                        ) : (
                            <>
                                {mediaType === 'upload' && (
                                    <div className="flex flex-col items-center py-4 cursor-pointer relative">
                                        <FaCloudArrowUp className="text-4xl text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-500">Görseli buraya sürükleyin veya tıklayın</p>
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                )}
                                {mediaType === 'url' && (
                                    <input type="text" onChange={(e) => { handleInputChange("image", e.target.value); setPreviewUrl(e.target.value); }} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand" placeholder="https://ornek.com/resim.jpg" />
                                )}
                                {mediaType === 'video' && (
                                    <input 
                                        type="text" 
                                        onChange={(e) => {
                                           let url = e.target.value;
                                           if(url.includes("youtube.com") || url.includes("youtu.be")) {
                                              handleInputChange("image", url); // Video URL'sini kaydet
                                              // Önizleme için thumbnail
                                              let videoId = "";
                                              if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
                                              else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
                                              setPreviewUrl(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
                                           }
                                        }} 
                                        className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand" 
                                        placeholder="Youtube linki..." 
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Hazırlama (dk)</label><input type="number" value={formData.prep_time} onChange={(e) => handleInputChange("prep_time", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Pişirme (dk)</label><input type="number" value={formData.cook_time} onChange={(e) => handleInputChange("cook_time", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Kalori</label><input type="number" value={formData.calories} onChange={(e) => handleInputChange("calories", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Porsiyon</label><input type="number" value={formData.servings} onChange={(e) => handleInputChange("servings", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(options).map((catKey) => (
                        <div key={catKey}>
                            <label className="block text-xs font-bold text-gray-500 mb-1 capitalize">{catKey.replace('_', ' ')}</label>
                            <select 
                                value={ (formData as any)[catKey]?.[0] || "" }
                                onChange={(e) => handleCategoryChange(catKey as any, e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand cursor-pointer appearance-none"
                            >
                                <option value="">Seçiniz...</option>
                                {(options as any)[catKey].map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                <option value="new" className="text-brand font-bold">+ Yeni Ekle</option>
                            </select>
                        </div>
                    ))}
                </div>
             </div>
           )}

           {step === 2 && (
             <div className="space-y-6 animate-fade-in">
                 <h2 className="text-xl font-bold text-slate-800 border-b border-gray-100 pb-2">Malzemeler</h2>
                 <div className="space-y-3">
                     {formData.ingredients.map((ing, idx) => (
                         <div key={idx} className="flex gap-2 items-center">
                             <input type="text" placeholder="Malzeme" value={ing.name} onChange={(e) => updateIngredient(idx, 'name', e.target.value)} className="flex-[2] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
                             <input type="text" placeholder="Miktar" value={ing.amount} onChange={(e) => updateIngredient(idx, 'amount', e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
                             <input type="text" placeholder="Birim" value={ing.unit} onChange={(e) => updateIngredient(idx, 'unit', e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand" />
                             <button onClick={() => removeIngredient(idx)} className="text-gray-400 hover:text-red-500 p-2"><FaTrash /></button>
                         </div>
                     ))}
                     <button onClick={addIngredient} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand hover:text-brand transition font-bold flex items-center justify-center gap-2"><FaPlus /> Yeni Malzeme Ekle</button>
                 </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-6 animate-fade-in">
                 <h2 className="text-xl font-bold text-slate-800 border-b border-gray-100 pb-2">Nasıl Yapılır?</h2>
                 <div className="space-y-4">
                     {formData.steps.map((st, idx) => (
                         <div key={idx} className="flex gap-4">
                             <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">{idx + 1}</div>
                             <div className="flex-grow">
                                 <textarea value={st} onChange={(e) => updateStep(idx, e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand h-24 resize-none" placeholder="Bu adımda ne yapılıyor?" />
                             </div>
                             <button onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-500 self-center"><FaTrash /></button>
                         </div>
                     ))}
                     <button onClick={addStep} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-brand hover:text-brand transition font-bold flex items-center justify-center gap-2"><FaPlus /> Yeni Adım Ekle</button>
                 </div>
             </div>
           )}

        </div>

        <div className="flex justify-between mt-8">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-6 py-3 border rounded-xl font-bold disabled:opacity-50"><FaArrowLeft /> Geri</button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Devam Et <FaArrowRight /></button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-brand text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-dark shadow-lg shadow-brand/20 disabled:opacity-70">
              {loading ? <><FaSpinner className="animate-spin" /> Kaydediliyor</> : <><FaCheck /> Yayınla</>}
            </button>
          )}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
               <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center relative">
                   <button onClick={() => setShowModal(false)} className="absolute top-4 right-4"><FaXmark /></button>
                   <h3 className="font-bold text-xl mb-4">{modalType === 'input' ? modalMessage : (modalType === 'success' ? 'Başarılı' : 'Hata')}</h3>
                   {modalType === 'input' ? (
                       <>
                         <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="w-full border p-3 rounded-xl mb-4" placeholder="Değer giriniz..." />
                         <button onClick={() => { if(inputValue) inputCallback(inputValue); setShowModal(false); setInputValue(""); }} className="w-full bg-brand text-white py-3 rounded-xl font-bold">Ekle</button>
                       </>
                   ) : (
                       <>
                         <p className="text-gray-500 mb-6">{modalMessage}</p>
                         <button onClick={() => setShowModal(false)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Tamam</button>
                       </>
                   )}
               </div>
            </div>
        )}
      </div>
    </main>
  );
}