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
  token?: string;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  image: string;
  excerpt: string;
  // API'den gelen veriler string veya number olabiliyor, string olarak standartlaştırmak güvenlidir.
  servings: string | number; 
  prep_time: string | number; // Backend: 'prep_time'
  cook_time: string | number; // Backend: 'cook_time'
  calories: string | number;
  
  difficulty: string[]; // Backend 'get_term_names' array döner
  rating: number;
  is_favorite?: boolean;
  is_cooked?: boolean;
  
  ingredients: Ingredient[];
  steps: string[]; // Backend 'tariften_steps' array of strings döner
  
  nutrition: Nutrition;
  author: Author;
  
  // Taksonomiler
  categories: string[];
  tags: string[];
  cuisine: string[];
  diet: string[];
  meal_type: string[];
  collection?: string[]; // Backend'de eklendi
  
  created_at: string;
  content?: string;
  seo?: { // Backend'den gelen SEO verisi
    title: string;
    description: string;
  };
}

export interface Ingredient {
  name: string;
  amount: string | number;
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
  id: number;
  name: string;
  quantity: number | string;
  unit: string;
  expiry_date?: string;
  category?: string;
  image?: string;
  expiresIn?: string; // Pantry sayfasında kullanılıyor
  status?: 'fresh' | 'warning' | 'expired';
}

export interface APIResponse {
  source: 'db' | 'ai' | 'error';
  count: number;
  pages?: number; // Backend pagination ekledi
  data: Recipe[];
}