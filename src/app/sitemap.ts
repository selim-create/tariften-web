import { MetadataRoute } from 'next';

const API_URL = "https://api.tariften.com/wp-json";
const SITE_URL = "https://tariften.com";

async function getRecipeSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/tariften/v1/recipes/search?per_page=1000`, {
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.data?.map((recipe: any) => recipe.slug) || [];
  } catch (error) {
    console.error('Sitemap fetch error:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const recipeSlugs = await getRecipeSlugs();
  const recipePages: MetadataRoute.Sitemap = recipeSlugs.map((slug) => ({
    url: `${SITE_URL}/recipe/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...recipePages];
}
