"use server";

import { APIResponse, Recipe, PantryItem, Menu, BlogPost } from "@/types"
import { revalidatePath } from "next/cache";
import { parseIngredients, parseSteps } from "./recipeUtils"; 

// ⚠️ DİKKAT: Backend URL'inizi buraya girin. Localhost kullanıyorsanız güncelleyin.
const API_URL = "https://api.tariften.com/wp-json";

// --- YARDIMCI FONKSİYONLAR ---

async function fetchStatic(endpoint: string, revalidateSeconds: number = 3600) {
  try {
    const res = await fetch(endpoint, {
      next: { revalidate: revalidateSeconds }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Static Fetch Error:", error);
    return null;
  }
}

async function fetchDynamic(endpoint: string) {
  try {
    const res = await fetch(endpoint, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!res.ok) {
        console.error(`[API Error ${res.status}]: ${endpoint}`);
        return null;
    }
    
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Dynamic Fetch Error:", error);
    return null;
  }
}

// --- MEDYA YÜKLEME ---
export async function uploadMedia(token: string, formData: FormData): Promise<number | null> {
  const file = formData.get("file") as File;
  if (!file) return null;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res = await fetch(`${API_URL}/wp/v2/media`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Disposition": `attachment; filename="${file.name}"`,
        "Content-Type": file.type,
      },
      body: buffer,
    });

    if (!res.ok) throw new Error("Görsel yüklenemedi");

    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error("Upload Media Error:", error);
    return null;
  }
}

// --- TARİF İŞLEMLERİ ---

export async function getTerms() {
  const data = await fetchStatic(`${API_URL}/tariften/v1/terms`, 3600);
  return data || null;
}

export interface RecipeFilters {
  query?: string;
  cuisine?: string[];
  diet?: string[];
  mealType?: string[];
  difficulty?: string[];
  collection?: string[];
  source?: string;  // 'rejimde', 'user', 'ai' vb.
  sort?: string;
  page?: number;
}

// Tarif Listesi
export async function getRecipes(filters: RecipeFilters | string = {}): Promise<APIResponse> {
  const params = new URLSearchParams();

  if (typeof filters === 'string') {
    params.append("ingredients", filters);
  } else {
    if (filters.query) params.append("ingredients", filters.query);
    if (filters.cuisine?.length) params.append("cuisine", filters.cuisine.join(","));
    if (filters.diet?.length) params.append("diet", filters.diet.join(","));
    if (filters.mealType?.length) params.append("meal_type", filters.mealType.join(","));
    if (filters.difficulty?.length) params.append("difficulty", filters.difficulty.join(","));
    if (filters.collection?.length) params.append("collection", filters.collection.join(","));
    if (filters.source) params.append("source", filters.source);
    if (filters.sort) params.append("orderby", filters.sort);
    if (filters.page) params.append("page", filters.page.toString());
  }

  const data = await fetchDynamic(`${API_URL}/tariften/v1/recipes/search?${params.toString()}`);
  return data || { source: "error", count: 0, data: [] };
}

// Tekil Tarif
export async function getRecipe(slug: string): Promise<Recipe | null> {
  const data = await fetchDynamic(`${API_URL}/tariften/v1/recipes/search?slug=${encodeURIComponent(slug)}`);
  
  if (!data || !data.data || data.data.length === 0) return null;
  
  const recipe = data.data[0];
  
  // Parse JSON string fields using utilities
  recipe.ingredients = parseIngredients(recipe.ingredients);
  recipe.steps = parseSteps(recipe.steps);
  
  return recipe;
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const data = await fetchDynamic(`${API_URL}/tariften/v1/recipes/search?id=${id}`);
  return (data && data.data && data.data.length > 0) ? data.data[0] : null;
}

// AI Tarif Üretimi
export async function generateAIRecipe(token: string, ingredients: string) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/ai/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ 
        ingredients: ingredients,
        type: 'suggest' 
      }),
    });

    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message || "AI yanıt vermedi.");
    return data;
  } catch (error) {
    console.error("AI Generate Error:", error);
    throw error;
  }
}

