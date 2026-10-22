"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import RecipeSelect from "@/components/recipes/RecipeSelect";
import RecipeIngredientRow from "@/components/recipes/RecipeIngredientRow";
import { validateManualRecipeStage, type ManualRecipeStage } from "@/lib/manual-recipe-validation";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getRecipeById, getTerms } from "@/lib/api";
import { getRecipeReviewStatusClient, type RecipeReviewStatus } from "@/lib/recipe-write-client";
import { updateRecipeClient } from "@/lib/recipe-write-client";
import { uploadRecipeImage } from "@/lib/recipe-media-upload";
import { isPlaceholderImage } from "@/lib/utils";
import { fetchOwnerRecipe } from "@/lib/media-recipe-import";
import type { Recipe } from "@/types";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock3, LoaderCircle, LockKeyhole, TriangleAlert } from "lucide-react";
import {
  AddRowButton, CATEGORY_LABELS, MediaPicker, NumberField, OptionDialog, StepsEditor, StudioPreview, StudioSection,
  studioInput, studioLabel, youtubeThumbnail, type MediaMode,
} from "@/components/recipe-studio/StudioParts";

const STEPS = ["Tarif bilgileri", "Malzemeler", "Hazırlanış"] as const;

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
  const [mediaType, setMediaType] = useState<MediaMode>('url');
  const [previewUrl, setPreviewUrl] = useState("");
  const [reviewStatus, setReviewStatus] = useState<RecipeReviewStatus | null>(null);

  const [optionDialog, setOptionDialog] = useState<keyof typeof CATEGORY_LABELS | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4800);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
        const status = await getRecipeReviewStatusClient(token, recipeId);
        if (cancelled) return;
        setReviewStatus(status);
        // Private photo/notebook recipes are invisible to the public lookup;
        // the owner reads them with their own token (never cached).
        const recipe = (await getRecipeById(recipeId))
          ?? (await fetchOwnerRecipe<Recipe>(token, String(recipeId)).catch(() => null));
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
                    ? (typeof recipe.steps[0] === 'string' ? recipe.steps as string[] : (recipe.steps as unknown as { content: string }[]).map(s => s.content)) 
                    : [""],
                 chef_tip: recipe.chef_tip || "",
                 serving_weight: recipe.serving_weight ? String(recipe.serving_weight) : "",
             });
             
             const img = recipe.image || "";
             if (youtubeThumbnail(img)) {
                 setMediaType('video');
                 setPreviewUrl(youtubeThumbnail(img));
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

  const showError = (msg: string) => {
    setNotice(msg);
  };
  
  const addCategoryOption = (category: keyof typeof options, newCat: string) => {
    setOptions(prev => ({ ...prev, [category]: [...prev[category], newCat] }));
    handleInputChange(category, [newCat]);
  };

  const handleCategoryChange = (category: keyof typeof options, value: string) => {
    if (value === "new") {
      setOptionDialog(category);
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
  const moveStep = (index: number, direction: -1 | 1) => setFormData(prev => {
    const target = index + direction;
    if (target < 0 || target >= prev.steps.length) return prev;
    const steps = [...prev.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    return { ...prev, steps };
  });

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
      
      const result = await updateRecipeClient(user.token, dataToSend);
      if (result.success) {
        const target = `/recipe/${result.slug || recipeId}`;
        // Both moderation and direct update return to the published recipe.
        // The destination displays a short, dismissible notice and owner-only review status.
        router.replace(target + (result.pending_review || result.status === "pending_review"
          ? "?edit_review=submitted" : "?edit_review=updated"));

      } else {
        showError(result.message || "Güncelleme başarısız.");
      }
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : "Bağlantı hatası.");
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  };

  if (authLoading || loading) return (
    <main className="grid min-h-[70vh] place-items-center bg-[#fcfcfc] text-sm text-slate-500">
      <span className="inline-flex items-center gap-2"><LoaderCircle className="h-5 w-5 animate-spin text-brand" aria-hidden /> Düzenleme yetkisi kontrol ediliyor…</span>
    </main>
  );
  if (permissionError || !authorizedToken || authorizedToken !== user?.token) return (
    <main className="grid min-h-[70vh] place-items-center bg-[#fcfcfc] px-4 py-16">
      <div role="alert" className="max-w-md text-center">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8] text-brand"><LockKeyhole className="h-6 w-6" aria-hidden /></span>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Bu tarifi düzenleyemezsin</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-slate-500">{permissionError || "Yalnızca kendi tariflerini düzenleyebilirsin."}</p>
        <Link href={user ? "/profile" : "/login"} className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark">
          {user ? "Profilime dön" : "Giriş yap"}
        </Link>
      </div>
    </main>
  );

  const imageValue = typeof formData.image === "string" ? formData.image : "";
  // The "photo pending" placeholder is not the cook's photo; offer the upload instead.
  const preview = isPlaceholderImage(previewUrl || imageValue) ? "" : previewUrl || imageValue;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-28 text-slate-800 sm:pb-20">
      {notice && <div role="alert" className="fixed inset-x-4 bottom-24 z-[130] mx-auto max-w-sm rounded-2xl bg-slate-900 px-5 py-4 text-sm font-medium text-white shadow-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:mx-0">{notice}</div>}

      <section className="border-b border-gray-100 bg-[radial-gradient(ellipse_at_top,#fdf1ea_0%,#fcfcfc_65%)] px-4 pb-8 pt-6 sm:pb-10">
        <div className="mx-auto max-w-6xl">
          <nav aria-label="Sayfa konumu" className="mb-8 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap text-xs text-gray-500">
            <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
            <Link href="/profile" className="transition hover:text-brand">Profilim</Link>
            <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden />
            <span className="truncate font-medium text-slate-700">Düzenle</span>
          </nav>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">TARİFTEN · MUTFAK STÜDYOSU</p>
          <h1 className="max-w-3xl font-heading text-[34px] font-bold leading-[1.05] tracking-[-0.035em] text-slate-900 text-balance sm:text-[52px]">
            Tarifini <span className="italic text-brand">düzenle.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-500">
            Değişikliklerin yönetici onayından sonra yayına girer; o zamana kadar tarifin bugünkü hâliyle görünür.
          </p>
          <nav aria-label="Tarif oluşturma yöntemleri" className="mt-6 flex flex-wrap gap-2 text-[13px] font-semibold">
            <span aria-current="page" className="inline-flex min-h-10 items-center rounded-full bg-slate-900 px-4 text-white">Tarifini düzenliyorsun</span>
            {formData.title && <Link href={`/recipe/${recipeId}`} className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-slate-600 ring-1 ring-gray-200 transition hover:text-brand hover:ring-brand/40">Yayındaki tarife dön</Link>}
          </nav>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-8 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-8">
          <header ref={editorTopRef} className="scroll-mt-24">
            <ol aria-label="Tarif düzenleme adımları" className="grid grid-cols-3 gap-2">
              {STEPS.map((label, index) => {
                const current = step === index + 1;
                const done = step > index + 1;
                return (
                  <li key={label} aria-current={current ? "step" : undefined}>
                    <button type="button" disabled={!done || saving} onClick={() => { setFormError(""); setStep(index + 1); }}
                      className={`w-full border-t-2 pt-3 text-left transition ${current ? "border-brand" : done ? "border-slate-900 hover:border-brand" : "border-gray-200"}`}>
                      <span className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] tabular-nums ${current ? "text-brand" : done ? "text-slate-900" : "text-gray-400"}`}>
                        {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={`mt-0.5 block text-sm font-semibold sm:text-[15px] ${current || done ? "text-slate-900" : "text-gray-400"}`}>{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </header>

          {reviewStatus?.status === 'pending' && (
            <div role="status" className="mt-6 flex gap-3 rounded-2xl bg-[#fff6e6] px-4 py-3.5 text-sm leading-6 text-[#7a5520] ring-1 ring-[#f0d9ab]">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p><strong className="font-semibold">Değişikliklerin onay bekliyor.</strong> Yayındaki tarifin eski hâli korunuyor.</p>
            </div>
          )}
          {reviewStatus?.status === 'rejected' && (
            <div role="status" className="mt-6 rounded-2xl bg-[#fdf0ec] px-4 py-3.5 text-sm leading-6 text-brand-dark ring-1 ring-[#f3cfc5]">
              <strong className="font-semibold">Son düzenleme isteğin onaylanmadı.</strong>
              {reviewStatus.note && <span className="mt-1 block">Yönetici notu: {reviewStatus.note}</span>}
              <span className="mt-1 block">Düzenleyip yeniden gönderebilirsin.</span>
            </div>
          )}
          {reviewStatus?.status === 'approved' && (
            <p role="status" className="mt-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <Check className="h-4 w-4" aria-hidden /> Son düzenlemen onaylandı.
            </p>
          )}
          {formError && (
            <div role="alert" className="mt-6 flex gap-3 rounded-2xl bg-[#fdf0ec] px-4 py-3.5 text-sm font-medium leading-6 text-brand-dark ring-1 ring-[#f3cfc5]">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {formError}
            </div>
          )}

          <div className="mt-6 space-y-5">
            {step === 1 && (
              <>
                <StudioSection title="Tarifin kimliği" hint="Adı ve kısa tanıtımı; listelerde ve paylaşımlarda bu görünür.">
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="studio-title" className={studioLabel}>Tarifinin adı<span className="text-brand"> *</span></label>
                      <input id="studio-title" type="text" value={formData.title} maxLength={180} onChange={(e) => handleInputChange("title", e.target.value)}
                        className={`${studioInput} font-heading text-lg font-semibold`} placeholder="Örn. Anneannemin kuru fasulyesi" />
                    </div>
                    <div>
                      <label htmlFor="studio-excerpt" className={studioLabel}>Kısa tanıtım <span className="font-normal text-gray-400">· isteğe bağlı</span></label>
                      <textarea id="studio-excerpt" value={formData.excerpt} rows={3} onChange={(e) => handleInputChange("excerpt", e.target.value)}
                        className={`${studioInput} resize-y leading-relaxed`} placeholder="Bu tarifi özel yapan ne? İki cümle yeter." />
                    </div>
                  </div>
                </StudioSection>

                <StudioSection title="Fotoğraf" hint="Kendi çektiğin bir fotoğraf tarifini en iyi anlatır.">
                  <MediaPicker mode={mediaType} onModeChange={setMediaType} preview={preview} uploading={mediaUploading}
                    accept="image/jpeg,image/png,image/webp" onFile={handleFileUpload} urlValue={isPlaceholderImage(imageValue) ? "" : imageValue}
                    onUrl={(value) => { handleInputChange("image", value); setPreviewUrl(value); }}
                    onVideo={(value) => { const thumb = youtubeThumbnail(value); if (thumb) { handleInputChange("image", value); setPreviewUrl(thumb); } }}
                    onClear={() => { handleInputChange("image", ""); setPreviewUrl(""); }} />
                </StudioSection>

                <StudioSection title="Süre ve porsiyon" hint="Bilmediğin alanı boş bırak; tahmin yazmana gerek yok.">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <NumberField label="Kaç kişilik?" suffix="kişi" required min={1} max={36} ariaLabel="Tarifin kaç kişilik olduğu"
                      value={formData.servings} onChange={(v) => handleInputChange("servings", v)} />
                    <NumberField label="Hazırlık" suffix="dk" min={0} max={720} value={formData.prep_time} onChange={(v) => handleInputChange("prep_time", v)} />
                    <NumberField label="Pişirme" suffix="dk" min={0} max={720} value={formData.cook_time} onChange={(v) => handleInputChange("cook_time", v)} />
                    <NumberField label="Kalori" suffix="kcal" min={0} max={3000} value={formData.calories} onChange={(v) => handleInputChange("calories", v)} hint="Kişi başına" />
                  </div>
                </StudioSection>

                <StudioSection title="Etiketler" hint="Tarifini doğru rafa koyalım; aramalarda ve filtrelerde böyle bulunur.">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Object.keys(options).map((catKey) => (
                      <RecipeSelect key={catKey}
                        label={CATEGORY_LABELS[catKey].label}
                        value={formData[catKey as keyof typeof options][0] || ""}
                        options={(options as Record<string, string[]>)[catKey]}
                        onChange={value => handleCategoryChange(catKey as keyof typeof options, value)}
                        onCreateOption={() => handleCategoryChange(catKey as keyof typeof options, "new")}
                      />
                    ))}
                  </div>
                </StudioSection>

                <StudioSection title="Şefin notu" hint="Bu tarifte işe yarayan küçük bir sır varsa yaz. Boş bırakabilirsin.">
                  <textarea aria-label="Şefin notu" value={formData.chef_tip} rows={3} onChange={(e) => handleInputChange("chef_tip", e.target.value)}
                    className={`${studioInput} resize-y leading-relaxed`} placeholder="Örn. Fasulyeyi pişirirken tuzu en sona ekle, kabuğu yumuşak kalır." />
                </StudioSection>
              </>
            )}

            {step === 2 && (
              <StudioSection title="Malzemeler" hint="Her satıra bir malzeme. Miktar ve birim isteğe bağlı; yarım limon gibi durumlar için boş bırakabilirsin.">
                <div className="space-y-3">
                  {formData.ingredients.map((ing, idx) => (
                    <RecipeIngredientRow key={idx} index={idx} ingredient={ing}
                      onChange={(field, value) => { setFormError(""); updateIngredient(idx, field, value); }}
                      onRemove={() => { setFormError(""); removeIngredient(idx); }} />
                  ))}
                </div>
                <AddRowButton onClick={() => { setFormError(""); addIngredient(); }} disabled={formData.ingredients.length >= 40}>Malzeme ekle</AddRowButton>
              </StudioSection>
            )}

            {step === 3 && (
              <StudioSection title="Hazırlanış" hint="Mutfakta yanında biri varmış gibi anlat: sırayla, net, birer iş.">
                <StepsEditor steps={formData.steps}
                  onChange={(idx, value) => { setFormError(""); updateStep(idx, value); }}
                  onAdd={() => { setFormError(""); addStep(); }}
                  onRemove={(idx) => { setFormError(""); removeStep(idx); }}
                  onMove={(idx, direction) => moveStep(idx, direction)} />
              </StudioSection>
            )}
          </div>

          <div className="studio-actionbar fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mt-8 sm:border-0 sm:p-0 sm:backdrop-blur-none">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <button type="button" onClick={() => { setFormError(""); setStep(s => Math.max(1, s - 1)); }} disabled={step === 1 || saving}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold text-slate-600 transition hover:bg-black/5 disabled:invisible">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Geri
              </button>
              <span className="text-xs text-gray-400 tabular-nums sm:hidden">{step} / 3</span>
              {step < 3 ? (
                <button type="button" onClick={goNext} disabled={saving || mediaUploading}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50">
                  {STEPS[step]} <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button type="button" onClick={() => void handleUpdate()} disabled={saving || reviewStatus?.status === 'pending'}
                  className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                  {saving ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> Gönderiliyor</> : reviewStatus?.status === 'pending' ? <><Clock3 className="h-4 w-4" aria-hidden /> Onay bekleniyor</> : <><Check className="h-4 w-4" aria-hidden /> Yönetici onayına gönder</>}
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-24">
            <StudioPreview data={formData} image={preview} />
          </div>
        </aside>
      </div>

      {optionDialog && (
        <OptionDialog label={CATEGORY_LABELS[optionDialog].add} onClose={() => setOptionDialog(null)}
          onSubmit={(value) => addCategoryOption(optionDialog as keyof typeof options, value)} />
      )}
    </main>
  );
}
