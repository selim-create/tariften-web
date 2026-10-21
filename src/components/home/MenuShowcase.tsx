import Link from "next/link";
import { getMenus } from "@/lib/api";
import { FaArrowRight, FaUsers } from "react-icons/fa6";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

export default async function MenuShowcase() {
  // 'vitrin' etiketli menüleri getir. 
  // NOT: Backend'de WP Admin panelinde menüleri düzenleyip 'Koleksiyonlar' kısmından 'vitrin' etiketini eklemelisiniz.
  const menus = await getMenus('vitrin');

  // Eğer vitrinde menü yoksa bileşeni gizle
  if (!menus || menus.length === 0) return null;

  return (
    <section className="px-4 pt-14 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-[-0.01em] text-slate-900 sm:text-[28px]">Hazır menüler</h2>
            <p className="mt-1 text-sm text-gray-500">Birbiriyle uyumlu tariflerden kurulmuş, gün ya da davet için menüler.</p>
          </div>
          <Link href="/menus" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark">
            Tüm menüler <FaArrowRight className="text-xs" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {menus.slice(0, 3).map((menu) => (
            <Link key={menu.id} href={`/menu/${menu.slug}`} className="group block">
              <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                {isPlaceholderImage(menu.image) ? (
                  <ImagePlaceholder title={menu.title} variant="card" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={menu.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                )}
              </div>
              {menu.concept && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{menu.concept}</p>}
              <h3 className="font-heading text-[17px] font-semibold leading-snug text-slate-900 transition group-hover:text-brand">{menu.title}</h3>
              {menu.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{menu.description}</p>}
              {(Number(menu.guest_count) > 0 || menu.event_type) && (
                <p className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  {Number(menu.guest_count) > 0 && <span className="inline-flex items-center gap-1"><FaUsers aria-hidden /> {menu.guest_count} kişilik</span>}
                  {menu.event_type && <span>{menu.event_type}</span>}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
