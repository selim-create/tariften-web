"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FaPen } from "react-icons/fa6";

export default function EditButton({ authorId, recipeId }: { authorId: number, recipeId: number }) {
  const { user } = useAuth();
  
  // An authenticated account must not see another member's edit CTA.
  // Core independently enforces ownership/admin capability for every write.
  if (!user || Number(user.id) !== Number(authorId)) return null;

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