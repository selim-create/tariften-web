import { getLatestPosts } from "@/lib/api";
import BlogCard from "@/components/blog/BlogCard";
import SectionHeading from "@/components/home/SectionHeading";

export default async function BlogShowcase() {
  const posts = await getLatestPosts();

  // Eğer hiç yazı yoksa bu alanı gösterme
  if (!posts || posts.length === 0) return null;

  return (
    <section className="px-4 pt-16 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading kicker="Mutfaktan blog" title="Tabaktan önce *okumalık*" href="/blog" linkLabel="Tüm yazılar">
          Teknikler, malzemeler ve mutfağın arkasındaki küçük bilimler.
        </SectionHeading>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}
