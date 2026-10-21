"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getRecipes, getTerms } from "@/lib/api";
import { generateRecipeClient, createRecipeClient } from "@/lib/recipe-write-client"; 
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAccountQuotas, fetchAccountQuotas, quotaReached, quotaReset } from "@/lib/account-quotas-client";
import SimilarRecipeChoice from "@/components/recipes/SimilarRecipeChoice";
import { approvedQuickRecipe, quickRecipeFromAI, validateQuickRecipe, type QuickRecipeDraft } from "@/lib/quick-recipe-review";
import { Check, ChevronRight, Loader2, Minus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import RecipeCard from "@/components/recipes/RecipeCard";

// One honest status line; the request has no measurable sub-steps to report.
const LOADING_MESSAGES = [
  "Tarif hazırlanıyor, bu biraz sürebilir.",
];

const QUICK_SUGGESTIONS = [
  'Pratik makarna',
  'Tavuklu salata',
  'Çikolatalı tatlı',
  'Mercimek çorbası'
];

function RecipeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-3 aspect-[4/3] rounded-2xl bg-gray-100" />
      <div className="mb-2 h-3 w-16 rounded bg-gray-100" />
      <div className="h-5 w-3/4 rounded bg-gray-100" />
    </div>
  );
}

function RecipeAICard({
  query, generating, loadingMessage, reviewReady, onGenerate, saving, uncertain, failure, onNew,
}: {
  query: string;
  generating: boolean;
  loadingMessage: string;
  reviewReady: boolean;
  saving: boolean;
  uncertain: boolean;
  failure: string;
  onNew: () => void;
  onGenerate: () => void;
}) {
  const term = query.trim();
  return (
    <div className="flex min-h-[260px] flex-col justify-between rounded-2xl border border-dashed border-gray-300 bg-white p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">AI ile oluştur</p>
        <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-slate-900">
          {term ? <>“{term}” için uygun tarif yok mu?</> : "Aradığını bulamadın mı?"}
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          {generating ? loadingMessage : term
            ? "Bu arama için yeni bir tarif hazırlayabiliriz. Yayımlanmadan önce benzer tarif kontrolü yapılır."
            : "Bir tarif adı ya da elindeki malzemeleri yaz; senin için bir tarif hazırlayalım."}
        </p>
      </div>
      <div className="mt-5">
        <button type="button" onClick={onGenerate} disabled={generating || saving || uncertain}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
          {(generating || saving) && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? "Tarif yayımlanıyor…" : generating ? "Tarif hazırlanıyor…" : reviewReady ? "Tarifini kaydetmeye devam et" : "AI ile tarif oluştur"}
        </button>
        {failure && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">{failure}</p>}
        {uncertain && <p role="alert" className="mt-2 text-xs leading-5 text-red-700">Tarif kaydedilmiş olabilir. Tekrar göndermeden önce Profil &gt; Tariflerim bölümüne bak.</p>}
        {reviewReady && !saving && <button type="button" onClick={onNew} className="mt-3 text-xs font-semibold text-slate-600 underline underline-offset-4">Başka bir tarif iste</button>}
      </div>
    </div>
  );
}

function RecipesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const quotas = useAccountQuotas(user?.token);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // AI Modal
  const [isGenerating, setIsGenerating] = useState(false);
  const quickCreateInFlightRef = useRef(false);
  const quickPublishInFlightRef = useRef(false);
  const [reviewDraft, setReviewDraft] = useState<QuickRecipeDraft | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [similarRecipeId, setSimilarRecipeId] = useState<number | null>(null);
  const [similarRecipeSlug, setSimilarRecipeSlug] = useState<string | null>(null);
  const [publishError, setPublishError] = useState("");
  const [publishUncertain, setPublishUncertain] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Filtreler
  const [availableFilters, setAvailableFilters] = useState({
    mealType: [] as string[], cuisine: [] as string[], diet: [] as string[], difficulty: [] as string[]
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);

  const [modal, setModal] = useState({ show: false, type: 'success', message: '' });
  
  useEffect(() => {
    if (!modal.show) return;
    const timer = setTimeout(() => setModal(previous => ({ ...previous, show: false })), 4800);
    return () => clearTimeout(timer);
  }, [modal.show, modal.message]);

  // AI Prompt Modal için
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [usageNotice, setUsageNotice] = useState("");
  useEffect(() => {
    if (searchParams.get("quick") === "1") {
      setShowPromptModal(true);
      window.history.replaceState(window.history.state, "", "/recipes");
    }
  }, [searchParams, router]);
  useEffect(() => {
    if (!usageNotice) return;
    const timer = setTimeout(() => setUsageNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [usageNotice]);

  // 1. Kategorileri Çek
  useEffect(() => {
    getTerms().then(terms => {
      if (terms) setAvailableFilters({
        mealType: terms.meal_type || [],
        cuisine: terms.cuisine || [],
        diet: terms.diet || [],
        difficulty: terms.difficulty || []
      });
    });
  }, []);

  // 2. URL Parametrelerini Oku
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
    const cuisine = searchParams.get("cuisine"); if (cuisine) setSelectedCuisines(cuisine.split(","));
    const diet = searchParams.get("diet"); if (diet) setSelectedDiets(diet.split(","));
    const mealType = searchParams.get("meal_type"); if (mealType) setSelectedMealTypes(mealType.split(","));
    const difficulty = searchParams.get("difficulty"); if (difficulty) setSelectedDifficulties(difficulty.split(","));
  }, [searchParams]);

  // 3. Veri Çekme (İlk Yükleme ve Filtre Değişimi)
  const fetchRecipes = async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true); else setLoadingMore(true);
    
    const nextPage = isLoadMore ? page + 1 : 1;

    try {
      const res = await getRecipes({
        query,
        cuisine: selectedCuisines,
        diet: selectedDiets,
        mealType: selectedMealTypes,
        difficulty: selectedDifficulties,
        page: nextPage // Sayfa numarası gönder
      });

      const newRecipes = res.data || [];
      
      if (isLoadMore) {
        setRecipes(prev => [...prev, ...newRecipes]);
        setPage(nextPage);
      } else {
        setRecipes(newRecipes);
        setPage(1);
      }

      // Daha fazla veri var mı kontrolü (Basit mantık: Gelen veri 10 ise muhtemelen devamı vardır)
      setHasMore(newRecipes.length >= 10);
      

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Filtre değişince sıfırdan çek
  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchRecipes(false); }, 500);
    return () => clearTimeout(timeoutId);
  }, [query, selectedCuisines, selectedDiets, selectedMealTypes, selectedDifficulties]);

  // Yükleme Mesajı Döngüsü
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => { setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length); }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // --- UI YARDIMCILARI ---
  const toggleFilter = (item: string, current: string[], setFn: (val: string[]) => void) => {
    if (current.includes(item)) setFn(current.filter(i => i !== item));
    else setFn([...current, item]);
  };
  const toggleSection = (section: string) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  const showModalMessage = (type: 'success' | 'error', message: string) => setModal({ show: true, type, message });

  // The generated candidate is persisted automatically. Review is shown ONLY
  // when Core reports an already published similar recipe.
  const publishGeneratedRecipe = async (draft: QuickRecipeDraft, token: string) => {
    if (quickPublishInFlightRef.current || publishUncertain) return;
    const issue = validateQuickRecipe(draft);
    if (issue) {
      setPublishError("AI tarifinde eksik bilgi var: " + issue);
      return;
    }
    quickPublishInFlightRef.current = true;
    setIsPublishing(true);
    setPublishError("");
    let requestStarted = false;
    try {
      let fresh;
      try { fresh = await fetchAccountQuotas(token); }
      catch {
        setPublishError("Tarif yayınlama hakkın şu anda doğrulanamıyor. AI çıktısı korunuyor.");
        return;
      }
      if (quotaReached(fresh, "recipe_day")) {
        setPublishError("Bugünkü tarif yayımlama hakkın doldu. Yeni hak: " + quotaReset(fresh, "recipe_day"));
        return;
      }
      const payload = approvedQuickRecipe(draft);
      requestStarted = true;
      const saved = await createRecipeClient(token, payload);
      if (!saved.success || !(saved.slug || saved.id)) {
        setPublishError(saved.message || "Tarif yayımlanamadı.");
        return;
      }
      void quotas.reload();
      setReviewDraft(null);
      setSimilarRecipeId(null);
      setSimilarRecipeSlug(null);
      setReviewOpen(false);
      setAiPromptInput("");
      router.push(`/recipe/${encodeURIComponent(String(saved.slug || saved.id))}`);
    } catch (error: unknown) {
      // Network or Server disconnect after a write request may mean it saved:
      // never re-submit an ambiguous write and create duplicates.
      if (requestStarted) {
        setPublishUncertain(true);
        setPublishError("Tarif kaydedilmiş olabilir. Yeni istek göndermeden önce Profil > Tariflerim bölümünü kontrol et.");
      } else {
        setPublishError(error instanceof Error ? error.message : "Tarif yayımlanamadı.");
      }
    } finally {
      quickPublishInFlightRef.current = false;
      setIsPublishing(false);
    }
  };

  const handleGenerateRecipe = async () => {
    if (quickCreateInFlightRef.current || quickPublishInFlightRef.current || isPublishing) return;
    const token = user?.token;
    if (!token) {
      showModalMessage("error", "Tarif oluşturmak için giriş yapmalısın.");
      return;
    }
    if (reviewDraft) {
      if (similarRecipeId) setReviewOpen(true);
      else if (!publishUncertain) await publishGeneratedRecipe(reviewDraft, token);
      return; // Never incur a second AI charge for an existing candidate.
    }
    const searchTerm = aiPromptInput.trim() || query.trim();
    if (!searchTerm) {
      setShowPromptModal(true);
      return;
    }

    quickCreateInFlightRef.current = true;
    setIsGenerating(true);
    setLoadingMsgIndex(0);
    setPublishError("");
    try {
      // Fail closed: expensive AI request needs both generation and publication quota.
      let fresh;
      try { fresh = await fetchAccountQuotas(token); }
      catch {
        showModalMessage("error", "Kullanım hakların şu anda kontrol edilemiyor. Lütfen tekrar dene.");
        return;
      }
      if (quotaReached(fresh, "recipe_day") || quotaReached(fresh, "recipe_ai_day")) {
        const key = quotaReached(fresh, "recipe_day") ? "recipe_day" : "recipe_ai_day";
        showModalMessage("error", "Günlük tarif oluşturma hakkın doldu. Yeni hak: " + quotaReset(fresh, key));
        return;
      }
      const aiResponse = await generateRecipeClient(token, searchTerm);
      void quotas.reload();
      setUsageNotice("AI tarif oluşturma denemen kullanıldı. Güncel hakların Profil'de.");
      if (!aiResponse.success || !aiResponse.recipe) {
        showModalMessage("error", aiResponse.message || "Yapay zekâ yanıt veremedi.");
        return;
      }
      const draft = quickRecipeFromAI(aiResponse.recipe);
      setReviewDraft(draft); // Keep the paid-for candidate for safe retries.
      const existingId = aiResponse.existing_recipe_id;
      const duplicateId = typeof existingId === "number" && Number.isSafeInteger(existingId) && existingId > 0
        ? existingId : null;
      setSimilarRecipeId(duplicateId);
      setSimilarRecipeSlug(typeof aiResponse.existing_recipe_slug === "string"
        && aiResponse.existing_recipe_slug.trim() ? aiResponse.existing_recipe_slug.trim() : null);
      setPublishUncertain(false);
      if (duplicateId) {
        // Duplicates require an explicit choice; no extra AI call on either option.
        setReviewOpen(true);
      } else {
        await publishGeneratedRecipe(draft, token);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Tarif oluşturulamadı.";
      showModalMessage("error", message.toLowerCase().includes("billing")
        ? "AI bütçe sınırına ulaşıldı. Lütfen sonra tekrar dene." : message);
    } finally {
      quickCreateInFlightRef.current = false;
      setIsGenerating(false);
    }
  };

  const handlePublishQuickRecipe = async () => {
    if (!reviewDraft || !user?.token) return;
    await publishGeneratedRecipe(reviewDraft, user.token);
  };

  const handleNewQuickRecipe = () => {
    if (isPublishing || quickCreateInFlightRef.current) return;
    setReviewDraft(null);
    setSimilarRecipeId(null);
    setSimilarRecipeSlug(null);
    setPublishUncertain(false);
    setPublishError("");
    setReviewOpen(false);
    setAiPromptInput("");
    setShowPromptModal(true);
  };

  const handlePromptModalSubmit = () => {
    if (!aiPromptInput.trim() || quickCreateInFlightRef.current || isPublishing) return;
    setShowPromptModal(false);
    void handleGenerateRecipe();
  };

  const renderFilterGroup = (title: string, items: string[], current: string[], setFn: (val: string[]) => void, sectionKey: string) => {
    if (!items || items.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];
    const visibleItems = isExpanded ? items : items.slice(0, 5);
    const hasMore = items.length > 5;
    return (
      <fieldset className="border-b border-gray-100 py-5 first:pt-0 last:border-0 last:pb-0">
        <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">{title}</legend>
        <div className="space-y-0.5">
          {visibleItems.map((item) => {
            const checked = current.includes(item);
            return (
              <label key={item} className="-mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-gray-50">
                <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggleFilter(item, current, setFn)} />
                <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 ${checked ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white'}`}>
                  {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className={`text-sm ${checked ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{item}</span>
              </label>
            );
          })}
        </div>
        {hasMore && (
          <button type="button" onClick={() => toggleSection(sectionKey)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark">
            {isExpanded ? <><Minus className="h-3 w-3" /> Daha az</> : <><Plus className="h-3 w-3" /> {items.length - 5} tane daha</>}
          </button>
        )}
      </fieldset>
    );
  };

  const anyFilter = selectedCuisines.length > 0 || selectedDiets.length > 0 || selectedMealTypes.length > 0 || selectedDifficulties.length > 0 || !!query;
  const clearFilters = () => { setQuery(""); setSelectedCuisines([]); setSelectedDiets([]); setSelectedMealTypes([]); setSelectedDifficulties([]); };
  const activeChips = [
    ...selectedMealTypes.map(v => ({ v, remove: () => setSelectedMealTypes(selectedMealTypes.filter(x => x !== v)) })),
    ...selectedCuisines.map(v => ({ v, remove: () => setSelectedCuisines(selectedCuisines.filter(x => x !== v)) })),
    ...selectedDiets.map(v => ({ v, remove: () => setSelectedDiets(selectedDiets.filter(x => x !== v)) })),
    ...selectedDifficulties.map(v => ({ v, remove: () => setSelectedDifficulties(selectedDifficulties.filter(x => x !== v)) })),
  ];

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6">
      {usageNotice && <div role="status" className="fixed bottom-6 right-6 z-[210] max-w-sm rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-xl">{usageNotice}</div>}

        <div className="mb-8 flex flex-col gap-4 border-b border-gray-100 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
                <nav aria-label="Sayfa konumu" className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Link href="/" className="transition hover:text-brand">Anasayfa</Link>
                  <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden />
                  <span className="font-medium text-slate-700">Tarifler</span>
                </nav>
                <h1 className="font-heading text-3xl font-bold tracking-[-0.02em] text-slate-900 sm:text-4xl">Tarifler</h1>
                {!loading && recipes.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500 tabular-nums">{recipes.length} tarif gösteriliyor</p>
                )}
            </div>
            <button type="button" onClick={() => setShowMobileFilters(!showMobileFilters)} aria-expanded={showMobileFilters}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-gray-300 lg:hidden">
              <SlidersHorizontal className="h-4 w-4" aria-hidden /> {showMobileFilters ? "Filtreleri gizle" : "Ara ve filtrele"}
            </button>
        </div>

        <div className="relative flex flex-col gap-8 lg:flex-row lg:gap-10">
            <aside className={`w-full flex-shrink-0 lg:block lg:w-64 ${showMobileFilters ? 'block' : 'hidden'}`}>
                <div className="space-y-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                        <label htmlFor="recipes-search" className="sr-only">Tariflerde ara</label>
                        <input id="recipes-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tariflerde ara"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm text-slate-800 transition focus:border-brand/40 focus:outline-none focus:ring-4 focus:ring-brand/10" />
                    </div>
                    <div>
                        {renderFilterGroup("Öğün", availableFilters.mealType, selectedMealTypes, setSelectedMealTypes, "mealType")}
                        {renderFilterGroup("Mutfak", availableFilters.cuisine, selectedCuisines, setSelectedCuisines, "cuisine")}
                        {renderFilterGroup("Beslenme", availableFilters.diet, selectedDiets, setSelectedDiets, "diet")}
                        {renderFilterGroup("Zorluk", availableFilters.difficulty, selectedDifficulties, setSelectedDifficulties, "difficulty")}
                    </div>
                </div>
            </aside>

            <section aria-label="Tarif listesi" className="min-h-[500px] flex-1">
                {anyFilter && (
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                    {query && (
                      <button type="button" onClick={() => setQuery("")} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 hover:border-gray-300">
                        “{query}” <X className="h-3.5 w-3.5 text-gray-400" aria-label="Aramayı kaldır" />
                      </button>
                    )}
                    {activeChips.map(({ v, remove }) => (
                      <button key={v} type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 hover:border-gray-300">
                        {v} <X className="h-3.5 w-3.5 text-gray-400" aria-label={`${v} filtresini kaldır`} />
                      </button>
                    ))}
                    <button type="button" onClick={clearFilters} className="ml-1 text-xs font-semibold text-brand hover:text-brand-dark">Temizle</button>
                  </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((i) => <RecipeSkeleton key={i} />)}</div>
                ) : recipes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
                        <RecipeAICard query={query} generating={isGenerating} loadingMessage={LOADING_MESSAGES[loadingMsgIndex]} reviewReady={!!reviewDraft} saving={isPublishing} uncertain={publishUncertain} failure={publishError && !reviewOpen ? publishError : ""} onNew={handleNewQuickRecipe} onGenerate={() => void handleGenerateRecipe()} />
                    </div>
                ) : (
                    <div className="mx-auto max-w-md">
                      <p className="mb-4 text-center text-sm text-gray-500">{anyFilter ? "Bu arama ve filtrelerle eşleşen tarif yok." : "Henüz tarif yok."}</p>
                      <RecipeAICard query={query} generating={isGenerating} loadingMessage={LOADING_MESSAGES[loadingMsgIndex]} reviewReady={!!reviewDraft} saving={isPublishing} uncertain={publishUncertain} failure={publishError && !reviewOpen ? publishError : ""} onNew={handleNewQuickRecipe} onGenerate={() => void handleGenerateRecipe()} />
                    </div>
                )}

                {hasMore && recipes.length > 0 && !loadingMore && (
                    <div className="mt-12 text-center">
                        <button type="button" onClick={() => fetchRecipes(true)} className="h-11 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-gray-300">
                            Daha fazla tarif
                        </button>
                    </div>
                )}
                {loadingMore && <p className="mt-12 text-center text-sm text-gray-500">Yükleniyor…</p>}
            </section>
        </div>

        {/* AI prompt appears only after an explicit user action; no overlapping automatic modal. */}
        {showPromptModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowPromptModal(false)} />
            <div role="dialog" aria-modal="true" aria-labelledby="ai-prompt-title" className="relative z-10 w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
              <button type="button" onClick={() => setShowPromptModal(false)} aria-label="Kapat"
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">AI ile oluştur</p>
              <h3 id="ai-prompt-title" className="mt-2 font-heading text-2xl font-bold text-slate-900">Ne pişirmek istersin?</h3>
              <p className="mt-1 text-sm text-gray-500">Bir tarif adı yaz veya elindeki malzemeleri listele</p>

              <div className="mt-6 space-y-4">
                <label htmlFor="ai-prompt" className="sr-only">Tarif adı ya da malzemeler</label>
                <input
                  id="ai-prompt"
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="Örn. fırında tavuk ya da domates, peynir, makarna"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-[15px] transition focus:border-brand/40 focus:outline-none focus:ring-4 focus:ring-brand/10"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && aiPromptInput.trim()) {
                      handlePromptModalSubmit();
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map(suggestion => (
                    <button type="button" key={suggestion} onClick={() => setAiPromptInput(suggestion)}
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-slate-600 transition hover:border-gray-300 hover:text-slate-900">
                      {suggestion}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={handlePromptModalSubmit} disabled={!aiPromptInput.trim() || isGenerating}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
                  {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Hazırlanıyor…</> : "Tarif oluştur"}
                </button>
              </div>
            </div>
          </div>
        )}

        {reviewOpen && reviewDraft && similarRecipeId && (
          <SimilarRecipeChoice
            title={reviewDraft.title}
            existingRecipeId={similarRecipeId}
            existingRecipeSlug={similarRecipeSlug}
            saving={isPublishing}
            uncertain={publishUncertain}
            error={publishError}
            onCreate={() => void handlePublishQuickRecipe()}
            onClose={() => { if (!isPublishing) setReviewOpen(false); }}
          />
        )}
                {/* HATA MODALI */}
        {modal.show && (
            <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-[200] flex items-center justify-center sm:w-[360px]">
               <div className="relative w-full rounded-2xl border border-[#f1d2c7] bg-white p-5 shadow-2xl">
                   <button type="button" aria-label="Kapat" onClick={() => setModal({ ...modal, show: false })} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                   <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 text-lg ${modal.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                      {modal.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                   </div>
                   <h3 className="text-sm font-bold text-slate-900 mb-1">{modal.type === 'success' ? 'Başarılı!' : 'Hata'}</h3>
                   <p className="text-xs leading-5 text-gray-500">{modal.message}</p>
                   
               </div>
            </div>
        )}
    </div>
  );
}

// DÜZELTME: Suspense boundary ile sarmalanmış export
const RecipesPage = () => {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl p-4 text-center text-sm text-gray-500">Yükleniyor…</div>}>
      <RecipesContent />
    </Suspense>
  );
};

export default RecipesPage;