import { getRecipe } from "@/lib/api";
import { notFound } from "next/navigation";
import PilotAccessGate from "@/components/pilot/PilotAccessGate";
import { parseSteps } from "@/lib/recipeUtils"; 

// Bu sayfa sunucuda çalışır (Server Component) ve veriyi çeker
export default async function PilotPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  // Hata yönetimi için try-catch bloğu eklenebilir, şimdilik direkt çağırıyoruz
  const recipe = await getRecipe(slug);

  if (!recipe) {
    notFound();
  }

  // The Core voice endpoint synthesizes stored recipe steps, never HTML prose.
  const storedSteps = parseSteps(recipe.steps);
  const fallbackSteps = recipe.content
    ? recipe.content.replace(/<[^>]*>/g, "\n").split("\n")
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 10)
    : [];
  const finalSteps = storedSteps.length > 0
    ? storedSteps
    : fallbackSteps.length > 0
      ? fallbackSteps
      : ["Tarif adımları yüklenemedi, lütfen detay sayfasına bakınız."];

  return (
    <main className="h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <PilotAccessGate recipe={recipe} steps={finalSteps} hasStoredSteps={storedSteps.length > 0} />
    </main>
  );
}