import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getMenus } from "@/lib/api";
import MenuCard from "@/components/menu/MenuCard";
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
          {menus.slice(0, 3).map(menu => <MenuCard key={menu.id} menu={menu} />)}
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
