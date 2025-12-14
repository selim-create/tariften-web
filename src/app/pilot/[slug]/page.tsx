import { getRecipe } from "@/lib/api";
import { notFound } from "next/navigation";
import PilotClient from "@/components/pilot/PilotClient"; 

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

  // HTML içeriğini temizleyip adımlara bölme (Basit Parser)
  // MVP kapsamında HTML taglerini temizleyip anlamlı metin parçalarına ayırıyoruz.
  const steps = recipe.content
    ? recipe.content
        .replace(/<[^>]*>/g, '\n') // HTML taglerini sil
        .split('\n') // Satırlara böl
        .map((line: string) => line.trim()) // Boşlukları temizle
        .filter((line: string) => line.length > 10) // Çok kısa satırları at
    : [];

  const finalSteps = steps.length > 0 ? steps : ["Tarif adımları yüklenemedi, lütfen detay sayfasına bakınız."];

  return (
    <main className="h-screen w-full bg-[#0f172a] text-white overflow-hidden">
      <PilotClient recipe={recipe} steps={finalSteps} />
    </main>
  );
}