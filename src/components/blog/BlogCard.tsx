import Link from "next/link";
import Image from "next/image";
import { BlogPost } from "@/types";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { postCategory, postDate, postExcerpt, postImage, postTitle, readingMinutes } from "@/lib/blog";

/** Blog card for the archive, related posts and the homepage showcase. */
export default function BlogCard({ post, feature = false }: { post: BlogPost; feature?: boolean }) {
  const image = postImage(post);
  const title = postTitle(post);
  const excerpt = postExcerpt(post);
  const category = postCategory(post);
  const minutes = readingMinutes(post.content?.rendered);
  const date = postDate(post.date);

  return (
    <Link href={`/blog/${post.slug}`}
      className={`group grid ${feature ? "gap-6 md:grid-cols-12 md:items-center md:gap-10" : "gap-4"}`}>
      <div className={`relative overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5 ${feature ? "aspect-[16/10] md:col-span-7" : "aspect-[16/10]"}`}>
        {image ? (
          <Image src={image.url} alt="" fill unoptimized
            sizes={feature ? "(min-width: 768px) 58vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
            className="object-cover transition duration-700 group-hover:scale-[1.04]" />
        ) : (
          <ImagePlaceholder title={title} variant="card" />
        )}
      </div>
      <div className={feature ? "md:col-span-5" : ""}>
        {category && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">{category.name}</p>}
        <h3 className={`font-heading font-bold leading-[1.15] tracking-[-0.02em] text-slate-900 transition group-hover:text-brand ${feature ? "text-[28px] sm:text-4xl" : "line-clamp-3 text-xl"}`}>
          {title}
        </h3>
        {excerpt && (
          <p className={`mt-3 leading-relaxed text-slate-500 ${feature ? "line-clamp-4 text-[17px]" : "line-clamp-2 text-[15px]"}`}>{excerpt}</p>
        )}
        {(date || minutes) && (
          <p className="mt-3 text-xs font-medium text-gray-400 tabular-nums">
            {date}{date && minutes ? " · " : ""}{minutes ? `${minutes} dk okuma` : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