// Tarif Oluşturma
export async function createRecipe(token: string, recipeData: any) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/recipes/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(recipeData),
    });

    const json = await res.json();

    if (res.ok) {
        revalidatePath('/recipes'); 
        revalidatePath('/');
    }

    return json;
  } catch (error) {
    console.error("Create Recipe Error:", error);
    throw error;
  }
}

// Tarif Güncelleme
export async function updateRecipe(token: string, recipeData: any) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/recipes/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(recipeData),
    });

    const data = await res.json();
    if (res.ok) {
        revalidatePath('/recipes');
    }
    
    if (!res.ok) throw new Error(data.message || "Tarif güncellenemedi");
    return data;
  } catch (error) {
    throw error;
  }
}

// AI Menü Oluştur
export async function generateAIMenu(token: string, params: { concept: string, guest_count: number, event_type: string, diet?: string, cuisine?: string }) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/ai/generate-menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Menü oluşturulamadı.");
    return data; // { success: true, slug: '...', id: ... }
  } catch (error) {
    console.error("Generate Menu Error:", error);
    throw error;
  }
}

// Menü Detayı Getir
export async function getMenu(slug: string): Promise<Menu | null> {
  return await fetchDynamic(`${API_URL}/tariften/v1/menus/search?slug=${encodeURIComponent(slug)}`);
}

// Menü Listesi (Arşiv & Vitrin)
// collection parametresi opsiyonel: 'vitrin', 'editorun-secimi' vb.
export async function getMenus(collection?: string): Promise<Menu[]> {
  let url = `${API_URL}/tariften/v1/menus/search`;
  if (collection) {
    url += `?collection=${collection}`;
  }
  const res = await fetchDynamic(url);
  return res && res.data ? res.data : [];
}

// YENİ: Menü Güncelleme
export async function updateMenu(token: string, menuData: { 
  id: number; 
  title?: string; 
  description?: string; 
  concept?: string; 
  guest_count?: number; 
  image?: string; 
  event_type?: string;
  sections?: any[]; // Or MenuSection[] if I import it
}) {
    try {
    // NOT: Backend'de /menus/update endpointi olması gerekir. 
    // Eğer yoksa create_recipe benzeri bir logic veya custom endpoint yazılmalıdır.
    // Şimdilik standart WP update mantığına uygun post ediyoruz.
    const res = await fetch(`${API_URL}/tariften/v1/menus/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(menuData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Menü güncellenemedi.");
    
    // Cache'i temizle
    revalidatePath(`/menu/${data.slug}`);
    
    return data;
  } catch (error) {
    console.error("Update Menu Error:", error);
    throw error;
  }
}

// --- AUTH İŞLEMLERİ ---

export async function registerUser(userData: any) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Kayıt işlemi başarısız.");
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Profil Güncelleme
export async function updateProfile(token: string, profileData: any) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Profil güncellenemedi.");
    
    return data;
  } catch (error) {
    throw error;
  }
}

// Avatar Yükleme
export async function uploadAvatar(token: string, file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_URL}/tariften/v1/auth/avatar`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}` 
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Avatar Upload Error Response:", data);
        throw new Error(data.message || "Avatar yüklenemedi.");
    }
    
    return data.avatar_url;
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    throw error;
  }
}


// Mevcut Kullanıcı Bilgilerini Getir
export async function getCurrentUser(token: string) {
  const res = await fetch(`${API_URL}/tariften/v1/auth/me`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  // 401 hatası için özel handling
  if (res.status === 401) {
    return { success: false, error: 'Token expired' };
  }

  if (!res.ok) {
    return { success: false, error: 'Request failed' };
  }
  
  const data = await res.json();
  // Backend'den gelen response'u success flag ile wrap et
  return { success: true, ...data };
}

export async function loginUser(username: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/jwt-auth/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Giriş başarısız");
    return data; 
  } catch (error) {
    throw error;
  }
}

// Google Login
export async function loginWithGoogle(googleToken: string) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken }),
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Google girişi başarısız.");
        return data;
    } else {
        const text = await res.text();
        console.error("Backend Error (HTML):", text); 
        throw new Error("Sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    }
  } catch (error) {
    throw error;
  }
}

// --- DOLAP (PANTRY) İŞLEMLERİ ---

export async function getPantry(token: string): Promise<PantryItem[]> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/pantry`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });

    if (!res.ok) throw new Error("Dolap verisi çekilemedi");
    return res.json();
  } catch (error) {
    return [];
  }
}

