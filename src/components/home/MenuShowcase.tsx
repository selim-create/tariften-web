import Link from "next/link";
import { getMenus } from "@/lib/api";
import { FaArrowRight, FaCrown, FaUsers, FaWandMagicSparkles } from "react-icons/fa6";

export default async function MenuShowcase() {
  // 'vitrin' etiketli menüleri getir. 
  // NOT: Backend'de WP Admin panelinde menüleri düzenleyip 'Koleksiyonlar' kısmından 'vitrin' etiketini eklemelisiniz.
  const menus = await getMenus('vitrin');

  // Eğer vitrinde menü yoksa bileşeni gizle
  if (!menus || menus.length === 0) return null;

  return (
    <section className="py-20 bg-[#fffcf5] relative overflow-hidden">
      {/* Dekoratif Arkaplan */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full blur-[80px] opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-50 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Espirili Başlık Alanı */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-widest mb-4">
                <FaCrown /> Şefin Tavsiyesi
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-heading text-slate-900 mb-4">
              "Bugün ne pişirsem?" derdine <span className="text-[#db4c3f] italic">ilaç gibi</span> menüler.
            </h2>
            <p className="text-lg text-slate-600">
              Sizin yerinize düşündük, planladık, eşleştirdik. Siz sadece mutfağa girin ve şovunuzu yapın. (Teşekküre gerek yok, bi' tabak gönderirsiniz.)
            </p>
        </div>

        {/* Menü Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menus.slice(0, 3).map((menu, idx) => (
                <Link key={menu.id} href={`/menu/${menu.slug}`} className="group h-full">
                    <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative">
                        
                        {/* Görsel */}
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={menu.image || "https://placehold.co/600x400?text=Menu"} 
                                alt={menu.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-slate-900 shadow-sm flex items-center gap-1">
                                <FaUsers className="text-[#db4c3f]"/> {menu.guest_count} Kişilik
                            </div>
                            
                            {/* "AI Chef" Badge */}
                            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <FaWandMagicSparkles className="text-yellow-400"/> AI Choice
                            </div>
                        </div>

                        {/* İçerik */}
                        <div className="px-2 pb-2 flex flex-col flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#db4c3f] bg-red-50 px-2 py-1 rounded-lg">
                                    {menu.concept}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-[#db4c3f] transition">
                                {menu.title}
                            </h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">
                                {menu.description}
                            </p>
                            
                            <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                                <span className="text-xs font-bold text-slate-400">
                                    {menu.event_type}
                                </span>
                                <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
                                    İncele <FaArrowRight className="text-[#db4c3f]"/>
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>

        {/* Tümünü Gör */}
        <div className="text-center mt-12">
            <Link href="/menus" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#db4c3f] font-bold transition border-b-2 border-transparent hover:border-[#db4c3f] pb-0.5">
                Vitrindekiler yetmedi mi? Tüm arşivi karıştır <FaArrowRight />
            </Link>
        </div>

      </div>
    </section>
  );
}