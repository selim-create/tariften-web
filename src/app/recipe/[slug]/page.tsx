import { getRecipe } from "@/lib/api";
import Link from "next/link";
// Image importunu kaldırdık (img etiketi kullanıyoruz)
import { notFound } from "next/navigation";
import { FaClock, FaFire, FaChartSimple, FaChevronRight, FaPlay, FaUtensils, FaLeaf } from "react-icons/fa6";
import { FaRegClock, FaRegBookmark } from "react-icons/fa";
import RecipeDetailClient from "@/components/recipe/RecipeDetailClient";
import RecipeActions from "@/components/recipe/RecipeActions"; 
import EditButton from "@/components/recipe/EditButton"; // YENİ: Düzenle Butonu
import { Metadata } from 'next';
import RecipeJsonLd from '@/components/RecipeJsonLd';

// YouTube Video ID'sini çıkaran yardımcı fonksiyon
function getYoutubeVideoId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Dinamik Metadata
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipe(slug);
  
  if (!recipe) {
    return {
      title: 'Tarif Bulunamadı',
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

  // 1. Video Kontrolü
  const videoId = getYoutubeVideoId(recipe.image);

  // 2. Placeholder Kontrolü
  // const isPlaceholder = !videoId && (recipe.image.includes("placehold.co") || !recipe.image);
  // ARTIK GÖRSELİ GİZLEMEK İÇİN KULLANMIYORUZ, HER TÜRLÜ GÖSTERİYORUZ

  // 3. AI Tespiti (Akıllı Rozet)
  // Görsel kaynağı Placehold.co, Unsplash veya Pexels ise bu bir AI tarifidir.
  const isAiRecipe = recipe.image.includes("placehold.co") || 
                     recipe.image.includes("images.unsplash.com") || 
                     recipe.image.includes("pexels.com");
  
  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-20 font-sans text-slate-800">
      
      <RecipeJsonLd recipe={recipe} />
      
      {/* BREADCRUMB */}
      <div className="container mx-auto max-w-6xl px-4 pt-6 pb-2">
        <nav className="flex items-center text-xs text-gray-400 gap-2 overflow-hidden whitespace-nowrap">
          <Link href="/" className="hover:text-brand transition">Anasayfa</Link>
          <FaChevronRight className="text-[8px]" />
          <Link href="/recipes" className="hover:text-brand transition">Tarifler</Link>
          <FaChevronRight className="text-[8px]" />
          <span className="text-gray-800 font-medium truncate">{recipe.title}</span>
        </nav>
      </div>

      {/* HERO SECTION */}
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12 items-start">
          
          {/* SOL: GÖRSEL veya VİDEO ALANI */}
          <div className="relative group rounded-3xl overflow-hidden shadow-lg aspect-[4/3] bg-gray-100">
            
            {/* DÜZENLEME BUTONU (Yetkili Kişiler İçin) */}
            {/* DÜZELTME: recipe.author_id yerine recipe.author.id kullanıldı */}
            <EditButton authorId={recipe.author?.id} recipeId={recipe.id} />

            {videoId ? (
              // DURUM A: YouTube Videosu
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                className="w-full h-full object-cover"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={recipe.title}
              />
            ) : (
              // DURUM B: Standart Resim (veya Placeholder)
              <>
                <img 
                  src={recipe.image} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
              </>
            )}

            {/* AI Rozeti (AI kaynaklı görsel ise veya video yoksa göster) */}
            {!videoId && isAiRecipe && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold text-brand shadow-sm flex items-center gap-1 z-10">
                AI Önerisi ✨
              </div>
            )}
          </div>

          {/* SAĞ: BAŞLIK VE BİLGİLER */}
          <div className="flex flex-col h-full justify-center">
            
            {/* Kategoriler (Tıklanabilir Linkler) */}
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.meal_type.map(m => (
                 <Link href={`/recipes?meal_type=${encodeURIComponent(m)}`} key={m} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-blue-100 hover:bg-blue-100 transition">
                    {m}
                 </Link>
              ))}
              {recipe.cuisine.map(c => (
                <Link href={`/recipes?cuisine=${encodeURIComponent(c)}`} key={c} className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-orange-100 hover:bg-orange-100 transition">
                  {c}
                </Link>
              ))}
              {recipe.diet.map(d => (
                <Link href={`/recipes?diet=${encodeURIComponent(d)}`} key={d} className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-green-100 hover:bg-green-100 transition">
                  {d}
                </Link>
              ))}
            </div>

            {/* Başlık */}
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 font-heading leading-tight">
              {recipe.title}
            </h1>
            
            {/* Spot / Açıklama */}
            <div className="text-gray-500 text-lg mb-8 font-light leading-relaxed border-l-4 border-brand/20 pl-4">
              {recipe.excerpt || <span className="italic opacity-60">Lezzeti garanti bir tarif!</span>}
            </div>

            {/* KPI KARTLARI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center shadow-sm hover:border-brand/30 transition group">
                <FaRegClock className="mx-auto text-brand mb-1 text-lg group-hover:scale-110 transition" />
                <div className="text-[10px] text-gray-400 font-medium uppercase">Hazırlama</div>
                {/* Fallback eklendi: prep_time string gelebilir */}
                <div className="font-bold text-slate-700">{recipe.prep_time || 0} dk</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center shadow-sm hover:border-brand/30 transition group">
                <FaFire className="mx-auto text-orange-500 mb-1 text-lg group-hover:scale-110 transition" />
                <div className="text-[10px] text-gray-400 font-medium uppercase">Pişirme</div>
                <div className="font-bold text-slate-700">{recipe.cook_time || 0} dk</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center shadow-sm hover:border-brand/30 transition group">
                <FaLeaf className="mx-auto text-green-500 mb-1 text-lg group-hover:scale-110 transition" />
                <div className="text-[10px] text-gray-400 font-medium uppercase">Kalori</div>
                <div className="font-bold text-slate-700">{recipe.calories || "-"}</div>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-gray-100 text-center shadow-sm hover:border-brand/30 transition group">
                <FaChartSimple className="mx-auto text-blue-500 mb-1 text-lg group-hover:scale-110 transition" />
                <div className="text-[10px] text-gray-400 font-medium uppercase">Zorluk</div>
                <div className="font-bold text-slate-700">{recipe.difficulty?.[0] || "Orta"}</div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex flex-wrap items-center gap-3 mt-auto pt-6 border-t border-gray-100">
              <Link 
                href={`/pilot/${recipe.slug}`} 
                className="flex-1 bg-brand hover:bg-brand-dark text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-orange-500/20 transform hover:scale-[1.02] min-w-[200px]"
              >
                <FaPlay className="text-sm" /> Pilotu Başlat
              </Link>

              {/* YENİ: Çalışan Kaydet/Paylaş Butonları */}
              <RecipeActions recipeId={recipe.id} title={recipe.title} />
            </div>

          </div>
        </div>

        {/* ALT İÇERİK (Malzemeler, Hazırlanış, Benzer Tarifler) */}
        <RecipeDetailClient recipe={recipe} />

      </div>
    </main>
  );
}