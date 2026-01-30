"use client";

import { useState } from "react";
import { BlogPost } from "@/types";
import BlogCard from "./BlogCard";
import { getBlogPosts } from "@/lib/api";
import { FaSpinner, FaArrowDown } from "react-icons/fa6";

interface BlogListProps {
  initialPosts: BlogPost[];
  totalPages: number;
}

export default function BlogList({ initialPosts, totalPages }: BlogListProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(page < totalPages);

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      // API'den yeni sayfayı çek
      const { data, totalPages: newTotal } = await getBlogPosts(nextPage, 9);
      
      // Yeni postları eskilerin altına ekle
      setPosts((prev) => [...prev, ...data]);
      setPage(nextPage);

      // Başka sayfa var mı kontrol et
      if (nextPage >= newTotal) {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Daha fazla yazı yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => (
          <BlogCard key={`${post.id}-${post.slug}`} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      <div className="mt-12 text-center">
        {hasMore ? (
          <button
            onClick={loadMorePosts}
            disabled={loading}
            className="group px-8 py-4 bg-white border-2 border-gray-100 text-slate-700 font-bold rounded-2xl hover:border-[#db4c3f] hover:text-[#db4c3f] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin text-[#db4c3f]" />
                Yükleniyor...
              </>
            ) : (
              <>
                Daha Fazla Göster
                <FaArrowDown className="group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </button>
        ) : (
          <p className="text-gray-400 text-sm font-medium">
            🎉 Tüm yazıları görüntülediniz.
          </p>
        )}
      </div>
    </>
  );
}