"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getRecipeEditReviewStatus, type RecipeEditReviewStatus } from "@/lib/api";

/** Private review status for recipe owner, not included in public recipe HTML. */
export default function RecipeReviewNotice({ recipeId, authorId }: { recipeId: number; authorId: number }) {
  const { user, loading } = useAuth();
  const token = user?.token;
  const isOwner = !!user && Number(user.id) === Number(authorId);
  const [review, setReview] = useState<RecipeEditReviewStatus | null>(null);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const flag = new URLSearchParams(window.location.search).get("edit_review");
    if (flag === "submitted" || flag === "updated") {
      setToast(flag === "submitted"
        ? "Değişikliklerin yönetici onayına gönderildi."
        : "Tarifin başarıyla güncellendi.");
      const url = window.location.pathname + window.location.hash;
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (loading || !isOwner || !token || recipeId <= 0) {
      setReview(null);
      return;
    }
    let active = true;
    getRecipeEditReviewStatus(token, recipeId)
      .then(result => { if (active) setReview(result); })
      .catch(() => { if (active) setReview(null); });
    return () => { active = false; };
  }, [loading, isOwner, token, recipeId]);
  return (
    <>
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-5 right-5 left-5 z-[220] max-w-md rounded-2xl border border-[#d6e8d6] bg-white px-5 py-4 text-sm font-bold text-[#31634c] shadow-[0_18px_44px_rgba(28,45,32,0.16)] sm:left-auto">
          <div className="flex items-start justify-between gap-3">
            <span>✓ {toast}</span>
            <button type="button" aria-label="Bildirimi kapat" onClick={() => setToast("")} className="text-[#82998c] hover:text-[#31634c]">✕</button>
          </div>
        </div>
      )}
      {isOwner && review?.status === "pending" && (
        <div role="status" className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#f0e2c4] bg-[#fff9ee] px-4 py-3 text-xs leading-5 text-[#815d34]">
          <strong>Tarif düzenlemen onay bekliyor.</strong>
          <span>Yayındaki tarifin mevcut hâli korunuyor.</span>
        </div>
      )}
      {isOwner && review?.status === "rejected" && (
        <section aria-label="Tarif düzenleme değerlendirmesi" className="mb-5 rounded-2xl border border-[#f0c7be] bg-[#fff3ef] px-5 py-4 text-sm leading-6 text-[#914638]">
          <strong>Son tarif düzenleme isteğin onaylanmadı.</strong>
          {review.note ? <p className="mt-1"><strong>Yönetici notu:</strong> {review.note}</p>
            : <p className="mt-1">Yönetici bir açıklama paylaşmadı.</p>}
          <Link href={`/recipe/edit/${recipeId}`} className="mt-2 inline-flex font-bold underline underline-offset-4">Tarifini tekrar düzenle →</Link>
        </section>
      )}
    </>
  );
}
