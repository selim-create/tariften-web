"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toggleInteraction, checkInteractionStatus } from "@/lib/api";
import { FaRegBookmark, FaShareNodes } from "react-icons/fa6";

export default function RecipeActions({ recipeId, title }: { recipeId: number, title: string }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      // Check if user exists AND has a token
      if (user && user.token && recipeId) {
        const status = await checkInteractionStatus(user.token, recipeId);
        setIsSaved(status.favorite);
      }
    }
    checkStatus();
  }, [user, recipeId]);

  const handleSave = async () => {
    if (!user || !user.token) return alert("Kaydetmek için giriş yapmalısınız.");
    
    // Optimistic UI update
    const newStatus = !isSaved;
    setIsSaved(newStatus);
    
    try {
        await toggleInteraction(user.token, recipeId, 'favorite');
    } catch (error) {
        // Revert if API call fails
        console.error("Error toggling favorite:", error);
        setIsSaved(!newStatus);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `${title} tarifini Tariften.com'da incele!`,
          url: window.location.href,
        });
      } catch (error) {
        // İptal edilirse sessiz kal
      }
    } else {
      // Fallback for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Tarif linki kopyalandı!");
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        onClick={handleSave}
        className={`w-12 h-12 rounded-xl border flex items-center justify-center transition ${
          isSaved 
            ? 'bg-brand text-white border-brand' 
            : 'border-gray-200 text-gray-400 hover:text-brand hover:border-brand hover:bg-brand/5'
        }`} 
        title={isSaved ? "Kaydedildi" : "Kaydet"}
      >
        <FaRegBookmark className="text-lg" />
      </button>
      
      <button 
        onClick={handleShare}
        className="w-12 h-12 rounded-xl border border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center transition" 
        title="Paylaş"
      >
        <FaShareNodes className="text-lg" />
      </button>
    </div>
  );
}