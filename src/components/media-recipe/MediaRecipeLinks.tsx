import Link from "next/link";
import { Camera, Clapperboard, Link2, NotebookPen } from "lucide-react";

export type MediaRecipeRoute = "link" | "dish" | "notebook" | "video";

/** Every way to bring a recipe in; one shared list so menus stay in sync. */
export const MEDIA_RECIPE_ROUTES = [
  { key: "link", href: "/recipe/aktar", label: "Bağlantı veya metin", icon: Link2 },
  { key: "dish", href: "/recipe/fotograftan", label: "Fotoğraftan", icon: Camera },
  { key: "notebook", href: "/recipe/defterden", label: "Defterden", icon: NotebookPen },
  { key: "video", href: "/recipe/kendi-videon", label: "Kendi videondan", icon: Clapperboard },
] as const;

/** Quiet "başka bir yol" row at the bottom of an import panel. */
export default function MediaRecipeLinks({ current }: { current: MediaRecipeRoute }) {
  return (
    <nav aria-label="Diğer aktarma yolları" className="mt-5 border-t border-[#f0e6dc] pt-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Başka bir yol</p>
      <ul className="flex flex-wrap gap-2">
        {MEDIA_RECIPE_ROUTES.filter(route => route.key !== current).map(({ key, href, label, icon: Icon }) => (
          <li key={key}>
            <Link href={href}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#fcfaf8] px-3 text-xs font-semibold text-slate-600 ring-1 ring-black/5 transition hover:text-brand hover:ring-brand/40">
              <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
