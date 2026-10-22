import type { Metadata } from "next";
import OwnVideoStudio from "@/components/media-recipe/OwnVideoStudio";

export const metadata: Metadata = {
  title: "Kendi videondan tarif",
  description: "Kendi çektiğin yemek videosunu yükle, Tariften tarifini çıkarsın.",
  robots: { index: false },
};

export default function OwnVideoRecipePage() {
  return <OwnVideoStudio />;
}
