import Link from "next/link";
import Image from "next/image";
import { getRecipes } from "@/lib/api";
import { FaArrowRight, FaFire, FaAward } from "react-icons/fa";
import { FaUtensils, FaClock, FaEarthAmericas } from "react-icons/fa6";
import Hero from "@/components/home/Hero";
import HomeCTA from "@/components/home/HomeCTA";
import MenuShowcase from "@/components/home/MenuShowcase"; // YENİ

export const dynamic = 'force-dynamic';

export default async function Home() {
  const popularRecipes = await getRecipes({ collection: ['Popüler'] });
  const editorRecipes = await getRecipes({ collection: ['Editörün Seçimi'] });

  // Asya Mutfağı için çoklu seçim parametrelerini oluştur
  const asianCuisines = ['Çin Mutfağı', 'Japon Mutfağı', 'Kore Mutfağı', 'Tayland Mutfağı'];
  const asianParams = new URLSearchParams();
  // Çoklu seçimde sadece ilkinin (Çin) seçili gelmesini engellemek için,
  // parametreleri virgülle birleştirerek tek bir 'cuisine' parametresi olarak gönderiyoruz.
  asianParams.set('cuisine', asianCuisines.join(','));
  const asianLink = `/recipes?${asianParams.toString()}`;

  // Kategori verileri
  const cuisineCategories = [
    { 
      name: "Türk Mutfağı", 
      link: "/recipes?cuisine=Türk%20Mutfağı", 
      img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop", 
      flag: "🇹🇷" 
    },
    { 
      name: "İtalyan Mutfağı", 
      link: "/recipes?cuisine=İtalyan%20Mutfağı", 
      img: "https://images.unsplash.com/photo-1595295333158-4742f28fbd85?q=80&w=400&auto=format&fit=crop", 
      flag: "🇮🇹" 
    },
    { 
      name: "Asya Mutfağı", 
      link: asianLink, 
      img: "https://images.unsplash.com/photo-1552590635-27c2c2128abf?q=80&w=400&auto=format&fit=crop", 
      flag: "🌏" 
    },
    { 
      name: "Meksika Mutfağı", 
      link: "/recipes?cuisine=Meksika%20Mutfağı", 
      img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=400&auto=format&fit=crop", 
      flag: "🇲🇽" 
    },
  ];

  // Placeholder görsel (eğer resim yoksa kullanılacak)
  const fallbackImage = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=800&auto=format&fit=crop";

  return (
    <main className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#fcfcfc]">
      
      {/* 1. HERO */}
      <Hero />

      {/* 2. MUTFAKLAR (Pasaportsuz Dünya Turu) */}
      <section className="py-16 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading flex items-center gap-2">
              <FaEarthAmericas className="text-blue-500" /> Pasaportsuz Dünya Turu
            </h2>
            <Link href="/recipes" className="text-sm font-bold text-brand hover:underline flex items-center gap-1">
              Tümünü Gör <FaArrowRight />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cuisineCategories.map((cuisine) => (
              <Link href={cuisine.link} key={cuisine.name} className="group relative h-40 md:h-52 rounded-2xl overflow-hidden cursor-pointer shadow-md">
                <Image 
                   src={cuisine.img} 
                   alt={cuisine.name}
                   fill
                   unoptimized={true}
                   className="object-cover group-hover:scale-110 transition duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                  <span className="text-2xl mb-1">{cuisine.flag}</span>
                  <span className="text-white font-bold text-lg">{cuisine.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. POPÜLER TARİFLER */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading flex items-center justify-center gap-2">
              <FaFire className="text-orange-500 animate-bounce-slow" /> Şu An Herkes Bunu Pişiriyor
            </h2>
            <p className="text-gray-500 mt-2">Topluluğumuzun en çok sevdiği tarifler.</p>
          </div>

          {popularRecipes.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {popularRecipes.data.slice(0, 3).map((recipe) => (
                <Link href={`/recipe/${recipe.slug}`} key={recipe.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition group overflow-hidden flex flex-col h-full">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <Image 
                      src={recipe.image || fallbackImage} 
                      alt={recipe.title} 
                      fill
                      unoptimized={true}
                      className="object-cover group-hover:scale-105 transition duration-500" 
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-brand shadow-sm flex items-center gap-1">
                      <FaFire /> Popüler
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-brand transition">{recipe.title}</h3>
                    <div className="mt-auto pt-2 text-xs text-gray-500 flex items-center gap-2">
                      <FaClock className="text-brand" /> Hazırlama: {recipe.prep_time}dk
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <p className="text-gray-500">Henüz popüler tarif eklenmemiş.</p>
             </div>
          )}
        </div>
      </section>

      {/* 4. EDİTÖRÜN SEÇİMİ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 font-heading mb-8 flex items-center gap-2">
            <FaAward className="text-purple-500" /> Şefin Torpilli Listesi
          </h2>
          
          {editorRecipes.data.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {editorRecipes.data.slice(0, 4).map((recipe) => (
                   <Link href={`/recipe/${recipe.slug}`} key={recipe.id} className="group relative h-64 rounded-2xl overflow-hidden shadow-lg">
                      <Image 
                        src={recipe.image || fallbackImage} 
                        alt={recipe.title} 
                        fill
                        unoptimized={true}
                        className="object-cover group-hover:scale-110 transition duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5 flex flex-col justify-end">
                        <h4 className="font-bold text-white text-lg leading-tight group-hover:text-brand-300 transition">{recipe.title}</h4>
                        <div className="flex gap-2 mt-2 text-xs text-gray-300">
                           <span className="flex items-center gap-1"><FaUtensils /> {recipe.difficulty[0] || 'Orta'}</span>
                        </div>
                      </div>
                   </Link>
                ))}
             </div>
          ) : (
            <div className="text-center py-10 bg-white border border-gray-100 rounded-2xl">
               <p className="text-gray-500">Editör henüz seçim yapmamış.</p>
            </div>
          )}
        </div>
      </section>
      <MenuShowcase />
      {/* 5. KATEGORİLER (Moods) */}
      <section className="py-16 border-t border-gray-100 bg-white/50">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Hangi Moddasın?</h2>
            <div className="flex flex-wrap justify-center gap-4">
               <Link href="/recipes?diet=Düşük Karbonhidrat" className="px-6 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-bold transition">🥗 Fit & Sağlıklı</Link>
               <Link href="/recipes?difficulty=Kolay" className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold transition">⚡ Üşengeç Şef</Link>
               <Link href="/recipes?difficulty=Şef" className="px-6 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-bold transition">🔥 Ziyafet</Link>
               <Link href="/recipes?meal_type=Tatlı" className="px-6 py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-bold transition">🧁 Tatlı Krizi</Link>
               <Link href="/recipes?cuisine=Meksika%20Mutfağı" className="px-6 py-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 rounded-xl font-bold transition">🌮 Acı Sever</Link>
               <Link href="/recipes?meal_type=Kahvaltı" className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl font-bold transition">🍳 Pazar Kahvaltısı</Link>
            </div>
        </div>
      </section>

      {/* 6. AKILLI BANNER */}
      <HomeCTA />

    </main>
  );
}