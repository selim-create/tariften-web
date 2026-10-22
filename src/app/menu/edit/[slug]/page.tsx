"use client";

import { useState, useEffect, useId, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowDown, ArrowUp, Check, Loader2, Plus, RotateCcw, Save, Search, Trash2, Upload, UtensilsCrossed, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getMenu, updateMenu, getRecipes } from "@/lib/api";
import { uploadRecipeImage } from "@/lib/recipe-media-upload";
import { MenuSection, Recipe } from "@/types";
import { isPlaceholderImage } from "@/lib/utils";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { LoadingState, RecipeThumb, SignInPrompt } from "@/components/kitchen/KitchenParts";
import { Accent, BTN_GHOST, BTN_OUTLINE, BTN_PRIMARY, Crumbs, FOCUS, GuestStepper, INPUT, LABEL, Notice } from "@/components/menu/MenuStudio";

// Course names as the menu page prints them, for sections without a title.
const COURSE_TITLES: Record<string, string> = {
  soup: "Çorba", starter: "Başlangıç", meze: "Mezeler", hot_appetizer: "Ara sıcak", salad: "Salata",
  side: "Eşlikçiler", main: "Ana yemek", dessert: "Tatlı", drink: "İçecek", breakfast_main: "Kahvaltılıklar",
  breakfast_side: "Kahvaltının yanına", savory: "Tuzlular", sweet: "Tatlılar", cold_canape: "Soğuk kanapeler",
  hot_bites: "Sıcak ikramlar", dip_sauce: "Dip ve soslar",
};

const ICON_BASE = `grid h-11 w-11 shrink-0 place-items-center rounded-xl text-gray-400 transition disabled:pointer-events-none disabled:opacity-30 ${FOCUS}`;
const ICON_BTN = `${ICON_BASE} hover:bg-black/5 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-slate-100`;
const ICON_DANGER = `${ICON_BASE} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300`;

