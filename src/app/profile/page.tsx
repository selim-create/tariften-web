"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaGear, FaFire, FaPen, FaHeart, FaBowlFood, FaClock, FaCheck } from "react-icons/fa6";
import { getUserInteractions, getUserRecipes } from "@/lib/api";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    cookedCount: 0,
    favoriteCount: 0,
    recipeCount: 0 
  });
  
  const [activeTab, setActiveTab] = useState<'cooked' | 'favorite' | 'recipes'>('cooked');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        router.push("/login");
        return;
    }

    async function fetchStats() {
      const token = localStorage.getItem('tariften_token');
      if (!token) return;

      try {
        setLoading(true);
        const [cookedData, favoritesData, recipesData] = await Promise.all([
          getUserInteractions(token, 'cooked'),
          getUserInteractions(token, 'favorite'),
          getUserRecipes(token)
        ]);
        
        setStats({
          cookedCount: cookedData?.length || 0,
          favoriteCount: favoritesData?.length || 0,
          recipeCount: recipesData?.length || 0
        });

        setRecentActivity(cookedData || []);
        setFavorites(favoritesData || []);
        setUserRecipes(recipesData || []); // YENİ

      } catch (error) {
        console.error("Stats error", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user, router]);

  if (!user) return null;

  const avatarUrl = user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_display_name || "User")}&background=random&color=fff`;

  return (
    <main className="min-h-screen bg-[#fcfcfc] pb-24">
      
      {/* Üst Profil Kartı */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
          
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
               <Image 
                 src={avatarUrl}
                 alt={user.user_display_name}
                 fill
                 className="object-cover"
                 unoptimized={avatarUrl.includes('ui-avatars.com')}
               />
            </div>
            <Link 
              href="/profile/edit"
              className="absolute bottom-0 right-0 bg-white border border-gray-200 p-2 rounded-full text-slate-600 shadow-sm hover:text-brand transition"
            >
              <FaGear className="text-sm" />
            </Link>
          </div>

          {/* Bilgiler */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900 font-heading mb-1">{user.user_display_name}</h1>
            <p className="text-slate-500 text-sm mb-4">@{user.user_nicename || "kullanici"}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {user.experience && (
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-xs font-bold border border-orange-100">
                    {user.experience === 'pro' ? 'Usta Şef' : user.experience === 'intermediate' ? 'Hevesli Aşçı' : 'Çırak'}
                  </span>
                )}
                {user.diet && user.diet !== 'none' && (
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100 capitalize">
                    {user.diet.replace('_', ' ')}
                  </span>
                )}
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Tıklanabilir İstatistik Kartları */}
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveTab('cooked')}
            className={`bg-white p-4 rounded-2xl shadow-sm border text-center transition ${activeTab === 'cooked' ? 'border-brand ring-2 ring-brand/20' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="w-10 h-10 mx-auto bg-red-50 text-brand rounded-full flex items-center justify-center mb-2">
              <FaFire />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.cookedCount}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pişirilen</div>
          </button>
          
          <button 
            onClick={() => setActiveTab('favorite')}
            className={`bg-white p-4 rounded-2xl shadow-sm border text-center transition ${activeTab === 'favorite' ? 'border-pink-500 ring-2 ring-pink-500/20' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="w-10 h-10 mx-auto bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-2">
              <FaHeart />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.favoriteCount}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Favori</div>
          </button>
          
          <button 
            onClick={() => setActiveTab('recipes')}
            className={`bg-white p-4 rounded-2xl shadow-sm border text-center transition ${activeTab === 'recipes' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
              <FaPen />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.recipeCount}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tariflerim</div>
          </button>
        </div>

        {/* Tarif Listesi */}
        <div className="min-h-[200px]">
          {loading ? (
            <div className="flex justify-center py-10 text-gray-300"><FaClock className="animate-spin text-2xl" /></div>
          ) : (
            <>
              {activeTab === 'cooked' && (
                recentActivity.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentActivity.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} type="cooked" />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Henüz hiç yemek pişirmedin." link="/pantry" linkText="Dolabını Yönet" />
                )
              )}

              {activeTab === 'favorite' && (
                favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {favorites.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} type="favorite" />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Henüz favori tarifin yok." link="/recipes" linkText="Tarifleri Keşfet" />
                )
              )}

              {activeTab === 'recipes' && (
                userRecipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userRecipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} type="created" />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Henüz tarif oluşturmadın." link="/recipe/create" linkText="İlk Tarifini Oluştur" />
                )
              )}
            </>
          )}
        </div>

      </div>
    </main>
  );
}

// Yardımcı Bileşenler (Dosya içinde tanımladım, ayrı dosyaya da alınabilir)

function RecipeCard({ recipe, type }: { recipe: any, type: 'cooked' | 'favorite' | 'created' }) {
    return (
        <Link href={`/recipe/${recipe.slug}`} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition group">
            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0">
                {isPlaceholderImage(recipe.image) ? (
                    <ImagePlaceholder title={recipe.title} variant="card" />
                ) : (
                    <Image 
                      src={recipe.image} 
                      alt={recipe.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition"
                      unoptimized={recipe.image?.includes('pexels.com') || recipe.image?.includes('unsplash.com')}
                    />
                )}
            </div>
            <div className="flex-1 py-1">
                <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-brand transition">{recipe.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FaClock /> {recipe.prep_time || recipe.total_time_min || 0} dk</span>
                    {type === 'cooked' && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md"><FaCheck /> Pişirildi</span>}
                    {type === 'favorite' && <span className="flex items-center gap-1 text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md"><FaHeart /> Favori</span>}
                    {type === 'created' && <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md"><FaPen /> Oluşturuldu</span>}
                </div>
            </div>
        </Link>
    );
}

function EmptyState({ message, link, linkText }: { message: string, link: string, linkText: string }) {
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <FaBowlFood className="text-2xl" />
            </div>
            <p className="text-gray-500 mb-4">{message}</p>
            <Link href={link} className="inline-block px-6 py-3 bg-brand text-white rounded-xl font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition">
                {linkText}
            </Link>
        </div>
    );
}