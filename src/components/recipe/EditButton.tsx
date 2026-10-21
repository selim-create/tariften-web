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
      className="absolute top-4 right-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 ring-1 ring-black/5 backdrop-blur transition hover:bg-white hover:text-brand"
      title="Tarifi düzenle"
      aria-label="Tarifi düzenle"
    >
      <FaPen className="text-sm" />
    </Link>
  );
}