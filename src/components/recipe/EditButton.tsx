"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FaPen } from "react-icons/fa6";

export default function EditButton({ authorId, recipeId }: { authorId: number, recipeId: number }) {
  const { user } = useAuth();
  
  // Kullanıcı yoksa butonu gösterme
  if (!user) return null;
  
  // Not: Gerçek uygulamada burada (user.id === authorId) kontrolü yapılmalı.
  // Şu anki MVP'de giriş yapan herkesin (admin gibi) düzenleme butonunu görmesini sağlıyoruz.
  
  return (
    <Link 
      href={`/recipe/edit/${recipeId}`}
      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 p-3 rounded-full transition shadow-lg z-30 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300"
      title="Tarifi Düzenle"
    >
      <FaPen className="text-sm" />
    </Link>
  );
}