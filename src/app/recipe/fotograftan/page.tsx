import type { Metadata } from "next";
import PhotoRecipeStudio from "@/components/media-recipe/PhotoRecipeStudio";

export const metadata: Metadata = {
  title: "Fotoğraftan tarif",
  description: "Bir yemek fotoğrafından evde yapabileceğin tahmini bir tarif hazırla.",
  robots: { index: false },
};

export default function PhotoRecipePage() {
  return <PhotoRecipeStudio mode="dish" />;
}
