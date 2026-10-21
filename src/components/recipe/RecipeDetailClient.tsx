"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock3, Heart, Lightbulb, Minus, Plus, Star, UserRound, X } from "lucide-react";
import { Recipe, Comment } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toggleInteraction, getRecipes, checkInteractionStatus, getComments, addComment, deleteComment, toggleCommentLike, getRecipeRating, getUserRating, submitRating } from "@/lib/api";
import { recipeChefTip } from "@/lib/chefTips";
import { isPlaceholderImage } from "@/lib/utils";
import { parseIngredients, parseSteps } from "@/lib/recipeUtils";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import RecipeCover from "@/components/recipe/RecipeCover";
import AuthorCard from "@/components/AuthorCard";
import { capitalizeIngredientTr, formatIngredientAmount } from "@/lib/ingredient-display";
import { LOKMA_RATINGS } from "@/lib/lokma-emoji";

/** "Kuru domates (yağda veya yumuşatılmış)" → name + muted qualifier line. */
function splitIngredientName(raw: string): { name: string; qualifier: string | null } {
  const match = raw.trim().match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  return match ? { name: match[1], qualifier: match[2] } : { name: raw.trim(), qualifier: null };
}

export default function RecipeDetailClient({ recipe }: { recipe: Recipe }) {
  const { user } = useAuth();
  const router = useRouter();

  // Missing source servings must never appear as an invented "2 kişilik".
  const originalServings = Number(recipe.servings);
  const verifiedServings = Number.isInteger(originalServings) && originalServings > 0 && originalServings <= 36
    ? originalServings : null;
  const [servings, setServings] = useState<number | null>(verifiedServings);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Only real "cooked" interactions are counted. No estimated or seeded numbers.
  const [cookedCount, setCookedCount] = useState(() => Math.max(0, Number(recipe.cooked_count) || 0));
  const [isCooked, setIsCooked] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [similarRecipes, setSimilarRecipes] = useState<Recipe[]>([]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // The ingredients card is sticky only while it fits in the viewport.
  // A taller card would hide its last rows (and an inner scroll area is
  // awkward with flour on your hands), so long lists simply scroll with the page.
  const ingredientsRef = useRef<HTMLElement>(null);
  const [ingredientsFit, setIngredientsFit] = useState(false);
  useEffect(() => {
    const card = ingredientsRef.current;
    if (!card) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIngredientsFit(card.offsetHeight <= window.innerHeight - 120));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    window.addEventListener("resize", measure);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);

  useEffect(() => {
    async function checkUserStatus() {
      if (!user?.token) return;
      try {
        const status = await checkInteractionStatus(user.token, recipe.id);
        setIsCooked(status.cooked);
      } catch (e) {
        console.error("Etkileşim kontrolü hatası", e);
      }
    }
    checkUserStatus();

    async function fetchSimilar() {
      try {
        const response = await getRecipes({ cuisine: recipe.cuisine });
        if (response && response.data) {
          setSimilarRecipes(response.data.filter(r => r.id !== recipe.id).slice(0, 3));
        }
      } catch (error) {
        console.error("Benzer tarifler hatası:", error);
      }
    }
    fetchSimilar();

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
        setComments([]);
      }
    }
    fetchComments();

    async function fetchRating() {
      try {
        const response = await getRecipeRating(recipe.id);
        if (response.success) {
          setAverageRating(response.average || 0);
          setRatingCount(response.count || 0);
        }
        if (user?.token) {
          const userRatingResponse = await getUserRating(user.token, recipe.id);
          if (userRatingResponse.success && userRatingResponse.rating) {
            setUserRating(userRatingResponse.rating);
          }
        }
      } catch (error) {
        console.error("Rating yüklenemedi:", error);
      }
    }
    fetchRating();
  }, [recipe.id, recipe.cuisine, user?.token]);

  // Never fabricate macronutrients from calorie percentages.
  const hasVerifiedNutrition = recipe.nutrition_status === 'verified'
    && recipe.nutrition != null
    && [recipe.nutrition.protein, recipe.nutrition.carbs, recipe.nutrition.fat]
      .every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0);

  const parsedSteps = parseSteps(recipe.steps);
  const steps = parsedSteps.length > 0
    ? parsedSteps
    : recipe.content
      ? recipe.content
          .replace(/<[^>]*>/g, '\n')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 5)
      : [];

  // No demo fallback: an empty list is shown as empty, never as invented food.
  const ingredients = parseIngredients(recipe.ingredients);
  const chefTip = recipeChefTip(recipe.chef_tip);

  const handleServings = (delta: number) => {
    if (!verifiedServings || servings === null) return;
    const next = servings + delta;
    if (next > 0 && next <= 20) setServings(next);
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const handleCooked = async () => {
    if (!user?.token) { router.push("/login"); return; }
    if (isCooked) return;
    setIsCooked(true);
    setCookedCount(prev => prev + 1);
    setShowSuccessModal(true);
    try {
      await toggleInteraction(user.token, recipe.id, 'cooked');
    } catch (error) {
      console.error("Pişirme işlemi kaydedilemedi:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const diffDays = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Bugün";
    if (diffDays === 1) return "Dün";
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.token || !commentText.trim()) return;
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
    if (!user || !user.token) return;
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
    if (!user || !user.token) { router.push("/login"); return; }
    try {
      const response = await toggleCommentLike(user.token, commentId);
      if (response.success) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: response.likes } : c));
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
    if (!user || !user.token) { router.push("/login"); return; }
    try {
      const response = await submitRating(user.token, recipe.id, rating);
      if (response.success) {
        setUserRating(rating);
        setAverageRating(response.new_average || rating);
        setRatingCount(response.new_count || 1);
      }
    } catch (error) {
      console.error("Değerlendirme hatası:", error);
      alert("Değerlendirme kaydedilemedi, lütfen tekrar deneyin.");
    }
  };

  const baseServings = verifiedServings;
  const shownRating = hoverRating ?? userRating;
  const ratingLabel = shownRating ? LOKMA_RATINGS.find(r => r.rating === shownRating)?.label : null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
        <aside ref={ingredientsRef} aria-labelledby="ingredients-title"
          className={`rounded-3xl border border-gray-200 bg-white lg:col-span-4 ${ingredientsFit ? "lg:sticky lg:top-24" : ""}`}>
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 pb-4 pt-6">
            <div>
              <h2 id="ingredients-title" className="font-heading text-xl font-bold text-slate-900">Malzemeler</h2>
              {ingredients.length > 0 && <p className="mt-0.5 text-xs text-gray-500">{ingredients.length} malzeme</p>}
            </div>
            {baseServings ? (
              <div className="flex items-center rounded-xl border border-gray-200 p-1" role="group" aria-label="Porsiyon">
                <button type="button" onClick={() => handleServings(-1)} disabled={(servings ?? 1) <= 1} aria-label="Porsiyonu azalt"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-gray-100 hover:text-brand disabled:opacity-30">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[4.5rem] text-center text-sm font-semibold text-slate-900 tabular-nums" aria-live="polite">{servings} kişilik</span>
                <button type="button" onClick={() => handleServings(1)} disabled={(servings ?? 1) >= 20} aria-label="Porsiyonu artır"
                  className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-gray-100 hover:text-brand disabled:opacity-30">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-right text-xs leading-4 text-gray-500">Porsiyon<br />belirtilmemiş</span>
            )}
          </div>

          <div className="px-6 pb-6">
            {ingredients.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {ingredients.map((item, idx) => {
                  const displayAmount = formatIngredientAmount(item.amount, item.unit, baseServings ?? 1, servings ?? 1);
                  const isChecked = checkedIngredients.includes(idx);
                  const { name, qualifier } = splitIngredientName(capitalizeIngredientTr(item.name));
                  const note = [qualifier, item.note].filter(Boolean).join(" · ");
                  return (
                    <li key={idx}>
                      <button type="button" role="checkbox" aria-checked={isChecked} onClick={() => toggleIngredient(idx)}
                        className="group flex w-full items-start gap-3 py-3 text-left">
                        <span className={`mt-[3px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${isChecked ? 'border-brand bg-brand text-white' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                          {isChecked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <LokmaIngredientIcon name={item.name} size="md" className={isChecked ? "opacity-40" : ""} />
                        <span className={`min-w-0 flex-1 text-[15px] leading-snug ${isChecked ? 'text-gray-400' : 'text-slate-700'}`}>
                          {displayAmount && <span className={`font-semibold tabular-nums ${isChecked ? '' : 'text-brand'}`}>{displayAmount} </span>}
                          <span className={isChecked ? 'line-through decoration-gray-300' : ''}>{name}</span>
                          {note && <span className="mt-0.5 block text-xs text-gray-500">{note}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="py-4 text-sm text-gray-500">Bu tarif için malzeme listesi henüz eklenmedi.</p>
            )}

            {chefTip && (
              <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden /> Şefin notu
                </p>
                <p className="text-sm leading-relaxed text-slate-700">{chefTip}</p>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-10 lg:col-span-8">
          <section aria-labelledby="steps-title">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 id="steps-title" className="font-heading text-2xl font-bold text-slate-900">Hazırlanışı</h2>
              {steps.length > 0 && (
                <p className="text-sm text-gray-500 tabular-nums" aria-live="polite">
                  {completedSteps.length > 0 ? `${completedSteps.length}/${steps.length} adım tamamlandı` : `${steps.length} adım`}
                </p>
              )}
            </div>
            {steps.length > 0 ? (
              <ol className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white">
                {steps.map((step, idx) => {
                  const isCompleted = completedSteps.includes(idx);
                  return (
                    <li key={idx}>
                      <button type="button" aria-pressed={isCompleted} onClick={() => toggleStep(idx)}
                        className="group flex w-full gap-5 px-5 py-5 text-left transition hover:bg-gray-50 sm:px-7 sm:py-6">
                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular-nums transition ${isCompleted ? 'bg-brand text-white' : 'bg-gray-100 text-slate-600 group-hover:bg-brand/10 group-hover:text-brand'}`}>
                          {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-label="Tamamlandı" /> : idx + 1}
                        </span>
                        <span className={`text-[17px] leading-[1.7] transition ${isCompleted ? 'text-gray-400' : 'text-slate-700'}`}>{step}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Hazırlanış adımları henüz eklenmedi.</p>
            )}
          </section>

          {hasVerifiedNutrition && (
            <section aria-labelledby="nutrition-title" className="rounded-3xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id="nutrition-title" className="font-heading text-lg font-bold text-slate-900">Besin değerleri</h2>
                <span className="text-xs text-gray-500">1 porsiyon · doğrulanmış</span>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-gray-100">
                {([["Protein", recipe.nutrition.protein], ["Karbonhidrat", recipe.nutrition.carbs], ["Yağ", recipe.nutrition.fat]] as const).map(([label, grams]) => (
                  <div key={label} className="px-4 first:pl-0">
                    <dt className="text-xs text-gray-500">{label}</dt>
                    <dd className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">{grams} g</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="flex flex-col gap-5 rounded-3xl bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="font-heading text-xl font-semibold text-white">Bu tarifi pişirdin mi?</h2>
              <p className="mt-1 text-sm text-slate-400">
                {cookedCount > 0
                  ? `${cookedCount.toLocaleString("tr-TR")} kişi pişirdi olarak işaretledi.`
                  : "İşaretle, pişirdiğin tarifler arasında dursun."}
              </p>
            </div>
            <button type="button" onClick={handleCooked} disabled={isCooked}
              className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition ${isCooked ? 'cursor-default bg-white/10 text-white' : 'bg-white text-slate-900 hover:bg-brand hover:text-white'}`}>
              {isCooked ? <><Check className="h-4 w-4" /> Pişirdiklerinde</> : "Ben de pişirdim"}
            </button>
          </section>
        </div>
      </div>

      {similarRecipes.length > 0 && (
        <section aria-labelledby="similar-title" className="mt-16 border-t border-gray-200 pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="similar-title" className="font-heading text-2xl font-bold text-slate-900">Bunlar da hoşuna gidebilir</h2>
            <Link href="/recipes" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
              Tüm tarifler <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {similarRecipes.map((r) => {
              const total = (Number(r.prep_time) || 0) + (Number(r.cook_time) || 0);
              return (
                <Link key={r.id} href={`/recipe/${r.slug}`} className="group">
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                    {isPlaceholderImage(r.image) ? (
                      <RecipeCover title={r.title} compact />
                    ) : (
                      <Image src={r.image} alt="" fill unoptimized sizes="(min-width: 640px) 33vw, 100vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <h3 className="font-heading text-base font-semibold leading-snug text-slate-900 transition group-hover:text-brand line-clamp-2">{r.title}</h3>
                  {total > 0 && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden /> {total} dk
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-16 grid grid-cols-1 items-start gap-10 border-t border-gray-200 pt-10 lg:grid-cols-12 lg:gap-14">
        <div className="space-y-6 lg:col-span-4">
          {recipe.author && <AuthorCard author={recipe.author} />}

          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="font-heading text-lg font-bold text-slate-900">Tarifi değerlendir</h2>
            <p className="mt-1 text-sm text-gray-500 tabular-nums">
              {ratingCount > 0
                ? `${averageRating.toFixed(1).replace(".", ",")} ortalama · ${ratingCount} değerlendirme`
                : "Henüz değerlendirilmedi."}
            </p>
            <div className="mt-4 flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = shownRating ? star <= shownRating : star <= Math.round(averageRating);
                const label = LOKMA_RATINGS.find(r => r.rating === star)?.label;
                return (
                  <button key={star} type="button" onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoverRating(star)} onFocus={() => setHoverRating(star)} onBlur={() => setHoverRating(null)}
                    aria-label={`${star} yıldız${label ? ` · ${label}` : ""}`} aria-pressed={userRating === star}
                    className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand">
                    <Star className={`h-7 w-7 transition-colors ${filled ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-300'}`} strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 min-h-5 text-sm font-medium text-slate-700" aria-live="polite">
              {ratingLabel ?? (user ? "" : <span className="font-normal text-gray-500">Puan vermek için <Link href="/login" className="font-semibold text-brand hover:underline">giriş yap</Link>.</span>)}
            </p>
            {userRating && !hoverRating && <p className="mt-1 text-xs text-gray-500">Senin puanın: {userRating}/5</p>}
          </div>
        </div>

        <section aria-labelledby="comments-title" className="lg:col-span-8">
          <h2 id="comments-title" className="mb-6 font-heading text-2xl font-bold text-slate-900">
            Yorumlar{comments.length > 0 && <span className="ml-2 font-normal text-gray-400 tabular-nums">{comments.length}</span>}
          </h2>

          {user ? (
            <form onSubmit={handleSubmitComment} className="mb-8 flex gap-4">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-gray-400"><UserRound className="h-5 w-5" /></span>
                )}
              </div>
              <div className="flex-1">
                <label htmlFor="comment-text" className="sr-only">Yorumun</label>
                <textarea
                  id="comment-text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tarifi denedin mi? Nasıl oldu, neyi değiştirdin?"
                  maxLength={500}
                  className="min-h-[104px] w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-[15px] transition focus:border-brand/40 focus:outline-none focus:ring-4 focus:ring-brand/10"
                  rows={3}
                />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-500">Yorumlar topluluk kurallarına göre yayınlanır.</p>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Gönderiliyor</>
                    ) : 'Yorum yap'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">Yorum yazmak için giriş yapman gerekiyor.</p>
              <Link href="/login" className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-slate-800 transition hover:border-brand hover:text-brand">
                Giriş yap
              </Link>
            </div>
          )}

          {comments.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-4 py-5 first:pt-0">
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-black/5">
                    {comment.author.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={comment.author.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-gray-400"><UserRound className="h-5 w-5" /></span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-semibold text-slate-900">{comment.author.name}</span>
                      <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{comment.content}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <button type="button" onClick={() => handleLikeComment(comment.id)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-brand">
                        <Heart className="h-3.5 w-3.5" aria-hidden /> <span className="tabular-nums">{comment.likes || 0}</span>
                        <span className="sr-only">beğeni</span>
                      </button>
                      {user && user.id === comment.author.id && (
                        <button type="button" onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-gray-500 transition hover:text-red-600">
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Henüz yorum yok. Tarifi denediysen ilk yorumu sen yaz.</p>
          )}

          {hasMoreComments && (
            <button type="button" onClick={loadMoreComments}
              className="mt-6 h-11 w-full rounded-xl border border-gray-200 text-sm font-semibold text-slate-700 transition hover:border-gray-300 hover:bg-gray-50">
              Daha fazla yorum
            </button>
          )}
        </section>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSuccessModal(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="cooked-title" className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl">
            <button type="button" onClick={() => setShowSuccessModal(false)} aria-label="Kapat"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand"><Check className="h-7 w-7" strokeWidth={2.5} /></div>
            <h3 id="cooked-title" className="mb-2 font-heading text-xl font-bold text-slate-900">Ellerine sağlık!</h3>
            <p className="mb-7 text-sm leading-relaxed text-gray-500">Bu tarif pişirdiklerin arasına eklendi.</p>
            <button type="button" onClick={() => setShowSuccessModal(false)} className="h-12 w-full rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark">Tamam</button>
          </div>
        </div>
      )}
    </div>
  );
}
