import { Recipe } from '@/types';

interface RecipeJsonLdProps {
  recipe: Recipe;
}

export default function RecipeJsonLd({ recipe }: RecipeJsonLdProps) {
  const totalTime = (Number(recipe.prep_time) || 0) + (Number(recipe.cook_time) || 0);
  const siteUrl = 'https://tariften.com';
  
  // Keywords oluştur
  const generateKeywords = (): string => {
    if (recipe.keywords) return recipe.keywords;
    
    const keywordParts = [
      ...(recipe.meal_type || []),
      ...(recipe.cuisine || []),
      ...(recipe.diet || []),
      ...(recipe.difficulty || []),
    ].filter(Boolean);
    
    // Tarif başlığından da anahtar kelimeler ekle
    const titleWords = recipe.title.split(' ').slice(0, 3);
    keywordParts.push(...titleWords);
    
    return [...new Set(keywordParts)].join(', ');
  };
  
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.excerpt,
    image: [recipe.image],
    author: {
      '@type': 'Organization',
      name: 'Tariften',
      url: siteUrl
    },
    datePublished: recipe.created_at,
    prepTime: `PT${recipe.prep_time}M`,
    cookTime: `PT${recipe.cook_time}M`,
    totalTime: `PT${totalTime}M`,
    recipeYield: `${recipe.servings} porsiyon`,
    recipeCategory: recipe.meal_type?.[0] || 'Ana Yemek',
    recipeCuisine: recipe.cuisine?.[0] || 'Türk Mutfağı',
    keywords: generateKeywords(),
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.calories} kcal`,
      ...(recipe.nutrition?.protein && { proteinContent: `${recipe.nutrition.protein}g` }),
      ...(recipe.nutrition?.carbs && { carbohydrateContent: `${recipe.nutrition.carbs}g` }),
      ...(recipe.nutrition?.fat && { fatContent: `${recipe.nutrition.fat}g` }),
    },
    recipeIngredient: recipe.ingredients?.map(
      (ing) => `${ing.amount} ${ing.unit} ${ing.name}`
    ) || [],
    recipeInstructions: recipe.steps?.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Adım ${index + 1}`,
      text: step,
      url: `${siteUrl}/recipe/${recipe.slug}#adim-${index + 1}`,
    })) || [],
  };

  // aggregateRating - API'den gelen gerçek verilerle
  if (recipe.rating_count && recipe.rating_count > 0 && recipe.average_rating) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recipe.average_rating.toFixed(1),
      ratingCount: recipe.rating_count,
      bestRating: 5,
      worstRating: 1
    };
  } else if (recipe.rating && recipe.rating > 0) {
    // Fallback: Eski rating alanı varsa kullan
    const VOTES_PER_RATING = 10;
    const BASE_VOTE_COUNT = 5;
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: recipe.rating,
      ratingCount: Math.max(Math.floor(recipe.rating * VOTES_PER_RATING) + BASE_VOTE_COUNT, 1),
      bestRating: 5,
      worstRating: 1
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