export async function updatePantry(token: string, items: PantryItem[]) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/pantry/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ items }), 
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Pantry update failed", res.status, errText);
      throw new Error("Dolap güncellenemedi");
    }
    
    return true;
  } catch (error) {
    console.error("updatePantry error", error);
    return false;
  }
}

// DOLAP İÇERİK ANALİZİ
export async function analyzePantry(token: string, text: string = "", image: string = "") {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/pantry/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ text, image }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Analiz başarısız.");
    return data.items;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
}

// Etkileşimler
export async function toggleInteraction(token: string, recipeId: number, type: 'favorite' | 'cooked') {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ recipe_id: recipeId, type }),
    });
    const data = await res.json();
    return data.status;
  } catch (error) { return null; }
}

export async function getUserInteractions(token: string, type: 'favorite' | 'cooked'): Promise<Recipe[]> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/interactions/list?type=${type}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) { return []; }
}

export async function checkInteractionStatus(token: string, recipeId: number) {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/interactions/check?recipe_id=${recipeId}`, {
      headers: { "Authorization": `Bearer ${token}` },
      cache: "no-store"
    });
    if (!res.ok) return { favorite: false, cooked: false };
    return await res.json();
  } catch (error) { return { favorite: false, cooked: false }; }
}

// Get User's Recipes
export async function getUserRecipes(token: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/recipes/search?author=me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error('Failed to fetch user recipes:', res.status, res.statusText);
      return [];
    }
    
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching user recipes:', error);
    return [];
  }
}

// Newsletter Subscription
export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!res.ok) {
      console.error('Newsletter subscription failed:', res.status, res.statusText);
      return { success: false, message: 'Abonelik başarısız oldu.' };
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return { success: false, message: 'Bir hata oluştu.' };
  }
}

// --- BLOG İŞLEMLERİ ---

export async function getBlogPosts(page: number = 1, perPage: number = 9): Promise<{ data: BlogPost[], totalPages: number }> {
  try {
    const res = await fetch(`${API_URL}/wp/v2/posts?_embed&page=${page}&per_page=${perPage}`, {
      // Geliştirme aşamasında 0 yapabilirsin, canlıda 60 (1 dakika) idealdir.
      next: { revalidate: 60 } 
    });

    if (!res.ok) throw new Error("Blog yazıları getirilemedi");

    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');
    const data = await res.json();

    return { data, totalPages };
  } catch (error) {
    console.error("Blog Fetch Error:", error);
    return { data: [], totalPages: 0 };
  }
}

// src/lib/api.ts içindeki getBlogPost fonksiyonu

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Konsola hangi slug'ı aradığımızı yazdıralım
    console.log(`🔍 Blog aranıyor: ${slug}`);
    
    // URL'yi encode edelim (Türkçe karakter veya boşluk varsa patlamasın)
    const url = `${API_URL}/wp/v2/posts?_embed&slug=${encodeURIComponent(slug)}`;
    console.log(`📡 İstek atılıyor: ${url}`);

    const res = await fetch(url, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
        console.error("❌ API Hatası:", res.status, res.statusText);
        return null;
    }

    const data = await res.json();
    
    // Sonucu görelim
    console.log(`✅ API Yanıtı (${slug}):`, data.length > 0 ? "Bulundu" : "BULUNAMADI");

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Single Blog Fetch Error:", error);
    return null;
  }
}

// Son eklenen 3 yazıyı çekmek için (Anasayfa veya Sidebar için)
export async function getLatestPosts(): Promise<BlogPost[]> {
    const { data } = await getBlogPosts(1, 3);
    return data;
}

// Benzer İçerikleri Getir
export async function getRelatedPosts(categoryId: number, currentPostId: number): Promise<BlogPost[]> {
  try {
    // Aynı kategoriden, şu anki yazı hariç 3 tane getir
    const res = await fetch(`${API_URL}/wp/v2/posts?_embed&categories=${categoryId}&exclude=${currentPostId}&per_page=3`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];
    
    return await res.json();
  } catch (error) {
    console.error("Related Posts Error:", error);
    return [];
  }
}

// --- YORUM (COMMENT) İŞLEMLERİ ---

/**
 * Fetch comments for a recipe with pagination
 * @param recipeId - Recipe ID
 * @param page - Page number (default: 1)
 * @param perPage - Comments per page (default: 10)
 * @returns Promise with { success, comments, pages, total }
 */
export async function getComments(recipeId: number, page: number = 1, perPage: number = 10) {
  const response = await fetch(
    `${API_URL}/tariften/v1/recipes/${recipeId}/comments?page=${page}&per_page=${perPage}`,
    { cache: 'no-store' }
  );
  
  if (!response.ok) {
    throw new Error('Yorumlar yüklenemedi');
  }
  
  return response.json();
}

/**
 * Add a new comment to a recipe
 * @param token - User authentication token
 * @param recipeId - Recipe ID
 * @param content - Comment text
 * @returns Promise with { success, comment }
 */
export async function addComment(token: string, recipeId: number, content: string) {
  const response = await fetch(`${API_URL}/tariften/v1/recipes/${recipeId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Yorum eklenemedi');
  }
  
  return response.json();
}

