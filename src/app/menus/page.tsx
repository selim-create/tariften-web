import Link from "next/link";
import { getMenus } from "@/lib/api";
import { FaPlus, FaUsers, FaArrowRight, FaWandMagicSparkles } from "react-icons/fa6";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { isPlaceholderImage } from "@/lib/utils";

export const revalidate = 60; // Her dakika yenile

export default async function MenusArchivePage() {
  const menus = await getMenus();

  return (
    <div className="min-h-screen bg-[#fcfcfc] pb-20">
      
      {/* HERO SECTION */}
      <div className="relative bg-slate-900 text-white pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        {/* Dekoratif Işıklar */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#db4c3f] rounded-full blur-[150px] opacity-20 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] opacity-20"></div>

        <div className="container mx-auto max-w-6xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-[#db4c3f] mb-4">
                    <FaWandMagicSparkles /> İlham Veren Sofralar
                </div>
                <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6 leading-tight">
                   Davet Sofralarınızı <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#db4c3f] to-orange-400">Sanata Dönüştürün.</span>
                </h1>
                <p className="text-lg text-gray-300 mb-8 max-w-lg">
                    Yapay zeka şefimizin tasarladığı, birbiriyle uyumlu ve dengeli menüleri keşfedin ya da kendi hayalinizdeki sofrayı yaratın.
                </p>
                
                <Link href="/menu/create" className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-xl group">
                   <FaPlus className="text-[#db4c3f]" />
                   Yeni Menü Oluştur
                   <FaArrowRight className="group-hover:translate-x-1 transition-transform text-gray-400"/>
                </Link>
            </div>

            {/* Sağ taraf görseli (Opsiyonel: 3D tabak veya kolaj) */}
            <div className="hidden md:block relative">
                 <div className="w-64 h-80 bg-gray-800 rounded-2xl rotate-6 border border-white/10 overflow-hidden shadow-2xl absolute right-0 top-0 z-10">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <div className="absolute bottom-4 left-4 z-20">
                        <span className="text-xs font-bold text-[#db4c3f]">Yılbaşı Özel</span>
                        <div className="font-bold text-white">Hindi & Kestane</div>
                    </div>
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://images.unsplash.com/photo-1576867757603-05b134ebc379?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Menu 1"/>
                 </div>
                 <div className="w-64 h-80 bg-gray-700 rounded-2xl -rotate-6 border border-white/10 overflow-hidden shadow-xl opacity-60 translate-y-4 -translate-x-12">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://plus.unsplash.com/premium_photo-1723802533099-8cbbdda22e04?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Menu 2"/>
                 </div>
            </div>
        </div>
      </div>

      {/* GALLERY GRID */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Son Eklenen Menüler</h2>
            <div className="text-sm text-gray-500">Toplam {menus.length} menü</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {menus.map((menu) => (
                <Link key={menu.id} href={`/menu/${menu.slug}`} className="group block h-full">
                    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        <div className="relative h-56 overflow-hidden">
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition z-10"></div>
                            {isPlaceholderImage(menu.image) ? (
                              <ImagePlaceholder title={menu.title} variant="card" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                  src={menu.image} 
                                  alt={menu.title} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                              />
                            )}
                            <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm">
                                {menu.concept}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#db4c3f] mb-3 uppercase tracking-wider">
                                <FaUsers /> {menu.guest_count} Kişilik
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-[#db4c3f] transition leading-tight">
                                {menu.title}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-grow">
                                {menu.description}
                            </p>
                            <div className="flex items-center text-sm font-bold text-slate-900 group-hover:translate-x-2 transition-transform">
                                İncele <FaArrowRight className="ml-2 text-[#db4c3f]" />
                            </div>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}