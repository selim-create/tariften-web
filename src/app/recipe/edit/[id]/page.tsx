"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import RecipeSelect from "@/components/recipes/RecipeSelect";
import { RECIPE_UNITS } from "@/lib/recipe-measurements";
import { validateManualRecipeStage, type ManualRecipeStage } from "@/lib/manual-recipe-validation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecipeById, updateRecipe, getTerms, getRecipeEditReviewStatus, type RecipeEditReviewStatus } from "@/lib/api";
import { uploadRecipeImage } from "@/lib/recipe-media-upload"; 
import { 
  FaArrowRight, FaArrowLeft, FaCheck, FaPlus, FaTrash, 
  FaClock, FaFire, FaImage, FaUtensils, FaVideo, FaCloudArrowUp, FaLink, FaXmark, FaSpinner
} from "react-icons/fa6";

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const { id } = use(params);
  const recipeId = parseInt(id);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [authorizedToken, setAuthorizedToken] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState("");
  const [saving, setSaving] = useState(false);
  const saveInFlightRef = useRef(false);
  const editorTopRef = useRef<HTMLElement>(null);
  const lastStepRef = useRef(step);
  const [formError, setFormError] = useState("");
  useEffect(() => {
    if (lastStepRef.current === step) return;
    lastStepRef.current = step;
    const timer = setTimeout(() => editorTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    return () => clearTimeout(timer);
  }, [step]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaType, setMediaType] = useState<'upload' | 'url' | 'video'>('url');
  const [previewUrl, setPreviewUrl] = useState("");
  const [reviewStatus, setReviewStatus] = useState<RecipeEditReviewStatus | null>(null);

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

  // Fail closed: the authenticated Core status endpoint verifies recipe ownership
  // (or WordPress administrator privileges). Public recipe search is NOT authorization.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setAuthorizedToken(null);
    setPermissionError("");
    setLoading(true);
    const token = user?.token;
    if (!token) {
      setPermissionError("Bu tarifi düzenlemek için giriş yapmalısın.");
      setLoading(false);
      return;
    }
    if (!Number.isSafeInteger(recipeId) || recipeId <= 0) {
      setPermissionError("Tarif bağlantısı geçersiz.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        // Must finish successfully BEFORE fetching/populating editable fields.
        const status = await getRecipeEditReviewStatus(token, recipeId);
        if (cancelled) return;
        setReviewStatus(status);
        const recipe = await getRecipeById(recipeId);
        if (cancelled) return;
        if (!recipe) {
          setPermissionError("Tarif bulunamadı.");
          return;
        }
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
             

        setAuthorizedToken(token);
        // Taxonomy discovery does not decide whether editing is allowed.
        void getTerms().then(terms => {
          if (!cancelled && terms) setOptions({
            cuisine: terms.cuisine || [],
            meal_type: terms.meal_type || [],
            difficulty: terms.difficulty || [],
            diet: terms.diet || [],
          });
        }).catch(() => {});
      } catch {
        if (!cancelled) setPermissionError(
          "Bu tarifi düzenleme yetkin doğrulanamadı. Yalnızca kendi tariflerini düzenleyebilirsin."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, recipeId, user?.token]);

  const handleInputChange = (field: string, value: string | number | string[]) => {
    if (typeof value === "string" && ["servings", "calories", "prep_time", "cook_time"].includes(field)) {
      const max = field === "servings" ? 36 : field === "calories" ? 3000 : 720;
      if (Number(value) > max) {
        setFormError(field === "servings" ? "Kaç kişilik? En fazla 36 kişi seçebilirsin." : "Bu değer için üst sınır " + max + ".");
        return;
      }
    }
    setFormError("");
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
    const issue = validateManualRecipeStage(formData, step as ManualRecipeStage);
    if (issue) {
      setStep(issue.stage);
      setFormError(issue.message);
      setTimeout(() => editorTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
      return;
    }
    setFormError("");
    setStep(prev => Math.min(3, prev + 1));
  };

  const handleUpdate = async () => {
    if (saveInFlightRef.current || saving || mediaUploading || reviewStatus?.status === 'pending') return;
    if (!authorizedToken || authorizedToken !== user?.token) {
      setPermissionError("Düzenleme iznin doğrulanamadı. Tarifini yeniden açmalısın.");
      return;
    }
    if (!user || !user.token) return showError("Lütfen giriş yapın.");
    const issue = validateManualRecipeStage(formData);
    if (issue) { setStep(issue.stage); setFormError(issue.message); return; }
    saveInFlightRef.current = true;
    setSaving(true);
    try {
      // Görsel silindiyse açıkça belirt
      const dataToSend = {
        ...formData,
        id: recipeId,
        // Görsel boşsa, backend'e silinmesi gerektiğini bildir
        clear_image: !formData.image,
      };
      
      const result = await updateRecipe(user.token, dataToSend);
      if (result.success) {
        if (result.pending_review || result.status === "pending_review") {
          setReviewStatus({ status: 'pending', updated_at: new Date().toISOString(), note: '' });
          showSuccess("Değişikliklerin yönetici onayına gönderildi. Yayındaki tarifin bu sırada değişmeyecek.");
        } else {
          showSuccess("Tarif başarıyla güncellendi!");
          setTimeout(() => router.push(`/recipe/${result.slug || recipeId}`), 2000);
        }
      } else {
        showError(result.message || "Güncelleme başarısız.");
      }
    } catch (error: any) {
      showError(error.message || "Bağlantı hatası.");
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center text-gray-500"><FaSpinner className="animate-spin text-3xl mr-2"/> Düzenleme yetkisi kontrol ediliyor...</div>;
  if (permissionError || !authorizedToken || authorizedToken !== user?.token) return (
    <main className="min-h-[65vh] bg-[#fffaf5] px-4 py-20">
      <div role="alert" className="mx-auto max-w-xl rounded-[28px] border border-[#f2ded1] bg-white p-8 text-center shadow-sm">
        <h1 className="font-heading text-2xl font-extrabold text-[#263640]">Bu tarifi düzenleyemezsin</h1>
        <p className="mt-3 text-sm leading-6 text-[#786c64]">{permissionError || "Yalnızca kendi tariflerini düzenleyebilirsin."}</p>
        <Link href={user ? "/profile" : "/login"} className="mt-6 inline-flex rounded-xl bg-[#db4c3f] px-5 py-3 text-sm font-bold text-white">
          {user ? "Profilime dön" : "Giriş yap"}
        </Link>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#fffaf5] px-4 py-8 sm:py-12 relative">
      <div className="mx-auto max-w-4xl">
        
        <header ref={editorTopRef} className="scroll-mt-6 mb-8 rounded-[30px] border border-[#f0e2d7] bg-white px-5 py-7 shadow-[0_16px_45px_-30px_rgba(79,46,35,0.3)] sm:px-9 sm:py-9">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#b35744]">TARİFTEN · MUTFAK STÜDYOSU</p>
          <h1 className="mt-2 font-heading text-[30px] font-extrabold leading-tight tracking-tight text-[#203038] sm:text-[38px]">Tarifini düzenle.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82776e]">Aynı mutfak stüdyosunda, tarifinin bilgilerini ve hazırlanışını güncelle. Gönderdiğin değişiklikler incelenir.</p>
          <nav aria-label="Tarif oluşturma yöntemleri" className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
            <span aria-current="page" className="rounded-full bg-[#fce9e3] px-4 py-2 text-[#9e4136]">Tarifini düzenliyorsun</span>
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

        {reviewStatus?.status === 'pending' && (
          <div role="status" className="mb-5 rounded-2xl border border-[#e9c993] bg-[#fff5e4] p-4 text-sm text-[#765426]">
            <strong>Değişikliklerin onay bekliyor.</strong> Yayındaki tarifin eski hâli korunuyor.
          </div>
        )}
        {reviewStatus?.status === 'rejected' && (
          <div role="status" className="mb-5 rounded-2xl border border-[#e8b8b0] bg-[#fff0ed] p-4 text-sm text-[#aa433b]">
            <strong>Son düzenleme isteğin onaylanmadı.</strong>
            {reviewStatus.note && <span className="block mt-1">Yönetici notu: {reviewStatus.note}</span>}
            <span className="block mt-1">Düzenleyip yeniden gönderebilirsin.</span>
          </div>
        )}
        {reviewStatus?.status === 'approved' && (
          <p role="status" className="mb-5 rounded-2xl border border-[#bfddcc] bg-[#f0f8ef] p-4 text-sm font-bold text-[#477457]">Son düzenlemen onaylandı.</p>
        )}
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
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Hazırlama (dk)</label><input type="number" min={0} max={720} step={1} value={formData.prep_time} onChange={(e) => handleInputChange("prep_time", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Pişirme (dk)</label><input type="number" min={0} max={720} step={1} value={formData.cook_time} onChange={(e) => handleInputChange("cook_time", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Kalori</label><input type="number" min={0} max={3000} step={1} value={formData.calories} onChange={(e) => handleInputChange("calories", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                    <div><label className="text-xs font-bold text-gray-500 mb-1">Kaç kişilik? *</label><input type="number" min={1} max={36} aria-label="Tarifin kaç kişilik olduğu" value={formData.servings} onChange={(e) => handleInputChange("servings", e.target.value)} className="w-full bg-[#fffcf8] border border-[#e9dbcf] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f]" /></div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.keys(options).map((catKey) => (
                        <div key={catKey}>
                            <RecipeSelect
                               label={({ cuisine: "Mutfak", meal_type: "Öğün türü", difficulty: "Zorluk", diet: "Beslenme tercihi" } as Record<string, string>)[catKey]}
                               value={formData[catKey as keyof typeof options][0] || ""}
                               options={(options as Record<string, string[]>)[catKey]}
                               onChange={value => handleCategoryChange(catKey as keyof typeof options, value)}
                               onCreateOption={() => handleCategoryChange(catKey as keyof typeof options, "new")}
                             />
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
                               <input type="text" aria-label={`${idx + 1}. malzemenin miktarı`} placeholder="Miktar" value={ing.amount} onChange={(e) => {
                                 const value = e.target.value;
                                 if (/[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(value)
                                   && !["yarım", "çeyrek"].some(word => word.startsWith(value.toLocaleLowerCase("tr-TR")))) return;
                                 setFormError("");
                                 updateIngredient(idx, 'amount', value);
                               }} className="min-w-0 rounded-xl border border-[#e9dbcf] bg-white px-3 py-3 text-sm outline-none focus:border-[#db4c3f]" />
                               <RecipeSelect label="Ölçü birimi" value={ing.unit} options={RECIPE_UNITS}
                               onChange={value => { setFormError(""); updateIngredient(idx, "unit", value); }} placeholder="Birim seç" />
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

        <div className="mt-6 flex flex-col gap-3">
          {formError && <p role="alert" className="rounded-xl border border-[#f1c9b8] bg-[#fff0e9] p-3 text-sm font-bold text-[#a83f35]">{formError}</p>}
          <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => { setFormError(""); setStep(s => Math.max(1, s - 1)); }} disabled={step === 1 || saving} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#eaded2] bg-white px-5 py-3 text-sm font-bold text-[#5d5149] transition hover:border-[#db4c3f] disabled:opacity-50"><FaArrowLeft /> Geri</button>
          {step < 3 ? (
            <button type="button" onClick={goNext} disabled={saving || mediaUploading} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#db4c3f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#db4c3f]/15 transition hover:bg-[#b74135] disabled:opacity-50">Devam Et <FaArrowRight /></button>
          ) : (
            <button type="button" onClick={() => void handleUpdate()} disabled={saving || reviewStatus?.status === 'pending'} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#db4c3f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#db4c3f]/15 transition hover:bg-[#b74135] disabled:opacity-70">
              {saving ? <><FaSpinner className="animate-spin" /> Gönderiliyor</> : reviewStatus?.status === 'pending' ? <><FaCheck /> Onay bekleniyor</> : <><FaCheck /> Yönetici onayına gönder</>}
            </button>
          )}
        </div>

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