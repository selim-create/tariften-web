"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { getRecipes, generateAIRecipe, createRecipe, getTerms } from "@/lib/api"; 
import { Recipe } from "@/types";
import { useAuth } from "@/context/AuthContext";
// İkonlar - Standart ve Yeni Paket Ayrımı (Hata Önleyici)
import { FaSortAmountDown } from "react-icons/fa";
import { 
  FaClock, FaFire, FaFilter, FaChevronRight, 
  FaMagnifyingGlass, FaUtensils, FaLeaf, FaWandMagicSparkles, FaSpinner, FaRobot,
  FaCheck, FaXmark, FaGlobe, FaPlus, FaMinus
} from "react-icons/fa6";

const LOADING_MESSAGES = [
  "Şef malzemeleri kokluyor... 👃",
  "Eski tarif defterleri karıştırılıyor... 📖",
  "Sanal fırın ısıtılıyor... 🔥",
  "Lezzet testi yapılıyor... 👨‍🍳",
  "Tuzuna bakılıyor... 🧂",
  "Sunum tabağı hazırlanıyor... 🍽️",
  "En iyi kombinasyon hesaplanıyor... 🧮"
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

function RecipesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // AI Modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
      
      // Sonuç hiç yoksa AI Modalını aç (Sadece ilk aramada ve yükleme değilken)
      if (!isLoadMore && newRecipes.length === 0 && query.trim() !== "") {
        setShowAIModal(true);
      } else {
        setShowAIModal(false);
      }

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

  // AI OLUŞTURMA
  const handleGenerateRecipe = async () => {
    if (!user || !user.token) { showModalMessage('error', "AI Şef'i kullanmak için lütfen giriş yapın."); return; } // Token kontrolü eklendi
    if (!query) return;
    setIsGenerating(true);
    setLoadingMsgIndex(0);
    try {
        const aiResponse = await generateAIRecipe(user.token, query);
        if (aiResponse.success && aiResponse.recipe) {
            const saveResponse = await createRecipe(user.token, aiResponse.recipe);
            if (saveResponse.success) {
                const redirectTarget = saveResponse.slug || saveResponse.id;
                router.push(`/recipe/${redirectTarget}`); 
            } else showModalMessage('error', "Kaydedilemedi.");
        } else showModalMessage('error', "Yapay zeka yanıt veremedi.");
    } catch (error: any) {
        const errorMsg = error.message?.toLowerCase() || "";
        if (errorMsg.includes("quota") || errorMsg.includes("billing")) showModalMessage('error', "Şefimiz şu an aşırı yoğun 👨‍🍳 Lütfen sonra tekrar deneyin.");
        else showModalMessage('error', "Bir sorun oluştu.");
    } finally { setIsGenerating(false); }
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

  // --- AI KARTI BİLEŞENİ ---
  const AICard = () => (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] border border-slate-700 shadow-xl group hover:scale-[1.02] transition-transform duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#db4c3f] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 text-3xl text-[#db4c3f] border border-white/10 animate-pulse">
            {isGenerating ? <FaSpinner className="animate-spin" /> : <FaRobot />}
        </div>
        <h3 className="text-xl font-bold text-white mb-2 font-heading">Aradığın Burada Yok mu?</h3>
        <p className="text-slate-400 text-sm mb-6 font-light">
           {isGenerating ? LOADING_MESSAGES[loadingMsgIndex] : `"${query || 'Özel'}" tarifini senin için sıfırdan yaratabilirim.`}
        </p>
        <button 
          onClick={handleGenerateRecipe}
          disabled={isGenerating}
          className="w-full bg-[#db4c3f] hover:bg-[#b03d32] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#db4c3f]/20 disabled:opacity-70"
        >
           {isGenerating ? "Hazırlanıyor..." : <><FaWandMagicSparkles /> AI ile Oluştur</>}
        </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 relative">
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
                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tarif ara..." className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#db4c3f] focus:border-transparent shadow-sm" />
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
                                    <div className="relative w-full h-full">
                                        {/* GÖRSEL DÜZELTME: Image bileşeni ve unoptimized */}
                                        <Image 
                                            src={recipe.image || "/placeholder.jpg"} 
                                            alt={recipe.title} 
                                            fill
                                            unoptimized={true}
                                            className="object-cover group-hover:scale-105 transition duration-700" 
                                        />
                                    </div>
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
                        <AICard />
                        
                    </div>
                ) : (
                    // SONUÇ YOKSA SADECE AI KARTI
                    <div className="flex justify-center">
                        <div className="w-full max-w-md"><AICard /></div>
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

        {/* MODAL (Otomatik Açılan) */}
        {showAIModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAIModal(false)}></div>
                <div className="relative z-10 w-full max-w-lg">
                    <AICard /> {/* Modalı AI Kartı ile doldur */}
                    <button onClick={() => setShowAIModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><FaXmark className="text-2xl"/></button>
                </div>
            </div>
        )}
        
        {/* HATA MODALI */}
        {modal.show && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
               <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center relative">
                   <button onClick={() => setModal({ ...modal, show: false })} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaXmark className="text-xl"/></button>
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl ${modal.type === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                      {modal.type === 'success' ? <FaCheck /> : <FaXmark />}
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-2">{modal.type === 'success' ? 'Başarılı!' : 'Hata'}</h3>
                   <p className="text-gray-500 mb-6">{modal.message}</p>
                   <button onClick={() => setModal({ ...modal, show: false })} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition">Tamam</button>
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