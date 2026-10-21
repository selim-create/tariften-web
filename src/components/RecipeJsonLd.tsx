import { Recipe } from '@/types';
import { parseIngredients, parseSteps } from '@/lib/recipeUtils';
import { isPlaceholderImage } from '@/lib/utils';

interface RecipeJsonLdProps {
  recipe: Recipe;
}

export default function RecipeJsonLd({ recipe }: RecipeJsonLdProps) {
  // Durations go out only when the recipe actually states them; no PT0M / PTundefinedM.
  const prep = Number(recipe.prep_time) > 0 ? Math.round(Number(recipe.prep_time)) : 0;
  const cook = Number(recipe.cook_time) > 0 ? Math.round(Number(recipe.cook_time)) : 0;
  const totalTime = prep + cook;
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
    ...(recipe.image && !isPlaceholderImage(recipe.image) ? { image: [recipe.image] } : {}),
    author: {
      '@type': 'Organization',
      name: 'Tariften',
      url: siteUrl
    },
    datePublished: recipe.created_at,
    ...(prep > 0 ? { prepTime: `PT${prep}M` } : {}),
    ...(cook > 0 ? { cookTime: `PT${cook}M` } : {}),
    ...(totalTime > 0 ? { totalTime: `PT${totalTime}M` } : {}),
    // No recipeYield without a user-confirmed source servings value.
    ...(Number.isInteger(Number(recipe.servings)) && Number(recipe.servings) > 0 && Number(recipe.servings) <= 36
      ? { recipeYield: `${Number(recipe.servings)} porsiyon` } : {}),
    // Category and cuisine only when the recipe is tagged; no guessed defaults.
    ...(recipe.meal_type?.[0] ? { recipeCategory: recipe.meal_type[0] } : {}),
    ...(recipe.cuisine?.[0] ? { recipeCuisine: recipe.cuisine[0] } : {}),
    keywords: generateKeywords(),
    // NutritionInformation must not claim AI guesses as measured facts.
    ...(recipe.nutrition_status === 'verified' && recipe.nutrition
      ? { nutrition: {
          '@type': 'NutritionInformation',
          calories: `${recipe.nutrition.calories} kcal`,
          proteinContent: `${recipe.nutrition.protein}g`,
          carbohydrateContent: `${recipe.nutrition.carbs}g`,
          fatContent: `${recipe.nutrition.fat}g`,
        } }
      : {}),
    recipeIngredient: parseIngredients(recipe.ingredients)
      .map((ing) => [ing.amount, ing.unit, ing.name].map((part) => String(part ?? '').trim()).filter(Boolean).join(' '))
      .filter(Boolean),
    recipeInstructions: parseSteps(recipe.steps).map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Adım ${index + 1}`,
      text: step,
      url: `${siteUrl}/recipe/${recipe.slug}#adim-${index + 1}`,
    })),
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
  }
  // No rating count is ever estimated: without real votes there is no aggregateRating.

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
