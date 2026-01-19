"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecipeById, updateRecipe, getTerms, uploadMedia } from "@/lib/api"; 
import { 
  FaArrowRight, FaArrowLeft, FaCheck, FaPlus, FaTrash, 
  FaClock, FaFire, FaImage, FaUtensils, FaVideo, FaCloudArrowUp, FaLink, FaXmark, FaSpinner
} from "react-icons/fa6";

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  
  const { id } = use(params);
  const recipeId = parseInt(id);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'upload' | 'url' | 'video'>('url');
  const [previewUrl, setPreviewUrl] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'input'>('success');
  const [modalMessage, setModalMessage] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [inputCallback, setInputCallback] = useState<(val: string) => void>(() => {});

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    image: "" as string | number,
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

  // VERİLERİ ÇEK
  useEffect(() => {
    async function initData() {
        if (!user) return;
        const terms = await getTerms();
        if (terms) {
            setOptions({
                cuisine: terms.cuisine || ["Türk Mutfağı"],
                meal_type: terms.meal_type || ["Akşam Yemeği"],
                difficulty: terms.difficulty || ["Kolay"],
                diet: terms.diet || ["Vegan"]
            });
        }

        const recipe = await getRecipeById(recipeId);
        if (recipe) {
             setFormData({
                 title: recipe.title || "",
                 excerpt: recipe.excerpt || "",
                 image: recipe.image || "",
                 // DÜZELTME: API'den gelen verileri string'e çevir
                 prep_time: recipe.prep_time ? String(recipe.prep_time) : "",
                 cook_time: recipe.cook_time ? String(recipe.cook_time) : "",
                 calories: recipe.calories ? String(recipe.calories) : "",
                 servings: recipe.servings ? String(recipe.servings) : "",
                 cuisine: recipe.cuisine || [],
                 meal_type: recipe.meal_type || [],
                 difficulty: recipe.difficulty || [],
                 diet: recipe.diet || [],
                 // Malzeme miktarlarını da string'e çeviriyoruz
                 ingredients: (recipe.ingredients && recipe.ingredients.length > 0) 
                    ? recipe.ingredients.map(ing => ({ ...ing, amount: String(ing.amount) })) 
                    : [{ name: "", amount: "", unit: "" }],
                 steps: (recipe.steps && recipe.steps.length > 0) 
                    ? (typeof recipe.steps[0] === 'string' ? recipe.steps as string[] : (recipe.steps as any[]).map(s => s.content)) 
                    : [""],
                 chef_tip: recipe.chef_tip || "",
                 serving_weight: recipe.serving_weight ? String(recipe.serving_weight) : "",
             });
             
             const img = recipe.image || "";
             if (img.includes("youtube.com") || img.includes("youtu.be")) {
                 setMediaType('video');
                 setPreviewUrl(`https://img.youtube.com/vi/${img.split("v=")[1]?.split("&")[0] || img.split("youtu.be/")[1]}/hqdefault.jpg`);
             }
             else if (img.startsWith('http')) {
                 setMediaType('url');
                 setPreviewUrl(img);
             }
             
             setLoading(false);
        } else {
            showError("Tarif bulunamadı.");
            setTimeout(() => router.push("/recipes"), 2000);
        }
    }
    initData();
  }, [recipeId, user, router]);

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !user.token) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setMediaUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const mediaId = await uploadMedia(user.token, formData);
    
    if (mediaId) {
      handleInputChange("image", mediaId);
    } else {
      showError("Görsel yüklenemedi.");
      setPreviewUrl("");
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

  const handleUpdate = async () => {
    if (!user || !user.token) return showError("Lütfen giriş yapın.");
    setSaving(true);
    try {
      // Görsel silindiyse açıkça belirt
      const dataToSend = {
        ...formData,
        id: recipeId,
        // Görsel boşsa, backend'e silinmesi gerektiğini bildir
        image: formData.image || null,
        clear_image: formData.image === "" || formData.image === null,
      };
      
      const result = await updateRecipe(user.token, dataToSend);
      if (result.success) {
        showSuccess("Tarif başarıyla güncellendi! 🎉");
        setTimeout(() => router.push(`/recipe/${result.slug || recipeId}`), 2000);
      } else {
        showError(result.message || "Güncelleme başarısız.");
      }
    } catch (error: any) {
      showError(error.message || "Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500"><FaSpinner className="animate-spin text-3xl mr-2"/> Tarif yükleniyor...</div>;

  return (
    <main className="min-h-screen bg-[#fcfcfc] py-10 px-4 relative">
       {/* UI */}
       <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold mb-2">Düzenleme Modu</div>
          <h1 className="text-3xl font-bold text-slate-900 font-heading">Tarifi Düzenle</h1>
          <p className="text-gray-500">Adım {step} / 3</p>
          <div className="w-full bg-gray-200 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-brand h-full transition-all duration-500" style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }} />
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
           
           {/* ADIM 1 */}
           {step === 1 && (
             <div className="space-y-6 animate-fade-in">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Tarif Başlığı</label><input type="text" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-brand" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Kısa Açıklama</label><textarea value={formData.excerpt} onChange={(e) => handleInputChange("excerpt", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand h-24 resize-none" /></div>
                
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Şefin İpucu (Opsiyonel)</label><textarea value={formData.chef_tip} onChange={(e) => handleInputChange("chef_tip", e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand h-20 resize-none" placeholder="Bu tarife özel bir ipucu... (Boş bırakılırsa otomatik oluşturulur)" /></div>
                
                {/* Medya Yükleme */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Görsel / Video</label>
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => setMediaType('upload')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'upload' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaCloudArrowUp className="inline mr-1"/> Dosya</button>
                        <button onClick={() => setMediaType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'url' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaLink className="inline mr-1"/> URL</button>
                        <button onClick={() => setMediaType('video')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'video' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaVideo className="inline mr-1"/> Video</button>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand/50 transition bg-gray-50 relative overflow-hidden">
                        {(previewUrl || (typeof formData.image === 'string' && formData.image)) ? (
                            <div className="relative h-48 w-full group">
                                <img src={previewUrl || (typeof formData.image === 'string' ? formData.image : '')} alt="Preview" className="h-full w-full object-contain rounded-lg" />
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
                                    <input 
                                      type="text" 
                                      value={typeof formData.image === 'string' ? formData.image : ''}
                                      onChange={(e) => { handleInputChange("image", e.target.value); setPreviewUrl(e.target.value); }} 
                                      className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand" 
                                      placeholder="https://..." 
                                    />
                                )}
                                {mediaType === 'video' && (
                                    <input 
                                        type="text" 
                                        value={typeof formData.image === 'string' ? formData.image : ''}
                                        onChange={(e) => {
                                           let url = e.target.value;
                                           handleInputChange("image", url);
                                           if(url.includes("youtube.com") || url.includes("youtu.be")) {
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
                    <div><label className="text-xs font-bold text-gray-500">Hazırlama</label><input type="number" value={formData.prep_time} onChange={(e) => handleInputChange("prep_time", e.target.value)} className="w-full border rounded-xl p-3" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Pişirme</label><input type="number" value={formData.cook_time} onChange={(e) => handleInputChange("cook_time", e.target.value)} className="w-full border rounded-xl p-3" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Kalori</label><input type="number" value={formData.calories} onChange={(e) => handleInputChange("calories", e.target.value)} className="w-full border rounded-xl p-3" /></div>
                    <div><label className="text-xs font-bold text-gray-500">Porsiyon</label><input type="number" value={formData.servings} onChange={(e) => handleInputChange("servings", e.target.value)} className="w-full border rounded-xl p-3" /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {Object.keys(options).map((catKey) => (
                        <div key={catKey}>
                            <label className="block text-xs font-bold text-gray-500 mb-1 capitalize">{catKey.replace('_', ' ')}</label>
                            <select 
                                value={ (formData as any)[catKey]?.[0] || "" }
                                onChange={(e) => handleCategoryChange(catKey as any, e.target.value)} 
                                className="w-full border rounded-xl p-3 text-sm"
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
                             <input type="text" value={ing.name} onChange={(e) => updateIngredient(idx, 'name', e.target.value)} className="flex-[2] border rounded-xl p-3" placeholder="Malzeme" />
                             <input type="text" value={ing.amount} onChange={(e) => updateIngredient(idx, 'amount', e.target.value)} className="flex-1 border rounded-xl p-3" placeholder="Miktar" />
                             <input type="text" value={ing.unit} onChange={(e) => updateIngredient(idx, 'unit', e.target.value)} className="flex-1 border rounded-xl p-3" placeholder="Birim" />
                             <button onClick={() => removeIngredient(idx)} className="text-gray-400 hover:text-red-500 p-2"><FaTrash /></button>
                         </div>
                     ))}
                     <button onClick={addIngredient} className="w-full py-3 border-2 border-dashed rounded-xl flex justify-center items-center gap-2"><FaPlus /> Ekle</button>
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
                                 <textarea value={st} onChange={(e) => updateStep(idx, e.target.value)} className="w-full border rounded-xl p-3 h-20" />
                             </div>
                             <button onClick={() => removeStep(idx)} className="text-gray-400 hover:text-red-500 self-center"><FaTrash /></button>
                         </div>
                     ))}
                     <button onClick={addStep} className="w-full py-3 border-2 border-dashed rounded-xl flex justify-center items-center gap-2"><FaPlus /> Ekle</button>
                 </div>
             </div>
           )}

        </div>

        <div className="flex justify-between mt-8">
          <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="px-6 py-3 border rounded-xl font-bold disabled:opacity-50"><FaArrowLeft /> Geri</button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Devam Et <FaArrowRight /></button>
          ) : (
            <button onClick={handleUpdate} disabled={saving} className="px-8 py-3 bg-brand text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-70">
              {saving ? <><FaSpinner className="animate-spin" /> Kaydediliyor</> : <><FaCheck /> Güncelle</>}
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