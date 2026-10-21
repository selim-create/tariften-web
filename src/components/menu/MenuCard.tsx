import Link from "next/link";
import { Users } from "lucide-react";
import type { Menu } from "@/types";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

/** One menu card for the homepage showcase and the archive. */
export default function MenuCard({ menu }: { menu: Menu }) {
  const guests = Number(menu.guest_count);
  return (
    <Link href={`/menu/${menu.slug}`} className="group block">
      <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5">
        {isPlaceholderImage(menu.image) ? (
          <ImagePlaceholder title={menu.title} variant="card" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={menu.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
        )}
        {guests > 0 && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 backdrop-blur">
            <Users className="h-3.5 w-3.5 text-brand" aria-hidden /> {guests} kişilik
          </span>
        )}
      </div>
      {menu.event_type && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">{menu.event_type}</p>}
      <h3 className="font-heading text-xl font-bold leading-snug tracking-[-0.01em] text-slate-900 transition group-hover:text-brand">{menu.title}</h3>
      {menu.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">{menu.description}</p>}
    </Link>
  );
}
