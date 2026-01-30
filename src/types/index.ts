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
  chef_tip?: string;
  serving_weight?: number;
  keywords?: string;
  cooked_count?: number;
  average_rating?: number;
  rating_count?: number;
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
  avatar?: string;
  bio?: string;
}

export interface PantryItem {
  id: number;
  name: string;
  quantity: number | string;
  unit: string;
  expiry_date?: string;
  category?: string;
  image?: string;
  expiresIn?: string;
  status?: 'fresh' | 'warning' | 'expired';
}

export interface APIResponse {
  source: 'db' | 'ai' | 'error';
  count: number;
  pages?: number;
  data: Recipe[];
}

// --- YENİ: MENU TYPES ---
export interface MenuSection {
  type: 
    | 'starter' 
    | 'main' 
    | 'side' 
    | 'dessert' 
    | 'drink' 
    | 'soup' 
    | 'meze' 
    | 'hot_appetizer' 
    | 'salad' 
    | 'breakfast_main' 
    | 'breakfast_side' 
    | 'savory' 
    | 'sweet' 
    | 'cold_canape' 
    | 'hot_bites' 
    | 'dip_sauce'
    | string; // Allow for custom types from backend
  title: string;
  recipes: Recipe[]; // Recipe objeleri veya sadece temel bilgiler
}

export interface Menu {
  id: number;
  title: string;
  slug: string;
  description: string;
  image: string;
  concept: string;
  guest_count: number;
  event_type: string; // Bu alanın varlığından emin oluyoruz
  sections: MenuSection[];
  author_id: number;
  author?: Author; // Optional author object
  seo?: {
    title: string;
    description: string;
    keywords: string;
  };
}

export interface Comment {
  id: number;
  content: string;
  author: {
    id: number;
    name: string;
    avatar?: string;
  };
  created_at: string;
  likes?: number;
}

export interface BlogPost {
  id: number;
  date: string;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  categories: number[]; // Benzer içerikler için gerekli
  featured_media: number;
  // Rank Math / Yoast SEO verileri genelde bu alanda döner
  yoast_head_json?: {
    title: string;
    description: string;
    og_title?: string;
    og_description?: string;
    og_image?: { url: string }[];
    twitter_card?: string;
    schema?: any;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    // Author verisine artık ihtiyacımız yok ama embedded içinde gelmeye devam edebilir
  };
}