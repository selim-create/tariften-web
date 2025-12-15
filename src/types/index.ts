export interface User {
  id: number;
  user_login: string;
  user_nicename: string;
  user_email: string;
  user_display_name: string;
  avatar_url?: string;
  diet?: string;
  experience?: string;
  bio?: string;
  token?: string; // Token'ı da buraya ekleyebiliriz veya ayrı tutabiliriz
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  image: string;
  excerpt: string;
  servings: number | string; // API'den string gelebilir, esnek tutalım
  prep_time_min: number;
  cook_time_min: number;
  total_time_min: number; // Burası eksikti veya silinmiş olabilir
  difficulty: string;
  calories: number | string; // API'den string gelebilir
  rating: number;
  is_favorite?: boolean;
  is_cooked?: boolean;
  ingredients: Ingredient[];
  steps: Step[] | string[]; // string[] eski yapı için fallback
  nutrition: Nutrition;
  author: Author;
  categories: string[];
  tags: string[];
  created_at: string;
  content?: string; // HTML içerik fallback'i için
  cuisine?: string[]; // Mutfak türü
  diet?: string[]; // Diyet türü
  meal_type?: string[]; // Öğün türü
}

export interface Ingredient {
  name: string;
  amount: number | string; // String veya number gelebilir
  unit: string;
  note?: string;
}

export interface Step {
  order: number;
  content: string;
  image?: string;
  timer_seconds?: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Author {
  id: number;
  name: string;
  avatar: string;
}

export interface PantryItem {
  id: number; // veya string (uuid)
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string;
  category?: string;
  image?: string;
}

export interface APIResponse {
  source: 'db' | 'ai' | 'error';
  count: number;
  data: Recipe[];
}