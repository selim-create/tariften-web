"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { FaGear, FaFire, FaPen, FaHeart, FaBowlFood, FaClock, FaCheck, FaRotateLeft, FaBookmark } from "react-icons/fa6";
import { getUserInteractions, getUserRecipes } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    cookedCount: 0,
    favoriteCount: 0,
    recipeCount: 0 
  });
  
  const [activeTab, setActiveTab] = useState<'activity' | 'favorites'>('activity');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
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
        
        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 mx-auto bg-red-50 text-brand rounded-full flex items-center justify-center mb-2">
              <FaFire />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.cookedCount}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Pişirilen</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 mx-auto bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-2">
              <FaHeart />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.favoriteCount}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Favori</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
              <FaPen />
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.recipeCount}</div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Tariflerim</div>
          </div>
        </div>

        {/* Sekmeler (Tabs) */}
        <div className="flex border-b border-gray-200">
            <button 
                onClick={() => setActiveTab('activity')}
                className={`pb-4 px-6 text-sm font-bold transition relative ${activeTab === 'activity' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <span className="flex items-center gap-2"><FaRotateLeft /> Son Aktiviteler</span>
                {activeTab === 'activity' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('favorites')}
                className={`pb-4 px-6 text-sm font-bold transition relative ${activeTab === 'favorites' ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <span className="flex items-center gap-2"><FaBookmark /> Kayıt Defteri</span>
                {activeTab === 'favorites' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand rounded-t-full"></div>}
            </button>
        </div>

        {/* İçerik Alanı */}
        <div className="min-h-[200px]">
            {loading ? (
                <div className="flex justify-center py-10 text-gray-300"><FaClock className="animate-spin text-2xl" /></div>
            ) : (
                <>
                    {/* SON AKTİVİTELER TAB */}
                    {activeTab === 'activity' && (
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

                    {/* KAYIT DEFTERİ TAB */}
                    {activeTab === 'favorites' && (
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
                </>
            )}
        </div>

      </div>
    </main>
  );
}

// Yardımcı Bileşenler (Dosya içinde tanımladım, ayrı dosyaya da alınabilir)
// Placeholder URL patterns to filter out
const PLACEHOLDER_PATTERNS = ['placehold.co', 'placeholder', 'via.placeholder'];

function RecipeCard({ recipe, type }: { recipe: any, type: 'cooked' | 'favorite' }) {
    const [imgError, setImgError] = useState(false);
    
    // Placeholder veya kırık görsel kontrolü
    const isValidImage = recipe.image && 
                         !PLACEHOLDER_PATTERNS.some(pattern => recipe.image.includes(pattern)) &&
                         !imgError;
    
    return (
        <Link href={`/recipe/${recipe.slug}`} className="flex gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition group">
            <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0">
                {isValidImage ? (
                    <Image 
                      src={recipe.image} 
                      alt={recipe.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition"
                      onError={() => setImgError(true)}
                      unoptimized={recipe.image?.includes('pexels.com') || recipe.image?.includes('unsplash.com')}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-50 to-red-50">
                        <FaBowlFood className="text-2xl text-brand/40" />
                    </div>
                )}
            </div>
            <div className="flex-1 py-1">
                <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-brand transition">{recipe.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FaClock /> {recipe.prep_time || recipe.total_time_min || 0} dk</span>
                    {type === 'cooked' && <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-md"><FaCheck /> Pişirildi</span>}
                    {type === 'favorite' && <span className="flex items-center gap-1 text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md"><FaHeart /> Favori</span>}
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