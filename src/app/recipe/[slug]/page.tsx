import { getRecipe } from "@/lib/api";
import { notFound } from "next/navigation";
import { Metadata } from 'next';
import RecipeDetailView from "@/components/recipe/RecipeDetailView";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) {
    // A private recipe also lands here (the public lookup cannot see it);
    // its owner gets the page from the client fallback in not-found.tsx.
    return {
      title: 'Tarif Bulunamadı',
      robots: { index: false },
    };
  }

  const seoTitle = recipe.seo?.title || recipe.title;
  const seoDescription = recipe.seo?.description || recipe.excerpt;

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: 'article',
      url: `https://tariften.com/recipe/${recipe.slug}`,
      images: [
        {
          url: recipe.image,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [recipe.image],
    },
    alternates: {
      canonical: `https://tariften.com/recipe/${recipe.slug}`,
    },
  };
}

export default async function RecipeDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) {
    notFound();
  }

  return <RecipeDetailView recipe={recipe} />;
}
