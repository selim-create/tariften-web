"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { getRecipes, getTerms } from "@/lib/api";
import { generateRecipeClient, createRecipeClient } from "@/lib/recipe-write-client"; 
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAccountQuotas, fetchAccountQuotas, quotaReached, quotaReset } from "@/lib/account-quotas-client";
import QuickRecipeReview from "@/components/recipes/QuickRecipeReview";
import { approvedQuickRecipe, quickRecipeFromAI, validateQuickRecipe, type QuickRecipeDraft } from "@/lib/quick-recipe-review";
// İkonlar - Standart ve Yeni Paket Ayrımı (Hata Önleyici)
import { FaSortAmountDown } from "react-icons/fa";
import { 
  FaClock, FaFire, FaFilter, FaChevronRight, 
  FaMagnifyingGlass, FaUtensils, FaLeaf, FaWandMagicSparkles, FaSpinner, FaRobot,
  FaCheck, FaXmark, FaGlobe, FaPlus, FaMinus
} from "react-icons/fa6";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

const LOADING_MESSAGES = [
  "Şef malzemeleri kokluyor... 👃",
  "Eski tarif defterleri karıştırılıyor... 📖",
  "Sanal fırın ısıtılıyor... 🔥",
  "Lezzet testi yapılıyor... 👨‍🍳",
  "Tuzuna bakılıyor... 🧂",
  "Sunum tabağı hazırlanıyor... 🍽️",
  "En iyi kombinasyon hesaplanıyor... 🧮"
];

const QUICK_SUGGESTIONS = [
  'Pratik makarna',
  'Tavuklu salata',
  'Çikolatalı tatlı',
  'Mercimek çorbası'
];

function RecipeSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-5 space-y-3 flex-grow">
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="mt-auto pt-4 flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

