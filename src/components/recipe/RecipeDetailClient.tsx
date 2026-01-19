import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  FaCheck, FaLightbulb, FaThumbsUp, FaXmark, FaClock, FaFire, FaArrowRight, FaHeart, FaCircleUser, FaStar
} from "react-icons/fa6";
import { Recipe, Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toggleInteraction, getRecipes, checkInteractionStatus, getComments, addComment, deleteComment, toggleCommentLike, getRecipeRating, getUserRating, submitRating } from "@/lib/api";
import { getRandomChefTip } from "@/lib/chefTips";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

// Helper: Tahmini porsiyon ağırlığı hesapla
const WEIGHT_PER_PIECE = 50; // Malzeme adedi başına ortalama gram
const DEFAULT_WEIGHT_FACTOR = 30; // Bilinmeyen birimler için varsayılan gram
const calculateEstimatedWeight = (recipe: Recipe): number => {
  // Malzeme miktarlarından tahmini hesaplama
  if (!recipe.ingredients || recipe.ingredients.length === 0) return 250;
  
  let totalWeight = 0;
  recipe.ingredients.forEach(ing => {
    const amount = typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount;
    if (!isNaN(amount)) {
      // Birime göre gram'a çevir
      if (ing.unit === 'gr' || ing.unit === 'g') totalWeight += amount;
      else if (ing.unit === 'kg') totalWeight += amount * 1000;
      else if (ing.unit === 'ml' || ing.unit === 'su bardağı') totalWeight += amount;
      else if (ing.unit === 'adet') totalWeight += amount * WEIGHT_PER_PIECE;
      else totalWeight += amount * DEFAULT_WEIGHT_FACTOR;
    }
  });
  
  const servings = typeof recipe.servings === 'string' ? parseInt(recipe.servings) : recipe.servings || 2;
  return Math.round(totalWeight / servings);
}; 