/**
 * Delete a comment (requires ownership or admin)
 * @param token - User authentication token
 * @param commentId - Comment ID to delete
 * @returns Promise with { success }
 */
export async function deleteComment(token: string, commentId: number) {
  const response = await fetch(`${API_URL}/tariften/v1/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Yorum silinemedi');
  }
  
  return response.json();
}

/**
 * Toggle like on a comment
 * @param token - User authentication token
 * @param commentId - Comment ID to like/unlike
 * @returns Promise with { success, likes }
 */
export async function toggleCommentLike(token: string, commentId: number) {
  const response = await fetch(`${API_URL}/tariften/v1/comments/${commentId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Beğeni işlemi başarısız');
  }
  
  return response.json();
}

// --- DEĞERLENDİRME (RATING) İŞLEMLERİ ---

/**
 * Get aggregate rating for a recipe
 * @param recipeId - Recipe ID
 * @returns Promise with { success, average, count }
 */
export async function getRecipeRating(recipeId: number) {
  try {
    const response = await fetch(`${API_URL}/tariften/v1/recipes/${recipeId}/rating`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { success: false, average: 0, count: 0 };
    }
    
    return response.json();
  } catch (error) {
    console.error('Rating fetch error:', error);
    return { success: false, average: 0, count: 0 };
  }
}

/**
 * Get user's rating for a recipe
 * @param token - User authentication token
 * @param recipeId - Recipe ID
 * @returns Promise with { success, rating }
 */
export async function getUserRating(token: string, recipeId: number) {
  try {
    const response = await fetch(`${API_URL}/tariften/v1/recipes/${recipeId}/rating/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return { success: false, rating: null };
    }
    
    return response.json();
  } catch (error) {
    console.error('User rating fetch error:', error);
    return { success: false, rating: null };
  }
}

/**
 * Submit or update user rating for a recipe (1-5 stars)
 * @param token - User authentication token
 * @param recipeId - Recipe ID
 * @param rating - Rating value (1-5)
 * @returns Promise with { success, new_average, new_count }
 */
export async function submitRating(token: string, recipeId: number, rating: number) {
  const response = await fetch(`${API_URL}/tariften/v1/recipes/${recipeId}/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ rating }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Değerlendirme gönderilemedi');
  }
  
  return response.json();
}