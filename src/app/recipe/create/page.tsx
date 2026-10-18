"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAccountQuotas, fetchAccountQuotas, quotaReached, quotaReset } from "@/lib/account-quotas-client";
import { createRecipe, getTerms } from "@/lib/api";
import { uploadRecipeImage } from "@/lib/recipe-media-upload";
import { validateManualRecipeStage, type ManualRecipeStage } from "@/lib/manual-recipe-validation";
import { 
  FaArrowRight, FaArrowLeft, FaCheck, FaPlus, FaTrash, 
  FaClock, FaFire, FaImage, FaVideo, FaCloudArrowUp, FaLink, FaXmark, FaSpinner
} from "react-icons/fa6";

export default function CreateRecipePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const saveInFlightRef = useRef(false);
  const [formError, setFormError] = useState("");
  const quotas = useAccountQuotas(user?.token);
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

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setFormError("");
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- YENİ DOSYA YÜKLEME MANTIĞI ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = ""; // Allow reselecting the same file after a failure.
    if (!file || !user?.token || mediaUploading) return;

    const previousPreview = previewUrl;
    const temporaryPreview = URL.createObjectURL(file);
    setPreviewUrl(temporaryPreview);
    setMediaUploading(true);
    try {
      const result = await uploadRecipeImage(user.token, file);
      if (!result.success) {
        setPreviewUrl(previousPreview);
        showError(result.message);
        return;
      }
      handleInputChange("image", result.id);
      setPreviewUrl(result.url || temporaryPreview);
      // The server returns the persistent media URL; a local blob is no longer needed.
      if (result.url) URL.revokeObjectURL(temporaryPreview);
    } finally {
      setMediaUploading(false);
    }
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

  const goNext = () => {
    const problem = validateManualRecipeStage(formData, step as ManualRecipeStage);
    if (problem) {
      setStep(problem.stage);
      setFormError(problem.message);
      return;
    }
    setFormError("");
    setStep(prev => Math.min(3, prev + 1));
  };

  const handleSubmit = async () => {
    if (saveInFlightRef.current || loading || mediaUploading) return;
    if (!user?.token) { showError("Tarifini yayımlamak için giriş yapmalısın."); return; }
    const validation = validateManualRecipeStage(formData);
    if (validation) {
      setStep(validation.stage);
      setFormError(validation.message);
      return;
    }
    saveInFlightRef.current = true;
    setLoading(true);
    setFormError("");
    let publishStarted = false;
    try {
      let fresh;
      try {
        fresh = await fetchAccountQuotas(user.token);
      } catch {
        setFormError("Kullanım hakların doğrulanamadı. Tarifin korunuyor; bağlantını kontrol edip tekrar dene.");
        return;
      }
      if (quotaReached(fresh, "recipe_day")) {
        setFormError("Bugünkü tarif ekleme hakkın doldu. Yeni hak: " + quotaReset(fresh, "recipe_day"));
        return;
      }
      publishStarted = true;
      const result = await createRecipe(user.token, formData);
      if (result?.success) {
        void quotas.reload();
        router.push(`/recipe/${result.slug || result.id}`);
      } else {
        setFormError(result?.message || "Tarif kaydedilemedi. Lütfen bilgilerini kontrol et.");
      }
    } catch (error: unknown) {
      setFormError(publishStarted
        ? "Tarifin yayımlanmış olabilir. Yeniden göndermeden önce Profil > Tariflerim bölümünü kontrol et."
        : error instanceof Error ? error.message : "Bağlantı hatası.");
    } finally {
      saveInFlightRef.current = false;
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center text-gray-500 min-h-screen flex items-center justify-center">Bu sayfayı görmek için giriş yapmalısınız.</div>;

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-8 sm:py-12 relative">
      <div className="mx-auto max-w-4xl">
        
        <header className="mb-8 rounded-[30px] border border-[#f0e2d7] bg-white px-5 py-7 shadow-[0_16px_45px_-30px_rgba(79,46,35,0.3)] sm:px-9 sm:py-9">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#b35744]">TARİFTEN · MUTFAK STÜDYOSU</p>
          <h1 className="mt-2 font-heading text-[30px] font-extrabold leading-tight tracking-tight text-[#203038] sm:text-[38px]">Tarifini kendi kelimelerinle anlat.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82776e]">Malzemeleri ve hazırlanışını adım adım ekle. Tarifin içeriği ve yayımlama kararı senin elinde.</p>
          <nav aria-label="Tarif oluşturma yöntemleri" className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span aria-current="page" className="rounded-full bg-[#fce9e3] px-4 py-2 text-[#9e4136]">Tarifimi kendim yazacağım</span>
            <Link href="/recipes?quick=1" className="rounded-full border border-[#ecdccf] px-4 py-2 text-[#584b43] transition hover:border-[#db4c3f] hover:text-[#b34336]">AI ile hızlı oluştur</Link>
            <Link href="/recipe/import" className="rounded-full border border-[#ecdccf] px-4 py-2 text-[#584b43] transition hover:border-[#db4c3f] hover:text-[#b34336]">Tarif notlarımı aktar</Link>
          </nav>
          <ol aria-label="Tarif oluşturma adımları" className="mt-7 grid grid-cols-3 gap-2">
            {(["Tarif bilgileri", "Malzemeler", "Hazırlanış"] as const).map((label, index) => (
              <li key={label} aria-current={step === index + 1 ? "step" : undefined}
                className={`rounded-xl border px-2 py-3 text-center text-[11px] font-bold sm:px-3 sm:text-xs ${step === index + 1 ? "border-[#db4c3f] bg-[#fcece7] text-[#a43b32]" : step > index + 1 ? "border-[#b5d2c0] bg-[#edf7ef] text-[#37634a]" : "border-[#eee4da] bg-[#fcfaf8] text-[#9c9188]"}`}>
                <span className="block text-sm font-black">{index + 1}</span>{label}
              </li>
            ))}
          </ol>
        </header>

        {formError && <div role="alert" className="mb-5 rounded-2xl border border-[#efc6b7] bg-[#fff0e9] px-5 py-4 text-sm font-semibold leading-6 text-[#a33d35]">{formError}</div>}
         <div className="rounded-[28px] border border-[#efe3d9] bg-white p-5 shadow-[0_20px_55px_-36px_rgba(65,46,36,0.35)] sm:p-9">
           
           {step === 1 && (
             <div className="space-y-6 animate-fade-in">
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tarifinin adı *</label>
                    <input type="text" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 font-bold text-lg focus:outline-none focus:border-[#db4c3f]" placeholder="Örn: Avokado Tost" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Tarifinin kısa tanıtımı · Spot</label>
                    <textarea value={formData.excerpt} onChange={(e) => handleInputChange("excerpt", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f] h-24 resize-none" placeholder="Tarifiniz hakkında kısa ve iştah açıcı bir özet..." />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Şefin İpucu (Opsiyonel)</label>
                    <textarea value={formData.chef_tip} onChange={(e) => handleInputChange("chef_tip", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f] h-20 resize-none" placeholder="Bu tarife özel bir ipucu... (Boş bırakılırsa otomatik oluşturulur)" />
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Görsel / Video</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button onClick={() => setMediaType('upload')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'upload' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaCloudArrowUp className="inline mr-1"/> Dosya</button>
                        <button onClick={() => setMediaType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'url' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaLink className="inline mr-1"/> URL</button>
                        <button onClick={() => setMediaType('video')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${mediaType === 'video' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-500'}`}><FaVideo className="inline mr-1"/> Video</button>
                    </div>
                    
                    <div className="border-2 border-dashed border-[#e9dbcf] rounded-xl p-6 text-center hover:border-brand/50 transition bg-[#fffcf8] relative overflow-hidden">
                        {(previewUrl || (typeof formData.image === 'string' && formData.image)) ? (
                            <div className="relative h-48 w-full group">
                                <img src={previewUrl || (typeof formData.image === 'string' ? formData.image : '')} alt="Tarif fotoğrafı önizlemesi" className="h-full w-full object-contain rounded-lg" />
                                <button onClick={() => { handleInputChange("image", ""); setPreviewUrl(""); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition"><FaTrash /></button>
                                {mediaUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-bold rounded-lg">Yükleniyor...</div>}
                            </div>
                        ) : (
                            <>
                                {mediaType === 'upload' && (
                                    <div className="flex flex-col items-center py-4 cursor-pointer relative">
                                        <FaCloudArrowUp className="text-4xl text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-500">Görseli buraya sürükleyin veya tıklayın</p>
                                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                )}
                                {mediaType === 'url' && (
                                    <input 
                                      type="text" 
                                      value={typeof formData.image === 'string' ? formData.image : ''}
                                      onChange={(e) => { handleInputChange("image", e.target.value); setPreviewUrl(e.target.value); }} 
                                      className="w-full bg-white border border-[#e9dbcf] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#db4c3f]" 
                                      placeholder="https://ornek.com/resim.jpg" 
                                    />
                                )}
                                {mediaType === 'video' && (
                                    <input 
                                        type="text" 
                                        value={typeof formData.image === 'string' ? formData.image : ''}
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
                                        className="w-full bg-white border border-[#e9dbcf] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#db4c3f]" 
                                        placeholder="Youtube linki..." 
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Hazırlama (dk)</label><input type="number" value={formData.prep_time} onChange={(e) => handleInputChange("prep_time", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Pişirme (dk)</label><input type="number" value={formData.cook_time} onChange={(e) => handleInputChange("cook_time", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Kalori</label><input type="number" value={formData.calories} onChange={(e) => handleInputChange("calories", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Kaç kişilik? *</label><input type="number" min={1} max={36} aria-label="Tarifin kaç kişilik olduğu" value={formData.servings} onChange={(e) => handleInputChange("servings", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.keys(options).map((catKey) => (
                        <div key={catKey}>
                            <label className="block text-xs font-bold text-gray-500 mb-1">{({ cuisine: "Mutfak", meal_type: "Öğün türü", difficulty: "Zorluk", diet: "Beslenme tercihi" } as Record<string, string>)[catKey]}</label>
                            <select 
                                value={ (formData as any)[catKey]?.[0] || "" }
                                onChange={(e) => handleCategoryChange(catKey as any, e.target.value)} 
                                className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f] cursor-pointer appearance-none"
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
                 <p className="text-[11px] font-black uppercase tracking-widest text-[#b35744]">2 · TARİFİN İÇİNDEKİLER</p>
                  <h2 className="border-b border-[#efe7df] pb-4 font-heading text-2xl font-extrabold text-[#23333a]">Malzemeler</h2>
                 <div className="space-y-3">
                     {formData.ingredients.map((ing, idx) => (
                         <div key={idx} className="relative grid grid-cols-2 gap-2 rounded-2xl border border-[#eee2d7] bg-[#fffcf8] p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                               <input type="text" aria-label={`${idx + 1}. malzemenin adı`} placeholder="Malzeme adı" value={ing.name} onChange={(e) => { setFormError(""); updateIngredient(idx, 'name', e.target.value); }} className="col-span-2 rounded-xl border border-[#e9dbcf] bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#db4c3f] sm:col-span-1 sm:pr-4" />
                               <input type="text" aria-label={`${idx + 1}. malzemenin miktarı`} placeholder="Miktar" value={ing.amount} onChange={(e) => updateIngredient(idx, 'amount', e.target.value)} className="min-w-0 rounded-xl border border-[#e9dbcf] bg-white px-3 py-3 text-sm outline-none focus:border-[#db4c3f]" />
                               <input type="text" aria-label={`${idx + 1}. malzemenin birimi`} placeholder="Birim" value={ing.unit} onChange={(e) => updateIngredient(idx, 'unit', e.target.value)} className="min-w-0 rounded-xl border border-[#e9dbcf] bg-white px-3 py-3 text-sm outline-none focus:border-[#db4c3f]" />
                               <button type="button" aria-label={`${idx + 1}. malzemeyi kaldır`} onClick={() => { setFormError(""); removeIngredient(idx); }} className="absolute right-4 top-4 rounded-lg p-2 text-[#a58f80] transition hover:bg-[#fee9e6] hover:text-[#bb4639] sm:static"><FaTrash /></button>
                           </div>
                     ))}
                     <button type="button" onClick={() => { setFormError(""); addIngredient(); }} className="w-full py-3 border-2 border-dashed border-[#e9dbcf] rounded-xl text-gray-500 hover:border-brand hover:text-brand transition font-bold flex items-center justify-center gap-2"><FaPlus /> Yeni Malzeme Ekle</button>
                 </div>
             </div>
           )}

           {step === 3 && (
             <div className="space-y-6 animate-fade-in">
                 <p className="text-[11px] font-black uppercase tracking-widest text-[#b35744]">3 · MUTFAKTA ADIM ADIM</p>
                  <h2 className="border-b border-[#efe7df] pb-4 font-heading text-2xl font-extrabold text-[#23333a]">Nasıl yapılır?</h2>
                 <div className="space-y-4">
                     {formData.steps.map((st, idx) => (
                         <div key={idx} className="flex gap-3 sm:gap-4">
                             <div className="flex-shrink-0 w-8 h-8 bg-[#db4c3f] text-white rounded-full flex items-center justify-center font-bold text-sm mt-1">{idx + 1}</div>
                             <div className="flex-grow">
                                 <textarea aria-label={`${idx + 1}. hazırlanış adımı`} value={st} onChange={(e) => { setFormError(""); updateStep(idx, e.target.value); }} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f] h-24 resize-none" placeholder="Bu adımda ne yapılıyor?" />
                             </div>
                             <button type="button" aria-label={`${idx + 1}. adımı kaldır`} onClick={() => { setFormError(""); removeStep(idx); }} className="text-gray-400 hover:text-red-500 self-center"><FaTrash /></button>
                         </div>
                     ))}
                     <button type="button" onClick={() => { setFormError(""); addStep(); }} className="w-full py-3 border-2 border-dashed border-[#e9dbcf] rounded-xl text-gray-500 hover:border-brand hover:text-brand transition font-bold flex items-center justify-center gap-2"><FaPlus /> Yeni Adım Ekle</button>
                 </div>
             </div>
           )}

        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => { setFormError(""); setStep(s => Math.max(1, s - 1)); }} disabled={step === 1 || loading} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#eaded2] bg-white px-5 py-3 text-sm font-bold text-[#5d5149] transition hover:border-[#db4c3f] disabled:opacity-50"><FaArrowLeft /> Geri</button>
          {step < 3 ? (
            <button type="button" onClick={goNext} disabled={loading || mediaUploading} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#db4c3f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#db4c3f]/15 transition hover:bg-[#b74135] disabled:opacity-50">Devam Et <FaArrowRight /></button>
          ) : (
            <button type="button" onClick={() => void handleSubmit()} disabled={loading || mediaUploading} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#db4c3f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#db4c3f]/15 transition hover:bg-[#b74135] disabled:opacity-70">
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