export default function RecipeDetailClient({ recipe }: { recipe: Recipe }) {
  const { user } = useAuth();
  
  // --- STATE ---
  const [servings, setServings] = useState(typeof recipe.servings === 'string' ? parseInt(recipe.servings) : recipe.servings || 2);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Cooked Count Mantığı
  const [cookedCount, setCookedCount] = useState(0); 
  const [isCooked, setIsCooked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Benzer Tarifler State
  const [similarRecipes, setSimilarRecipes] = useState<Recipe[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);

  // Comment State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Rating State
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);

  // --- INITIALIZATION EFFECT ---
  useEffect(() => {
    // 1. Fake Count Hesapla (Deterministik)
    let baseCount = 0;
    
    if (recipe.created_at) {
      const createdDate = new Date(recipe.created_at);
      const now = new Date();
      const diffHours = Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
      const diffDays = diffHours / 24;
      
      // Seed bazlı deterministic hesaplama (Linear Congruential Generator)
      const seed = recipe.id;
      const hash = (seed * 9301 + 49297) % 233280;
      
      if (diffHours < 3) {
        // İlk 3 saat: 0
        baseCount = 0;
      } else if (diffHours < 24) {
        // 3-24 saat arası: 5-50 arası (her 3 saatte artış)
        const hoursFactor = Math.floor((diffHours - 3) / 3);
        baseCount = Math.min(50, (hash % 15) + (hoursFactor * 5));
      } else if (diffDays < 7) {
        // 1-7 gün arası: 50-300 arası
        const daysFactor = Math.floor(diffDays);
        baseCount = 50 + (hash % 50) + (daysFactor * 30);
      } else if (diffDays < 30) {
        // 7-30 gün arası: 300-1500 arası
        const weeksFactor = Math.floor(diffDays / 7);
        baseCount = 300 + (hash % 200) + (weeksFactor * 200);
      } else {
        // 30+ gün: 1500-5000 arası
        const monthsFactor = Math.floor(diffDays / 30);
        baseCount = 1500 + (hash % 500) + Math.min(monthsFactor * 300, 3500);
      }
      
      // Backend'den gelen gerçek cooked_count varsa ekle
      if (recipe.cooked_count && recipe.cooked_count > 0) {
        baseCount += recipe.cooked_count;
      }
    }
    
    setCookedCount(baseCount);

    // 2. Kullanıcı Etkileşimini Kontrol Et
    async function checkUserStatus() {
        if (user?.token) {
            try {
                const status = await checkInteractionStatus(user.token, recipe.id);
                setIsCooked(status.cooked);
                if (status.cooked) {
                    setCookedCount(prev => prev + 1);
                }
            } catch (e) {
                console.error("Etkileşim kontrolü hatası", e);
            }
        }
    }
    checkUserStatus();

    // 3. Benzer Tarifler
    async function fetchSimilar() {
      try {
        const filters = {
            cuisine: recipe.cuisine, 
        };
        const response = await getRecipes(filters);
        if (response && response.data) {
            const filtered = response.data
                .filter(r => r.id !== recipe.id)
                .slice(0, 2); 
            setSimilarRecipes(filtered);
        }
      } catch (error) {
        console.error("Benzer tarifler hatası:", error);
      } finally {
        setLoadingSimilar(false);
      }
    }
    fetchSimilar();

    // 4. Load Comments - API'den çek
    async function fetchComments() {
      try {
        const response = await getComments(recipe.id, 1, 10);
        if (response.success) {
          setComments(response.comments || []);
          setHasMoreComments((response.pages || 1) > 1);
          setCurrentPage(1);
          setTotalPages(response.pages || 1);
        }
      } catch (error) {
        console.error("Yorumlar yüklenemedi:", error);
        setComments([]); // Hata durumunda boş array
      }
    }
    
    fetchComments();

    // 5. Load Rating
    async function fetchRating() {
      try {
        const response = await getRecipeRating(recipe.id);
        if (response.success) {
          setAverageRating(response.average || 0);
          setRatingCount(response.count || 0);
        }
        
        // Kullanıcının kendi puanını kontrol et
        if (user?.token) {
          const userRatingResponse = await getUserRating(user.token, recipe.id);
          if (userRatingResponse.success && userRatingResponse.rating) {
            setUserRating(userRatingResponse.rating);
            setHasRated(true);
          }
        }
      } catch (error) {
        console.error("Rating yüklenemedi:", error);
      }
    }
    
    fetchRating();

  }, [recipe.id, user?.token]);

  // --- HELPER VALUES ---
  const calories = typeof recipe.calories === 'string' ? parseInt(recipe.calories) : recipe.calories || 450;
  const macros = {
    protein: recipe.nutrition?.protein ? recipe.nutrition.protein + "g" : Math.round(calories * 0.25 / 4) + "g", 
    carbs: recipe.nutrition?.carbs ? recipe.nutrition.carbs + "g" : Math.round(calories * 0.45 / 4) + "g",   
    fat: recipe.nutrition?.fat ? recipe.nutrition.fat + "g" : Math.round(calories * 0.30 / 9) + "g"      
  };

  // Steps Parsing (API string[] veya Step[] dönebiliyor, tipte string[] tanımladık ama kontrol edelim)
  let steps: string[] = [];
  if (recipe.steps && recipe.steps.length > 0) {
    if (typeof recipe.steps[0] === 'object' && recipe.steps[0] !== null && 'content' in recipe.steps[0]) {
        // Eski yapı (Step objesi)
        steps = (recipe.steps as any[]).map(s => s.content);
    } else {
        // Yeni yapı (String array)
        steps = recipe.steps as any as string[];
    }
  } else if (recipe.content) {
    steps = recipe.content
      .replace(/<[^>]*>/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 5);
  }

  // Ingredients Fallback
  const DEMO_INGREDIENTS = [
    { name: "Tavuk Göğsü", amount: 500, unit: "gr" },
    { name: "Mantar", amount: 400, unit: "gr" },
  ];
  const ingredients = (recipe.ingredients && recipe.ingredients.length > 0) 
    ? recipe.ingredients.map(ing => ({
        ...ing,
        amount: typeof ing.amount === 'string' ? parseFloat(ing.amount) : ing.amount
    }))
    : DEMO_INGREDIENTS.map(ing => ({ ...ing, amount: Number(ing.amount) }));

  // Chef tip - dinamik veya default
  const chefTip = recipe.chef_tip || getRandomChefTip(recipe.id);

  // --- HANDLERS ---
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

    if (user.token) {
        try {
            await toggleInteraction(user.token, recipe.id, 'cooked');
        } catch (error) {
            console.error("Pişirme işlemi kaydedilemedi:", error);
        }
    }
  };

  // Comment Handlers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Bugün";
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await addComment(user.token, recipe.id, commentText);
      
      if (response.success && response.comment) {
        setComments(prev => [response.comment, ...prev]);
        setCommentText('');
      }
    } catch (error) {
      console.error("Yorum gönderme hatası:", error);
      alert(error instanceof Error ? error.message : "Yorum gönderilemedi, lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;
    
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;

    try {
      await deleteComment(user.token, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Yorum silme hatası:", error);
      alert(error instanceof Error ? error.message : "Yorum silinemedi, lütfen tekrar deneyin.");
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!user) {
      alert("Beğenmek için giriş yapmalısınız.");
      return;
    }

    try {
      const response = await toggleCommentLike(user.token, commentId);
      
      if (response.success) {
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { ...c, likes: response.likes }
            : c
        ));
      }
    } catch (error) {
      console.error("Beğeni hatası:", error);
    }
  };

  const loadMoreComments = async () => {
    if (currentPage >= totalPages) return;
    
    try {
      const nextPage = currentPage + 1;
      const response = await getComments(recipe.id, nextPage, 10);
      
      if (response.success) {
        setComments(prev => [...prev, ...(response.comments || [])]);
        setCurrentPage(nextPage);
        setHasMoreComments(nextPage < (response.pages || 1));
      }
    } catch (error) {
      console.error("Daha fazla yorum yüklenemedi:", error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      alert("Değerlendirmek için giriş yapmalısınız.");
      return;
    }

    try {
      const response = await submitRating(user.token, recipe.id, rating);
      
      if (response.success) {
        setUserRating(rating);
        setAverageRating(response.new_average || rating);
        setRatingCount(response.new_count || 1);
        setHasRated(true);
      }
    } catch (error) {
      console.error("Değerlendirme hatası:", error);
      alert("Değerlendirme kaydedilemedi, lütfen tekrar deneyin.");
    }
  };

  const baseServings = typeof recipe.servings === 'string' ? parseInt(recipe.servings) : recipe.servings || 2;

  // Placeholder görsel (eğer resim yoksa kullanılacak)
  const fallbackImage = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800&auto=format&fit=crop";

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
                const numericAmount = item.amount;
                let displayAmount = item.amount.toString();
                if (!isNaN(numericAmount)) {
                  const scaled = (numericAmount / baseServings) * servings;
                  displayAmount = Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
                }
                const isChecked = checkedIngredients.includes(idx);
                return (
                  <li key={idx} onClick={() => toggleIngredient(idx)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isChecked ? 'bg-green-50 border-green-100 opacity-60' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'}`}>
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
              <p><strong>Şefin İpucu:</strong> {chefTip}</p>
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
                <div key={idx} onClick={() => toggleStep(idx)} className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer group ${isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-brand/30'}`}>
                  <div className="flex gap-5">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-brand group-hover:text-white'}`}>
                      {isCompleted ? <FaCheck /> : idx + 1}
                    </div>
                    <p className={`text-lg leading-relaxed ${isCompleted ? 'text-gray-400 line-through' : 'text-slate-700'}`}>{step}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Besin Değerleri */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 font-heading">
              1 Porsiyon İçin Besin Değerleri
              <span className="text-sm font-normal text-gray-500 ml-2">
                (yaklaşık {recipe.serving_weight || calculateEstimatedWeight(recipe)} gr)
              </span>
            </h3>
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
            <button onClick={handleCooked} disabled={isCooked} className={`relative z-10 px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition transform active:scale-95 shadow-lg ${isCooked ? 'bg-green-500 text-white cursor-default' : 'bg-white text-slate-900 hover:bg-brand hover:text-white'}`}>
              {isCooked ? <><FaCheck /> Listene Eklendi</> : <><FaThumbsUp /> Ben de Pişirdim</>}
            </button>
          </div>

          {/* Benzer Tarifler */}
          <div className="pt-12 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 font-heading">Bunu Sevenler Şunlara da Düştü 😍</h3>
                <Link href="/recipes" className="text-sm font-bold text-[#db4c3f] hover:underline flex items-center gap-1">Tümünü Gör <FaArrowRight /></Link>
            </div>
            {loadingSimilar ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
                    <div className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>
                </div>
            ) : similarRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {similarRecipes.map((r) => {
                      // Toplam süreyi hesapla (API total_time_min dönmüyor)
                      const totalTime = (parseInt(String(r.prep_time || 0)) + parseInt(String(r.cook_time || 0))) || 0;
                      return (
                        <Link key={r.id} href={`/recipe/${r.slug}`} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-lg transition cursor-pointer group">
                            <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden relative flex-shrink-0">
                                {isPlaceholderImage(r.image) ? (
                                    <ImagePlaceholder title={r.title} variant="card" />
                                ) : (
                                    <Image 
                                      src={r.image} 
                                      alt={r.title} 
                                      fill 
                                      unoptimized={true}
                                      className="object-cover group-hover:scale-105 transition" 
                                    />
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className="font-bold text-slate-800 group-hover:text-brand transition line-clamp-1">{r.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.excerpt || "Harika bir lezzet."}</p>
                                <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-600">
                                    <FaClock className="text-brand" /> {totalTime}dk
                                </div>
                            </div>
                        </Link>
                      );
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-4 bg-gray-50 rounded-2xl">Benzer tarif bulunamadı.</div>
            )}
          </div>
        </div>
      </div>

      {/* COMMENT SECTION */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <section className="bg-white rounded-2xl border border-gray-100 p-8">
          {/* DEĞERLENDİRME BÖLÜMÜ */}
          <div className="mb-8 p-6 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Bu tarifi değerlendirin</h4>
                <p className="text-sm text-gray-600">
                  {ratingCount > 0 
                    ? `${ratingCount} kişi değerlendirdi • Ortalama: ${averageRating.toFixed(1)}/5`
                    : "Henüz değerlendirme yok. İlk siz değerlendirin!"
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    disabled={!user}
                    className={`p-1 transition-transform hover:scale-110 ${!user ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    title={!user ? "Değerlendirmek için giriş yapın" : `${star} yıldız`}
                  >
                    <FaStar 
                      size={28} 
                      className={`transition-colors ${
                        (userRating && star <= userRating) || (!userRating && star <= Math.round(averageRating))
                          ? 'text-yellow-400' 
                          : 'text-gray-300 hover:text-yellow-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {hasRated && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Bu tarife {userRating} yıldız verdiniz
              </p>
            )}
            
            {!user && (
              <p className="text-xs text-gray-500 mt-2">
                Değerlendirmek için <Link href="/login" className="text-[#db4c3f] font-medium hover:underline">giriş yapın</Link>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              Yorumlar <span className="text-gray-400 font-normal">({comments.length})</span>
            </h3>
          </div>

          {/* Yorum Yazma Alanı - Sadece Giriş Yapmış Kullanıcılar */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={user.avatar_url} 
                      alt={user.user_display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaCircleUser className="text-gray-400 text-3xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Bu tarif hakkında ne düşünüyorsunuz?"
                    className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all min-h-[100px]"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-400">
                      Yorum yaparken topluluk kurallarına uyun.
                    </p>
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmitting}
                      className="px-6 py-2.5 bg-[#db4c3f] text-white font-medium rounded-xl hover:bg-[#b03d32] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Gönderiliyor...
                        </>
                      ) : (
                        'Yorum Yap'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100 text-center">
              <p className="text-gray-600 mb-3">Yorum yapmak için giriş yapmalısınız.</p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#db4c3f] text-white font-medium rounded-xl hover:bg-[#b03d32] transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          )}

          {/* Yorum Listesi */}
          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    {comment.author.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FaCircleUser className="text-gray-400 text-2xl" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{comment.author.name}</span>
                      <span className="text-xs text-gray-400">• {formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                    
                    {/* Beğeni butonu ve silme */}
                    <div className="flex items-center gap-4 mt-3">
                      <button 
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#db4c3f] transition-colors"
                      >
                        <FaHeart size={14} /> {comment.likes || 0}
                      </button>
                      {user && user.id === comment.author.id && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCircleUser className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500">Henüz yorum yapılmamış.</p>
                <p className="text-sm text-gray-400 mt-1">Bu tarif hakkında ilk yorumu siz yapın!</p>
              </div>
            )}
          </div>

          {/* Daha Fazla Yükle (Pagination) */}
          {hasMoreComments && (
            <button 
              onClick={loadMoreComments}
              className="w-full mt-6 py-3 bg-gray-50 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              Daha Fazla Yorum Göster
            </button>
          )}
        </section>
      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all scale-100 text-center relative">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"><FaXmark className="text-xl" /></button>
            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-bounce-in"><FaCheck /></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2 font-heading">Ellerine Sağlık Şefim! 👨‍🍳</h3>
            <p className="text-gray-500 mb-8">Harika bir iş çıkardın. Bu tarif pişirdiklerim listesine eklendi.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand-dark transition shadow-lg shadow-brand/20">Tamamdır</button>
          </div>
        </div>
      )}
    </div>
  );
}