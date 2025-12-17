import { MetadataRoute } from 'next';
import { getMenus } from '@/lib/api'; // Menüleri getiren fonksiyon

const API_URL = "https://api.tariften.com/wp-json";
const SITE_URL = "https://tariften.com";

// Tarif slug'larını getiren yardımcı fonksiyon (Orijinal)
async function getRecipeSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/recipes/search?per_page=1000`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.data?.map((recipe: any) => recipe.slug) || [];
  } catch (error) {
    console.error('Sitemap fetch error (recipes):', error);
    return [];
  }
}

// Menü slug'larını getiren yardımcı fonksiyon (YENİ)
async function getMenuSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/menus/search`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    // Eğer dönen yapı { data: [...] } ise
    return data.data?.map((menu: any) => menu.slug) || [];
  } catch (error) {
    console.error('Sitemap fetch error (menus):', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Statik Sayfalar (Orijinal Liste + /menus eklendi)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/recipes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/menus`, // YENİ: Menüler Ana Sayfası
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pantry`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // Tarif Sayfaları (Orijinal Mantık)
  const recipeSlugs = await getRecipeSlugs();
  const recipePages: MetadataRoute.Sitemap = recipeSlugs.map((slug) => ({
    url: `${SITE_URL}/recipe/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Menü Sayfaları (YENİ)
  const menuSlugs = await getMenuSlugs();
  const menuPages: MetadataRoute.Sitemap = menuSlugs.map((slug) => ({
    url: `${SITE_URL}/menu/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...recipePages, ...menuPages];
}