import Link from "next/link";
import { getLatestPosts } from "@/lib/api";
import BlogCard from "@/components/blog/BlogCard";
import { FaArrowRight } from "react-icons/fa6";

export default async function BlogShowcase() {
  const posts = await getLatestPosts();

  // Eğer hiç yazı yoksa bu alanı gösterme
  if (!posts || posts.length === 0) return null;

  return (
    <section className="px-4 pt-14 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[28px]">Mutfaktan yazılar</h2>
          <Link href="/blog" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
            Tüm yazılar <FaArrowRight className="text-xs" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
