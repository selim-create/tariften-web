"use client";

import { useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { BlogPost } from "@/types";
import BlogCard from "./BlogCard";
import { getBlogPosts } from "@/lib/api";

interface BlogListProps {
  initialPosts: BlogPost[];
  totalPages: number;
  categoryId?: number;
}

export default function BlogList({ initialPosts, totalPages, categoryId }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasMore = page < totalPages;

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setFailed(false);
    const nextPage = page + 1;
    try {
      const { data } = await getBlogPosts(nextPage, 9, categoryId);
      setPosts(prev => [...prev, ...data.filter(post => !prev.some(old => old.id === post.id))]);
      setPage(nextPage);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const [first, ...rest] = posts;

  return (
    <>
      {first && <BlogCard post={first} feature />}

      {rest.length > 0 && (
        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 border-t border-gray-200 pt-14 md:grid-cols-2 lg:grid-cols-3">
          {rest.map(post => <BlogCard key={`${post.id}-${post.slug}`} post={post} />)}
        </div>
      )}

      {hasMore && (
        <div className="mt-16 text-center">
          <button type="button" onClick={loadMorePosts} disabled={loading}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:border-gray-300 disabled:opacity-60">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Yükleniyor</> : <>Daha fazla yazı <ArrowDown className="h-4 w-4" aria-hidden /></>}
          </button>
          {failed && <p role="alert" className="mt-3 text-sm text-red-600">Yazılar yüklenemedi, tekrar dene.</p>}
        </div>
      )}
    </>
  );
}
