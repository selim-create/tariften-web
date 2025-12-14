// Malzeme Tipi
export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  image: string;
  content: string; // HTML içeriği (Geriye dönük uyumluluk için)
  excerpt: string;
  prep_time: string;
  cook_time: string;
  calories: string;
  servings: string;
  
  // Yapılandırılmış Alanlar
  ingredients: Ingredient[];
  steps: string[];

  cuisine: string[];
  diet: string[];
  meal_type: string[];
  difficulty: string[];

  // YENİ EKLENEN: Yazar ID (Düzenleme yetkisi kontrolü için)
  author_id: number;
}

export interface APIResponse {
  source: string;
  count: number;
  data: Recipe[];
}

// GÜNCELLENDİ: Dolap Öğesi Tipi
export interface PantryItem {
  id: string;
  name: string;
  quantity?: string; // Eklendi
  unit?: string;     // Eklendi
  status: "fresh" | "warning" | "expired";
  expiresIn: string;
}