// Recipe search: a debounced query whose results open inline under the field.
function RecipeSearch({ sectionLabel, existingIds, onSelectRecipe }: {
  sectionLabel: string; existingIds: number[]; onSelectRecipe: (recipe: Recipe) => void;
}) {
  const id = useId();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchRecipes = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await getRecipes({ query: searchQuery });
        setSearchResults(response.data || []);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchRecipes, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const clear = () => {
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  const handleSelect = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    clear();
  };

  return (
    <div className="mt-3">
      <label htmlFor={id} className="sr-only">{sectionLabel} bölümüne tarif ekle</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          id={id}
          type="search"
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") clear(); }}
          placeholder="Tarif ekle: ara…"
          aria-controls={`${id}-results`}
          className={`${INPUT} h-11 pl-10 pr-10 text-sm`}
        />
        {isSearching && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-label="Aranıyor" />}
      </div>

      <div id={`${id}-results`} aria-live="polite">
        {showResults && !isSearching && (
          searchResults.length > 0 ? (
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1">
              {searchResults.map((recipe) => {
                const added = existingIds.includes(recipe.id);
                return (
                  <li key={recipe.id}>
                    <button type="button" disabled={added} onClick={() => handleSelect(recipe)}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-gray-50 disabled:cursor-default disabled:hover:bg-transparent dark:hover:bg-slate-700/60 ${FOCUS}`}>
                      <RecipeThumb title={recipe.title} image={recipe.image} className="h-10 w-10" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-800">{recipe.title}</span>
                        {recipe.calories ? <span className="block text-xs text-gray-500">{recipe.calories} kcal</span> : null}
                      </span>
                      {added
                        ? <span className="inline-flex shrink-0 items-center gap-1 pr-2 text-xs font-medium text-gray-500"><Check className="h-3.5 w-3.5" aria-hidden /> Menüde</span>
                        : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand"><Plus className="h-4 w-4" aria-hidden /><span className="sr-only">Ekle</span></span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <span className="mt-2 block px-1 text-sm text-gray-500">“{searchQuery}” için tarif bulunamadı.</span>
          )
        )}
      </div>
    </div>
  );
}

type Blocked = { title: string; text: string; href: string; cta: string };

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuId, setMenuId] = useState<number | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [imageError, setImageError] = useState("");
  const [saveError, setSaveError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    concept: "",
    guest_count: 4,
    image: "",
  });

  const [sections, setSections] = useState<MenuSection[]>([]);

  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const userId = user?.id;

  useEffect(() => {
    if (!slug) return;
    // Wait for the stored session; a signed-out visitor gets a sign-in card.
    if (authLoading) return;
    if (!userId) return;

    const loadMenu = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const menuData = await getMenu(slug);
        if (menuData) {
          // YETKİ KONTROLÜ: only the author edits; WordPress checks again on save.
          if (Number(menuData.author_id) !== Number(userId)) {
            setBlocked({ title: "Bu menüyü düzenleme yetkin yok.", text: "Menüleri yalnızca hazırlayan kişi düzenleyebilir.", href: `/menu/${slug}`, cta: "Menüye dön" });
            return;
          }

          setMenuId(menuData.id);
          setFormData({
            title: menuData.title,
            description: menuData.description,
            concept: menuData.concept,
            guest_count: Number(menuData.guest_count),
            image: menuData.image || "",
          });
          setSections(menuData.sections || []);
        } else {
          setBlocked({ title: "Menü bulunamadı.", text: "Silinmiş ya da adresi değişmiş olabilir.", href: "/menus", cta: "Menülere git" });
        }
      } catch (err) {
        console.error(err);
        setLoadError("Menü şu anda yüklenemedi. Bağlantını kontrol edip yeniden dene.");
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [slug, userId, authLoading, attempt]);

  // Uploaded media is stored by WordPress, then referenced by its permanent
  // URL in the menu. Never persist a transient blob: or base64: preview.
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!file || !user?.token || uploading) return;
    setUploading(true);
    setImageError("");
    try {
      const result = await uploadRecipeImage(user.token, file);
      if (!result.success) {
        setImageError(result.message);
        return;
      }
      if (!result.url) {
        setImageError("Görsel yüklendi fakat bağlantısı alınamadı. Yeniden dene.");
        return;
      }
      setFormData(prev => ({ ...prev, image: result.url }));
    } finally {
      setUploading(false);
    }
  };

  const updateRecipes = (sectionIndex: number, change: (recipes: Recipe[]) => Recipe[]) => {
    setSections(current => current.map((section, i) => i === sectionIndex ? { ...section, recipes: change([...section.recipes]) } : section));
  };

  // Tarif Silme
  const removeRecipe = (sectionIndex: number, recipeIndex: number) => {
    updateRecipes(sectionIndex, recipes => recipes.filter((_, i) => i !== recipeIndex));
  };

  // Tarif Sıralama: the saved order is the order shown on the menu page.
  const moveRecipe = (sectionIndex: number, recipeIndex: number, delta: -1 | 1) => {
    updateRecipes(sectionIndex, recipes => {
      const target = recipeIndex + delta;
      if (target < 0 || target >= recipes.length) return recipes;
      [recipes[recipeIndex], recipes[target]] = [recipes[target], recipes[recipeIndex]];
      return recipes;
    });
  };

  // Tarif Ekleme: a recipe appears at most once per section.
  const addRecipe = (sectionIndex: number, recipe: Recipe) => {
    updateRecipes(sectionIndex, recipes => recipes.some(r => r.id === recipe.id) ? recipes : [...recipes, recipe]);
  };

  const handleSave = async () => {
    if (!user || !user.token || !menuId) return;

    setSaving(true);
    setSaveError("");
    try {
      await updateMenu(user.token, {
        id: menuId,
        ...formData,
        sections: sections // Güncellenmiş (silinmiş) tarif listesiyle gönderiyoruz
      });
      setSaved(true);
      router.push(`/menu/${slug}`);
    } catch (error) {
      console.error(error);
      setSaveError("Güncelleme sırasında bir hata oluştu. Değişikliklerin bu sayfada duruyor; yeniden dene.");
    } finally {
      setSaving(false);
    }
  };

  const crumbs = [{ label: "Anasayfa", href: "/" }, { label: "Menüler", href: "/menus" }, { label: formData.title || "Menü", href: slug ? `/menu/${slug}` : undefined }, { label: "Düzenle" }];

  if (authLoading || (loading && userId)) {
    return <main className="min-h-screen bg-[#fcfcfc] pb-24"><LoadingState label="Menü açılıyor…" /></main>;
  }

  if (!userId || blocked || loadError) {
    return (
      <main className="min-h-screen bg-[#fcfcfc] px-4 pb-24 pt-6">
        <div className="mx-auto max-w-3xl">
          <Crumbs items={[{ label: "Anasayfa", href: "/" }, { label: "Menüler", href: "/menus" }, { label: "Menüyü düzenle" }]} />
          <div className="mt-10">
            {!userId ? (
              <SignInPrompt icon="tabak" callbackPath={`/menu/edit/${slug}`} title="Menünü düzenlemek için giriş yap."
                text="Menüleri yalnızca hazırlayan kişi, kendi hesabıyla düzenleyebilir." />
            ) : blocked ? (
              <div role="alert" className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
                <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#f6efe8] dark:bg-slate-900/50"><LokmaIngredientIcon name="tabak" size="xl" previewFigure="plate" /></span>
                <h1 className="font-heading text-xl font-semibold text-slate-900">{blocked.title}</h1>
                <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">{blocked.text}</p>
                <Link href={blocked.href} className={`${BTN_OUTLINE} mt-6`}>{blocked.cta}</Link>
              </div>
            ) : (
              <div role="alert" className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-14 text-center">
                <h1 className="font-heading text-xl font-semibold text-slate-900">Menü yüklenemedi.</h1>
                <p className="mt-1 max-w-md text-sm leading-6 text-gray-500">{loadError}</p>
                <button type="button" onClick={() => setAttempt(n => n + 1)} className={`${BTN_OUTLINE} mt-6`}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Tekrar dene
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  const recipeCount = sections.reduce((sum, section) => sum + section.recipes.length, 0);
  const hasImage = formData.image !== "" && !isPlaceholderImage(formData.image);

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-32 sm:pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-6">
        <Crumbs items={crumbs} />

        <header className="mt-8 sm:mt-12">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Menü stüdyosu</p>
          <h1 className="font-heading text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-slate-900 text-balance sm:text-[46px]">
            <Accent text="Menünü *düzenle.*" />
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-slate-500">
            Kapak, başlık ve tarifler senin elinde. Kaydettiğinde menü sayfası güncellenir.
          </p>
        </header>

        <div className="mt-8 space-y-5 sm:mt-10">
          {/* GÖRSEL */}
          <section aria-labelledby="mn-cover" className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
            <h2 id="mn-cover" className="font-heading text-lg font-semibold text-slate-900">Kapak görseli</h2>
            <p className="mt-0.5 text-sm text-gray-500">Yatay bir fotoğraf en iyi görünür. En fazla 4 MB.</p>
            <div className="relative mt-5 aspect-[16/9] overflow-hidden sm:aspect-[2/1] rounded-2xl bg-[#f6efe8] ring-1 ring-black/5 dark:bg-slate-900/50 dark:ring-white/10">
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.image} alt="Menü kapak görseli" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-gray-500">
                  <LokmaIngredientIcon name="tabak" size="xl" previewFigure="plate" />
                  <span>Henüz kapak görseli yok</span>
                </div>
              )}
              {uploading && (
                <div role="status" className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-medium text-slate-700 backdrop-blur-sm dark:bg-slate-900/70 dark:text-slate-200">
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yükleniyor…</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className={`${BTN_OUTLINE} shrink-0`}>
                <Upload className="h-4 w-4" aria-hidden /> {uploading ? "Yükleniyor..." : hasImage ? "Görseli değiştir" : "Görsel yükle"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                tabIndex={-1}
                aria-hidden
                onChange={handleImageUpload}
              />
              <div className="min-w-0 flex-1">
                <label htmlFor="mn-image-url" className={LABEL}>Ya da görsel bağlantısı</label>
                <input
                  id="mn-image-url"
                  type="text"
                  inputMode="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  className={`${INPUT} h-11 text-sm`}
                />
              </div>
            </div>
            {imageError && <div className="mt-4"><Notice tone="error">{imageError}</Notice></div>}
          </section>

          {/* BİLGİLER */}
          <section aria-labelledby="mn-details" className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-8">
            <h2 id="mn-details" className="font-heading text-lg font-semibold text-slate-900">Menü bilgileri</h2>
            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="mn-title" className={LABEL}>Başlık</label>
                <input id="mn-title" type="text" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`${INPUT} h-12 font-heading text-lg font-semibold`} />
              </div>
              <div>
                <label htmlFor="mn-description" className={LABEL}>Açıklama</label>
                <textarea id="mn-description" rows={4} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`${INPUT} resize-y py-3 leading-relaxed`} />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="mn-concept" className={LABEL}>Konsept</label>
                  <input id="mn-concept" type="text" value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                    placeholder="ör. Yılbaşı sofrası"
                    className={`${INPUT} h-12`} />
                </div>
                <div>
                  <span id="mn-guests" className={LABEL}>Kişi sayısı</span>
                  <GuestStepper labelledBy="mn-guests" min={1} max={50} value={formData.guest_count}
                    onChange={(guest_count) => setFormData({ ...formData, guest_count })} />
                </div>
              </div>
            </div>
          </section>

          {/* TARİFLER */}
          <section aria-labelledby="mn-content" className="rounded-3xl border border-gray-200 bg-white p-4 sm:p-8">
            <h2 id="mn-content" className="font-heading text-lg font-semibold text-slate-900">Menü içeriği</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {recipeCount} tarif. Sırayı oklarla değiştir, yeni tarif eklemek için bölümün altındaki aramayı kullan.
            </p>

            {sections.length === 0 && (
              <span className="mt-5 block rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                Bu menüde henüz bölüm yok.
              </span>
            )}

            <ol className="mt-6 space-y-8">
              {sections.map((section, sIdx) => {
                const sectionLabel = section.title || COURSE_TITLES[section.type] || section.type;
                return (
                  <li key={sIdx}>
                    <div className="flex items-baseline gap-3 border-b border-gray-100 pb-3">
                      <span aria-hidden className="font-heading text-sm font-semibold tabular-nums text-brand">{String(sIdx + 1).padStart(2, "0")}</span>
                      <h3 id={`mn-section-${sIdx}`} className="min-w-0 flex-1 truncate font-heading text-base font-semibold text-slate-900">{sectionLabel}</h3>
                      <span className="shrink-0 text-xs text-gray-500">{section.recipes.length} tarif</span>
                    </div>

                    {section.recipes.length > 0 ? (
                      <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                        {section.recipes.map((recipe, rIdx) => (
                          <li key={recipe.id} className="flex items-center gap-2.5 py-2.5 sm:gap-3">
                            <RecipeThumb title={recipe.title} image={recipe.image} className="h-10 w-10 sm:h-12 sm:w-12" />
                            <span className="min-w-0 flex-1">
                              <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">{recipe.title}</span>
                              {recipe.calories ? <span className="mt-0.5 block text-xs text-gray-500">{recipe.calories} kcal</span> : null}
                            </span>
                            <span className="flex shrink-0 items-center">
                              <button type="button" onClick={() => moveRecipe(sIdx, rIdx, -1)} disabled={rIdx === 0}
                                aria-label={`${recipe.title} yukarı taşı`} title="Yukarı taşı" className={ICON_BTN}>
                                <ArrowUp className="h-4 w-4" aria-hidden />
                              </button>
                              <button type="button" onClick={() => moveRecipe(sIdx, rIdx, 1)} disabled={rIdx === section.recipes.length - 1}
                                aria-label={`${recipe.title} aşağı taşı`} title="Aşağı taşı" className={ICON_BTN}>
                                <ArrowDown className="h-4 w-4" aria-hidden />
                              </button>
                              <button type="button" onClick={() => removeRecipe(sIdx, rIdx)}
                                aria-label={`${recipe.title} tarifini kaldır`} title="Tarifi kaldır"
                                className={ICON_DANGER}>
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="mt-3 flex items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-500">
                        <UtensilsCrossed className="h-4 w-4 shrink-0" aria-hidden /> Bu bölümde tarif yok.
                      </span>
                    )}

                    <RecipeSearch sectionLabel={sectionLabel} existingIds={section.recipes.map(r => r.id)}
                      onSelectRecipe={(recipe) => addRecipe(sIdx, recipe)} />
                  </li>
                );
              })}
            </ol>
          </section>

          {/* KAYDET: a frosted bar on phones, part of the page from sm up. */}
          <div className="studio-actionbar fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:border-0 sm:p-0 sm:pt-3 sm:backdrop-blur-none">
            {saveError && <div className="mb-3"><Notice tone="error">{saveError}</Notice></div>}
            <div className="flex items-center justify-between gap-3">
              <Link href={`/menu/${slug}`} className={BTN_GHOST}>
                <X className="h-4 w-4" aria-hidden /> Vazgeç
              </Link>
              <button type="button" onClick={handleSave} disabled={saving || saved} aria-busy={saving || undefined} className={`${BTN_PRIMARY} flex-1 sm:flex-none`}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Kaydediliyor...</>
                  : saved ? <><Check className="h-4 w-4" aria-hidden /> Kaydedildi</>
                    : <><Save className="h-4 w-4" aria-hidden /> Değişiklikleri kaydet</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
