import { Recipe } from '@/types';

interface RecipeJsonLdProps {
  recipe: Recipe;
}

export default function RecipeJsonLd({ recipe }: RecipeJsonLdProps) {
  const totalTime = (Number(recipe.prep_time) || 0) + (Number(recipe.cook_time) || 0);
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description: recipe.excerpt,
    image: [recipe.image],
    author: {
      '@type': 'Organization',
      name: 'Tariften',
    },
    datePublished: recipe.created_at,
    prepTime: `PT${recipe.prep_time}M`,
    cookTime: `PT${recipe.cook_time}M`,
    totalTime: `PT${totalTime}M`,
    recipeYield: `${recipe.servings} porsiyon`,
    recipeCategory: recipe.meal_type?.[0] || 'Ana Yemek',
    recipeCuisine: recipe.cuisine?.[0] || 'Türk Mutfağı',
    nutrition: {
      '@type': 'NutritionInformation',
      calories: `${recipe.calories} kcal`,
    },
    recipeIngredient: recipe.ingredients?.map(
      (ing) => `${ing.amount} ${ing.unit} ${ing.name}`
    ) || [],
    recipeInstructions: recipe.steps?.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: step,
    })) || [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
