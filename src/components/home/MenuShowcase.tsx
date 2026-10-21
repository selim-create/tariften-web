import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { getMenus } from "@/lib/api";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";
import SectionHeading from "@/components/home/SectionHeading";

export default async function MenuShowcase() {
  // Menus tagged with the 'vitrin' collection in WP admin.
  const menus = await getMenus('vitrin');
  if (!menus || menus.length === 0) return null;

  return (
    <section className="px-4 pt-16 sm:pt-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading kicker="Hazır menüler" title="“Bugün ne pişirsem?” derdine *ilaç gibi* menüler." align="center">
          Sizin yerinize düşündük, planladık, eşleştirdik. Siz mutfağa girin ve şovunuzu yapın. (Teşekküre gerek yok, bi&apos; tabak gönderirsiniz.)
        </SectionHeading>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {menus.slice(0, 3).map((menu) => {
            const guests = Number(menu.guest_count);
            return (
              <Link key={menu.id} href={`/menu/${menu.slug}`} className="group block">
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100 ring-1 ring-black/5">
                  {isPlaceholderImage(menu.image) ? (
                    <ImagePlaceholder title={menu.title} variant="card" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={menu.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
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
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/menus" className="group inline-flex items-center gap-2 border-b-2 border-transparent pb-0.5 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand">
            Vitrindekiler yetmedi mi? Tüm arşivi karıştır <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
