"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { getUserInteractions } from "@/lib/api";
import { Recipe } from "@/types";
import { FaClock, FaFire, FaPlus, FaBookOpen, FaCheckDouble, FaSpinner } from "react-icons/fa6";

export default function CookbookPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'favorite' | 'cooked'>('favorite');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user || !user.token) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const data = await getUserInteractions(user.token, activeTab);
        setRecipes(data);
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, activeTab]);

  if (!user) return <div className="p-10 text-center">Lütfen giriş yapın.</div>;

  return (
    <main className="min-h-screen bg-[#fcfcfc] py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-slate-900 font-heading">Tarif Defterim</h1>
          
          {/* Tüm butonlar aynı satırda */}
          <div className="flex flex-wrap gap-2 items-center">
            <button 
              onClick={() => setActiveTab('favorite')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'favorite' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
            >
              <FaBookOpen /> Kaydettiklerim
            </button>
            <button 
              onClick={() => setActiveTab('cooked')}
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'cooked' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-gray-100 text-slate-600 hover:bg-gray-200'}`}
            >
              <FaCheckDouble /> Pişirdiklerim
            </button>
            <Link href="/recipe/create" className="bg-white border border-gray-200 hover:border-brand text-slate-700 hover:text-brand px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition">
              <FaPlus /> Yeni Tarif Ekle
            </Link>
          </div>
        </div>

        {/* Liste Grid */}
        {loading ? (
           <div className="flex justify-center py-20 text-gray-400"><FaSpinner className="animate-spin text-3xl"/></div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Link 
                href={`/recipe/${recipe.slug}`} 
                key={recipe.id}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {/* GÖRSEL DÜZELTME: img yerine Image ve unoptimized */}
                  {recipe.image ? (
                    <Image 
                      src={recipe.image} 
                      alt={recipe.title} 
                      fill
                      unoptimized={true}
                      className="object-cover group-hover:scale-105 transition duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🥘</div>
                  )}
                  {recipe.cuisine?.[0] && (
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 shadow-sm uppercase tracking-wide">
                        {recipe.cuisine[0]}
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-brand transition line-clamp-2">{recipe.title}</h3>
                  <div className="mt-auto flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FaClock className="text-brand" /> {recipe.prep_time}dk</span>
                    <span className="flex items-center gap-1"><FaFire className="text-brand" /> {recipe.calories} kcal</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
           <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <p className="text-gray-500">Henüz bu listede tarif yok.</p>
             <Link href="/recipes" className="text-brand font-bold text-sm hover:underline mt-2 inline-block">Tarif Keşfet</Link>
           </div>
        )}

      </div>
    </main>
  );
}