function RecipeAICard({
  query, generating, loadingMessage, reviewReady, onGenerate,
}: {
  query: string;
  generating: boolean;
  loadingMessage: string;
  reviewReady: boolean;
  onGenerate: () => void;
}) {
  return (
    <div className="relative flex min-h-[275px] flex-col items-center justify-center overflow-hidden rounded-[28px] border border-[#e9d9cd] bg-[#fff7f0] p-7 text-center shadow-[0_18px_46px_-34px_rgba(79,46,35,0.3)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fde7df] text-2xl text-[#d64c3f]">
        {generating ? <FaSpinner className="animate-spin" /> : <FaWandMagicSparkles />}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.17em] text-[#b95346]">Tariften · AI Şef</p>
      <h3 className="mt-2 font-heading text-xl font-extrabold text-[#25353a]">Aradığın tarif burada yok mu?</h3>
      <p className="mt-2 mb-6 max-w-sm text-sm leading-6 text-[#7f7167]">
        {generating ? loadingMessage : `"${query || "Özel"}" için sıfırdan tarif oluşturabiliriz.`}
      </p>
      <button type="button" onClick={onGenerate} disabled={generating}
        className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-[#db4c3f] px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#b64137] disabled:opacity-60">
        {generating ? "Tarif hazırlanıyor…" : reviewReady ? "Tarif önizlemene dön" : "AI ile tarif oluştur"}
      </button>
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

  // AI OLUŞTURMA — one request at a time, with a mandatory fresh quota check.
  const handleGenerateRecipe = async () => {
    // The ref is set before the first await: repeated taps cannot create two
    // paid AI jobs even before React has rendered the loading state.
    if (quickCreateInFlightRef.current) return;
    if (reviewDraft) {
      setReviewOpen(true); // Reopen the already paid-for candidate instead of charging again.
      return;
    }
    const token = user?.token;
    if (!token) {
      showModalMessage("error", "Tarif oluşturmak için giriş yapmalısın.");
      return;
    }

    const searchTerm = aiPromptInput.trim() || query.trim();
    if (!searchTerm) {
      setShowPromptModal(true);
      return;
    }

    quickCreateInFlightRef.current = true;
    setIsGenerating(true);
    setLoadingMsgIndex(0);
    try {
      // If account rights cannot be verified, do not start a billable request.
      let fresh;
      try {
        fresh = await fetchAccountQuotas(token);
      } catch {
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
        showModalMessage("error", "Yapay zekâ yanıt veremedi.");
        return;
      }

      // Core /ai/generate returns an *unsaved* candidate. Only a separate,
      // user-triggered review action may send it to /recipes/create.
      const candidate = quickRecipeFromAI(aiResponse.recipe);
      setReviewDraft(candidate);
      setSimilarRecipeId(Number.isSafeInteger(aiResponse.existing_recipe_id) && aiResponse.existing_recipe_id > 0
        ? aiResponse.existing_recipe_id : null);
      setPublishError("");
      setPublishUncertain(false);
      setReviewOpen(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Tarif oluşturulamadı.";
      showModalMessage("error", message.toLowerCase().includes("billing")
        ? "AI bütçe sınırına ulaşıldı. Lütfen sonra tekrar deneyin."
        : message);
    } finally {
      quickCreateInFlightRef.current = false;
      setIsGenerating(false);
    }
  };

  const handlePublishQuickRecipe = async () => {
    if (quickPublishInFlightRef.current || isPublishing || publishUncertain || !reviewDraft) return;
    const problem = validateQuickRecipe(reviewDraft);
    if (problem) { setPublishError(problem); return; }
    const token = user?.token;
    if (!token) { setPublishError("Tarifini yayımlamak için giriş yapmalısın."); return; }
    quickPublishInFlightRef.current = true;
    setIsPublishing(true);
    setPublishError("");
    let requestStarted = false;
    try {
      let fresh;
      try {
        fresh = await fetchAccountQuotas(token);
      } catch {
        setPublishError("Kullanım hakların doğrulanamadı. Tarifin burada korunuyor; birazdan tekrar dene.");
        return;
      }
      if (quotaReached(fresh, "recipe_day")) {
        setPublishError("Bugünkü tarif yayımlama hakkın doldu. Yeni hak: " + quotaReset(fresh, "recipe_day"));
        return;
      }
      const approved = approvedQuickRecipe(reviewDraft);
      requestStarted = true;
      const saved = await createRecipeClient(token, approved);
      if (!saved?.success || !(saved.slug || saved.id)) {
        setPublishError(saved?.message || "Tarif yayımlanamadı.");
        return;
      }
      void quotas.reload();
      setAiPromptInput("");
      router.push(`/recipe/${saved.slug || saved.id}`);
    } catch {
      if (requestStarted) setPublishUncertain(true);
      else setPublishError("Tarif yayımlama kontrolü tamamlanamadı.");
    } finally {
      setIsPublishing(false);
      quickPublishInFlightRef.current = false;
    }
  };

  const handleNewQuickRecipe = () => {
    if (isPublishing || quickCreateInFlightRef.current) return;
    setReviewDraft(null);
    setSimilarRecipeId(null);
    setPublishUncertain(false);
    setPublishError("");
    setReviewOpen(false);
    setAiPromptInput("");
    setShowPromptModal(true);
  };

  // The prompt is kept for retries; the catalogue search remains independent.
  const handlePromptModalSubmit = () => {
    if (!aiPromptInput.trim() || quickCreateInFlightRef.current) return;
    setShowPromptModal(false);
    void handleGenerateRecipe();
  };

  const renderFilterGroup = (title: string, icon: React.ReactNode, items: string[], current: string[], setFn: (val: string[]) => void, sectionKey: string) => {
    if (!items || items.length === 0) return null;
    const isExpanded = expandedSections[sectionKey];
    const visibleItems = isExpanded ? items : items.slice(0, 5);
    const hasMore = items.length > 5;
    return (
      <div className="border-b border-gray-100 pb-6 mb-6 last:border-0 last:pb-0">
        <h3 className="font-bold text-slate-800 mb-4 font-heading text-sm uppercase tracking-wide flex items-center gap-2">{icon} {title}</h3>
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 p-2 rounded-lg -ml-2 transition">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${current.includes(item) ? 'bg-[#db4c3f] border-[#db4c3f]' : 'border-gray-300 bg-white'}`}>
                {current.includes(item) && <FaCheck className="text-white text-[10px]" />}
              </div>
              <input type="checkbox" className="hidden" checked={current.includes(item)} onChange={() => toggleFilter(item, current, setFn)} />
              <span className={`text-sm group-hover:text-[#db4c3f] transition ${current.includes(item) ? 'font-bold text-[#db4c3f]' : 'text-gray-600'}`}>{item}</span>
            </label>
          ))}
        </div>
        {hasMore && (
          <button onClick={() => toggleSection(sectionKey)} className="text-xs font-bold text-[#db4c3f] mt-3 flex items-center gap-1 hover:underline">
            {isExpanded ? <><FaMinus /> Daha Az</> : <><FaPlus /> Daha Fazla ({items.length - 5})</>}
          </button>
        )}
      </div>
    );
  };



  return (
    <div className="container mx-auto px-4 py-8 relative">
      {usageNotice && <div role="status" className="fixed bottom-6 right-6 z-[210] max-w-sm rounded-2xl bg-[#253b30] px-5 py-3 text-xs font-bold text-white shadow-xl">{usageNotice}</div>}
        {/* HEADER */}
        {/* MOBİL DÜZELTME: items-end yerine items-start */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
            <div>
                <nav className="flex items-center text-xs text-gray-400 mb-2 font-medium gap-2"><Link href="/" className="hover:text-[#db4c3f]">Anasayfa</Link><FaChevronRight className="text-[10px]" /><span className="text-gray-800">Tarifler</span></nav>
                <h1 className="text-3xl font-bold text-slate-900 font-heading">Tarif Kütüphanesi</h1>
                <p className="text-gray-500 text-sm mt-1">Toplam <strong className="text-[#db4c3f]">{recipes.length}</strong> tarif listeleniyor.</p>
            </div>
            <button onClick={() => setShowMobileFilters(!showMobileFilters)} className="md:hidden w-full bg-white border border-gray-200 text-slate-700 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50"><FaFilter className="text-[#db4c3f]" /> Filtrele</button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative">
            <aside className={`lg:block w-full lg:w-1/4 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden'}`}>
                <div className="sticky top-24 space-y-8 pr-0 lg:pr-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400"><FaMagnifyingGlass /></div>
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tarif ara..." className="w-full bg-white border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#db4c3f] transition-colors shadow-sm" />
                    </div>
                    <div className="bg-white/50 rounded-2xl border border-gray-100 p-4 shadow-sm">
                        {renderFilterGroup("Öğün Tipi", <FaUtensils className="text-[#db4c3f]"/>, availableFilters.mealType, selectedMealTypes, setSelectedMealTypes, "mealType")}
                        {renderFilterGroup("Mutfak", <FaGlobe className="text-blue-500"/>, availableFilters.cuisine, selectedCuisines, setSelectedCuisines, "cuisine")}
                        {renderFilterGroup("Diyet", <FaLeaf className="text-green-500"/>, availableFilters.diet, selectedDiets, setSelectedDiets, "diet")}
                        {renderFilterGroup("Zorluk", <FaFire className="text-orange-500"/>, availableFilters.difficulty, selectedDifficulties, setSelectedDifficulties, "difficulty")}
                    </div>
                </div>
            </aside>

            <section className="flex-1 min-h-[500px]">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        {(selectedCuisines.length > 0 || selectedDiets.length > 0 || selectedMealTypes.length > 0 || selectedDifficulties.length > 0 || query) ? (
                            <>
                                <span className="text-xs font-bold text-gray-400 mr-1">Filtreler:</span>
                                {query && <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">"{query}" <button onClick={() => setQuery("")}><FaXmark/></button></span>}
                                {selectedCuisines.map(c => <span key={c} className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-100">{c}</span>)}
                                {selectedDiets.map(d => <span key={d} className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded border border-green-100">{d}</span>)}
                                <button onClick={() => { setQuery(""); setSelectedCuisines([]); setSelectedDiets([]); setSelectedMealTypes([]); setSelectedDifficulties([]); }} className="text-xs text-red-500 font-bold hover:underline ml-2">Temizle</button>
                            </>
                        ) : ( <span className="text-sm text-gray-400 font-medium">Tüm tarifler listeleniyor</span> )}
                    </div>
                    <div className="flex items-center gap-2"><FaSortAmountDown className="text-gray-400 text-sm" /><select className="bg-transparent text-slate-700 text-sm font-bold focus:outline-none cursor-pointer"><option>En Yeniler</option><option>Popüler</option></select></div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <RecipeSkeleton key={i} />)}</div>
                ) : recipes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recipes.map((recipe) => (
                            <Link href={`/recipe/${recipe.slug}`} key={recipe.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                                    {isPlaceholderImage(recipe.image) ? (
                                        <ImagePlaceholder title={recipe.title} variant="card" />
                                    ) : (
                                        <div className="relative w-full h-full">
                                            {/* GÖRSEL DÜZELTME: Image bileşeni ve unoptimized */}
                                            <Image 
                                                src={recipe.image} 
                                                alt={recipe.title} 
                                                fill
                                                unoptimized={true}
                                                className="object-cover group-hover:scale-105 transition duration-700" 
                                            />
                                        </div>
                                    )}
                                    {recipe.cuisine?.[0] && <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-slate-700 shadow-sm">{recipe.cuisine[0]}</span>}
                                </div>
                                <div className="p-5 flex flex-col flex-grow">
                                    <h2 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-[#db4c3f] transition font-heading line-clamp-2">{recipe.title}</h2>
                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1"><FaClock className="text-[#db4c3f]" /> {recipe.prep_time || 0}dk</span>
                                            <span className="flex items-center gap-1"><FaFire className="text-[#db4c3f]" /> {recipe.calories}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        
                        {/* SENARYO 2: SONUÇLARIN SONUNA AI KARTI EKLE */}
                        <RecipeAICard query={query} generating={isGenerating} loadingMessage={LOADING_MESSAGES[loadingMsgIndex]} reviewReady={!!reviewDraft} onGenerate={() => void handleGenerateRecipe()} />
                        
                    </div>
                ) : (
                    // SONUÇ YOKSA SADECE AI KARTI
                    <div className="flex justify-center">
                        <div className="w-full max-w-md"><RecipeAICard query={query} generating={isGenerating} loadingMessage={LOADING_MESSAGES[loadingMsgIndex]} reviewReady={!!reviewDraft} onGenerate={() => void handleGenerateRecipe()} /></div>
                    </div>
                )}
                
                {/* DAHA FAZLA YÜKLE BUTONU */}
                {hasMore && recipes.length > 0 && !loadingMore && (
                    <div className="mt-10 text-center">
                        <button onClick={() => fetchRecipes(true)} className="px-8 py-3 bg-white border border-gray-200 text-slate-600 font-bold rounded-xl hover:bg-gray-50 hover:text-brand transition shadow-sm">
                            Daha Fazla Yükle
                        </button>
                    </div>
                )}
                {loadingMore && <div className="mt-10 text-center text-gray-400">Yükleniyor...</div>}

            </section>
        </div>

        {/* AI prompt appears only after an explicit user action; no overlapping automatic modal. */}
        {showPromptModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-[#1e2932]/60" 
              onClick={() => setShowPromptModal(false)}
            ></div>
            <div className="relative z-10 bg-[#fffaf6] rounded-[28px] p-7 w-full max-w-md border border-[#efded0] shadow-[0_28px_90px_rgba(25,28,33,0.25)]">
              <button 
                onClick={() => setShowPromptModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              >
                <FaXmark className="text-xl"/>
              </button>
              
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#db4c3f]/20 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaWandMagicSparkles className="text-4xl text-[#db4c3f]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 font-heading">AI Şef&apos;e Sor!</h3>
                <p className="text-gray-500">Bir tarif adı yaz veya elindeki malzemeleri listele</p>
              </div>
              
              <div className="space-y-4">
                <input 
                  type="text"
                  value={aiPromptInput}
                  onChange={(e) => setAiPromptInput(e.target.value)}
                  placeholder="Örn: Fırında tavuk veya domates, peynir, makarna..."
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 focus:border-[#db4c3f] focus:ring-4 focus:ring-[#db4c3f]/10 outline-none text-lg transition"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && aiPromptInput.trim()) {
                      handlePromptModalSubmit();
                    }
                  }}
                />
                
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-gray-400">Hızlı öneriler:</span>
                  {QUICK_SUGGESTIONS.map(suggestion => (
                    <button 
                      key={suggestion}
                      onClick={() => setAiPromptInput(suggestion)}
                      className="text-xs bg-gray-100 hover:bg-[#db4c3f]/10 text-gray-600 hover:text-[#db4c3f] px-3 py-1.5 rounded-full transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={handlePromptModalSubmit}
                  disabled={!aiPromptInput.trim() || isGenerating}
                  className="w-full bg-[#db4c3f] hover:bg-[#b03d32] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#db4c3f]/20"
                >
                  {isGenerating ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Hazırlanıyor...
                    </>
                  ) : (
                    <>
                      <FaWandMagicSparkles />
                      Tarif Oluştur
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {reviewOpen && reviewDraft && (
          <QuickRecipeReview
            draft={reviewDraft}
            setDraft={setReviewDraft}
            existingRecipeId={similarRecipeId}
            cuisineOptions={availableFilters.cuisine}
            mealOptions={availableFilters.mealType}
            saving={isPublishing}
            uncertain={publishUncertain}
            error={publishError}
            onPublish={() => { void handlePublishQuickRecipe(); }}
            onClose={() => setReviewOpen(false)}
            onNew={handleNewQuickRecipe}
          />
        )}
                {/* HATA MODALI */}
        {modal.show && (
            <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-[200] flex items-center justify-center sm:w-[360px]">
               <div className="relative w-full rounded-2xl border border-[#f1d2c7] bg-white p-5 shadow-2xl">
                   <button onClick={() => setModal({ ...modal, show: false })} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><FaXmark className="text-xl"/></button>
                   <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 text-lg ${modal.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                      {modal.type === 'success' ? <FaCheck /> : <FaXmark />}
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
    <Suspense fallback={<div className="container mx-auto p-4 text-center">Yükleniyor...</div>}>
      <RecipesContent />
    </Suspense>
  );
};

export default RecipesPage;