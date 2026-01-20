import { Metadata } from 'next';
import { getRecipes } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import RejimdeIcon from '@/components/icons/RejimdeIcon';
import { FaClock, FaFire } from 'react-icons/fa6';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { isPlaceholderImage } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Rejimde Tarifleri | Tariften',
  description: 'Rejimde.com diyet programlarından oluşturulan AI destekli tarifler.',
};

export default async function RejimdeCollectionPage() {
  // Rejimde kaynaklı tarifleri çek
  const recipes = await getRecipes({ source: 'rejimde', sort: 'popular' });
  const recipeList = recipes.data || [];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <RejimdeIcon className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black">Rejimde Tarifleri</h1>
              <p className="text-white/80">Diyet programlarından AI ile oluşturulan tarifler</p>
            </div>
          </div>
          
          <p className="text-lg text-white/90 max-w-2xl mt-4">
            Bu tarifler, <a href="https://rejimde.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Rejimde.com</a> diyet 
            programlarındaki öğünlerden yapay zeka ile oluşturulmuştur. Her tarif, 
            ilgili diyetin besin değerlerine ve porsiyonlarına uygun hazırlanmıştır.
          </p>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </span>
              <span>{recipeList.length}+ Tarif</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </span>
              <span>AI Destekli</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                </svg>
              </span>
              <span>Diyet Uyumlu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {recipeList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipeList.map((recipe: any) => (
              <Link 
                href={`/recipe/${recipe.slug}`} 
                key={recipe.id} 
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                <div className="aspect-[4/3] overflow-hidden bg-gray-100 relative">
                  {isPlaceholderImage(recipe.image) ? (
                    <ImagePlaceholder title={recipe.title} variant="card" />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image 
                        src={recipe.image} 
                        alt={recipe.title} 
                        fill
                        unoptimized={true}
                        className="object-cover group-hover:scale-105 transition duration-700" 
                      />
                    </div>
                  )}
                  {/* Source Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <RejimdeIcon className="w-3 h-3" />
                      Rejimde
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-bold text-slate-800 mb-2 leading-tight group-hover:text-emerald-600 transition font-heading line-clamp-2">
                    {recipe.title}
                  </h2>
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-emerald-600" /> {recipe.prep_time || 0}dk
                      </span>
                      <span className="flex items-center gap-1">
                        <FaFire className="text-orange-500" /> {recipe.calories}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Henüz tarif yok</h2>
            <p className="text-gray-500">Rejimde kaynaklı tarifler yakında burada olacak.</p>
          </div>
        )}
      </div>
    </main>
  );
}
