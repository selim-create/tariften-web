"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { toggleInteraction, checkInteractionStatus } from "@/lib/api";
import { Bookmark, Check, Share2 } from "lucide-react";
import { QuickActionBody, quickActionClass } from "@/components/recipe/QuickAction";

export default function RecipeActions({ recipeId, title, variant = "button" }: { recipeId: number, title: string, variant?: "button" | "quick" }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

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
      } catch {
        // User cancelled the share sheet.
      }
    } else {
      // Fallback for browsers without Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert("Link kopyalanamadı. Lütfen manuel olarak kopyalayın.");
      }
    }
  };

  if (variant === "quick") {
    return (
      <>
        <button type="button" onClick={handleSave} aria-pressed={isSaved} className={quickActionClass}>
          <QuickActionBody tone={isSaved ? "active" : "default"} label={isSaved ? "Kaydedildi" : "Kaydet"}
            icon={<Bookmark className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} strokeWidth={1.75} />} />
        </button>
        <button type="button" onClick={handleShare} className={quickActionClass}>
          <QuickActionBody tone={shareSuccess ? "active" : "default"} label={shareSuccess ? "Kopyalandı" : "Paylaş"}
            icon={shareSuccess ? <Check className="h-5 w-5" strokeWidth={2} /> : <Share2 className="h-5 w-5" strokeWidth={1.75} />} />
        </button>
      </>
    );
  }

  const base = "grid h-12 w-12 place-items-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleSave}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Kaydedildi" : "Tarifi kaydet"}
        title={isSaved ? "Kaydedildi" : "Kaydet"}
        className={`${base} ${isSaved ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-slate-500 hover:border-gray-300 hover:text-brand"}`}
      >
        <Bookmark className={`h-[18px] w-[18px] ${isSaved ? "fill-current" : ""}`} strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={handleShare}
        aria-label={shareSuccess ? "Bağlantı kopyalandı" : "Tarifi paylaş"}
        title={shareSuccess ? "Bağlantı kopyalandı" : "Paylaş"}
        className={`${base} ${shareSuccess ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-200 bg-white text-slate-500 hover:border-gray-300 hover:text-brand"}`}
      >
        {shareSuccess ? <Check className="h-[18px] w-[18px]" strokeWidth={2} /> : <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
