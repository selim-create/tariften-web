import type { Metadata } from "next";
import PhotoRecipeStudio from "@/components/media-recipe/PhotoRecipeStudio";

export const metadata: Metadata = {
  title: "Defterden tarif",
  description: "Tarif defterinin sayfalarını fotoğrafla, Tariften yazıya aktarsın.",
  robots: { index: false },
};

export default function NotebookRecipePage() {
  return <PhotoRecipeStudio mode="notebook" />;
}
