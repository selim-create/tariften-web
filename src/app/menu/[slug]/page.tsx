import { getMenu } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next"; 
import { FaUsers, FaArrowLeft, FaClock, FaUtensils, FaBowlFood, FaWineGlass, FaIceCream, FaLeaf, FaLemon, FaBowlRice, FaCookie, FaFire, FaEgg, FaCheese, FaCakeCandles, FaPlateWheat } from "react-icons/fa6";
import { MenuHeaderActions, MenuFooterActions } from "@/components/menu/MenuClientComponents"; // YENİ IMPORT

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getMenu(slug);

  if (!menu) {
    return {
      title: "Menü Bulunamadı - Tariften",
    };
  }

  const title = menu.seo?.title || `${menu.title} - Tariften`;
  const description = menu.seo?.description || menu.description;

  return {
    title: title,
    description: description,
    keywords: menu.seo?.keywords,
    openGraph: {
      title: title,
      description: description,
      images: [menu.image || "https://tariften.com/og-image.jpg"],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [menu.image || "https://tariften.com/og-image.jpg"],
    },
  };
}

export default async function MenuDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await getMenu(slug);

  if (!menu) return notFound();

  const getSectionStyle = (type: string) => {
    switch(type) {
        case 'starter': return { icon: <FaBowlFood/>, title: 'Başlangıç', desc: 'İştah açıcı hafif lezzetler' };
        case 'side': return { icon: <FaLemon/>, title: 'Ara Sıcak & Meze', desc: 'Sofrayı zenginleştiren tatlar' }; 
        case 'salad': return { icon: <FaLeaf/>, title: 'Salata', desc: 'Taze ve ferah eşlikçiler' }; 
        case 'main': return { icon: <FaUtensils/>, title: 'Ana Yemek', desc: 'Sofranın yıldızları' };
        case 'dessert': return { icon: <FaIceCream/>, title: 'Tatlı', desc: 'Mutlu sonlar' };
        case 'drink': return { icon: <FaWineGlass/>, title: 'İçecek', desc: 'Tamamlayıcı yudumlar' };
        
        // YENİ EKLENEN TYPE'LAR
        case 'soup': return { icon: <FaBowlFood/>, title: 'Çorba', desc: 'Sıcacık başlangıçlar' };
        case 'meze': return { icon: <FaLemon/>, title: 'Mezeler', desc: 'Sofrayı açan lezzetler' };
        case 'hot_appetizer': return { icon: <FaFire/>, title: 'Ara Sıcak', desc: 'Sıcak başlangıçlar' };
        case 'breakfast_main': return { icon: <FaEgg/>, title: 'Ana Kahvaltılıklar', desc: 'Güne enerji veren tatlar' };
        case 'breakfast_side': return { icon: <FaCheese/>, title: 'Hafif Yanlar', desc: 'Kahvaltıyı tamamlayanlar' };
        case 'savory': return { icon: <FaCookie/>, title: 'Tuzlular', desc: 'Tuzlu atıştırmalıklar' };
        case 'sweet': return { icon: <FaCakeCandles/>, title: 'Tatlılar', desc: 'Tatlı molası' };
        case 'cold_canape': return { icon: <FaPlateWheat/>, title: 'Soğuk Kanapeler', desc: 'Zarif lokmalar' };
        case 'hot_bites': return { icon: <FaFire/>, title: 'Sıcak İkramlar', desc: 'Sıcak servis edilenler' };
        case 'dip_sauce': return { icon: <FaBowlRice/>, title: 'Dip & Soslar', desc: 'Eşlikçi soslar' };
        
        default: return { icon: <FaUtensils/>, title: 'Diğer Lezzetler', desc: 'Menüye özel ekstralar' };
    }
  };

  return (
    <div className="min-h-screen bg-[#fffcf5] font-serif text-slate-900 pb-20">
      
      {/* IMMERSIVE HEADER */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden bg-slate-900">
        {/* Arkaplan Görseli */}
         {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
            src={menu.image} 
            alt={menu.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-80" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30"></div>
        
        {/* Navbar Back Button */}
        <div className="absolute top-8 left-0 w-full z-40 px-6 print:hidden">
            <Link href="/menus" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-sans font-bold hover:bg-white/20 transition">
                <FaArrowLeft /> Menülere Dön
            </Link>
        </div>

        {/* Başlık İçeriği */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 flex flex-col md:flex-row items-end justify-between gap-8 z-20">
            <div className="max-w-4xl animate-fade-in-up flex-1 overflow-hidden">
                <div className="flex flex-wrap gap-3 mb-4 font-sans flex-shrink-0">
                     <span className="bg-[#db4c3f] text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider shadow-lg">{menu.concept}</span>
                     <span className="bg-white/20 backdrop-blur border border-white/20 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2"><FaUsers /> {menu.guest_count} Kişilik</span>
                     {menu.event_type && (
                        <span className="bg-white/20 backdrop-blur border border-white/20 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">{menu.event_type}</span>
                     )}
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-tight drop-shadow-lg">
                    {menu.title}
                </h1>
            </div>

            {/* Hızlı Aksiyonlar (Share & Print) */}
            <MenuHeaderActions menu={menu} />
        </div>
      </div>

      {/* CONTENT BODY */}
      <div className="container mx-auto max-w-5xl px-4 md:px-6 -mt-10 relative z-30">
        
        <div className="bg-white shadow-2xl rounded-t-3xl p-8 md:p-12 space-y-16 min-h-[500px]">
            
            <div className="text-center space-y-6 border-b border-gray-100 pb-12">
                <p className="text-[#db4c3f] font-sans font-bold text-xs tracking-[0.2em] uppercase">Mutfaktan</p>
                <h2 className="text-2xl md:text-3xl font-medium italic text-slate-700 leading-relaxed">
                    "Davetlilerinizi büyüleyecek, dengeli ve unutulmaz bir lezzet yolculuğu için özenle seçildi."
                </h2>
                {/* Menü Açıklaması */}
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-3xl mx-auto font-sans">
                    {menu.description}
                </p>
            </div>

            {/* Menü Akışı */}
            <div className="space-y-16">
                {menu.sections.map((section, idx) => {
                    const style = getSectionStyle(section.type);
                    return (
                        <div key={idx} className="relative break-inside-avoid">
                            {/* Section Header */}
                            <div className="flex items-center gap-4 mb-8 sticky top-20 bg-white/95 backdrop-blur py-2 z-10 print:static">
                                <div className="w-12 h-12 rounded-full bg-[#fff5f5] flex items-center justify-center text-[#db4c3f] text-xl shrink-0">
                                    {style.icon}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-sans text-slate-900">{style.title}</h3>
                                    <p className="text-gray-400 font-sans text-sm">{style.desc}</p>
                                </div>
                                <div className="flex-grow h-px bg-gray-100 ml-4"></div>
                            </div>

                            {/* Recipes Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {section.recipes.map((recipe) => (
                                    <Link key={recipe.id} href={`/recipe/${recipe.slug}`} className="group block h-full print:no-underline">
                                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col print:border-0 print:shadow-none">
                                            <div className="relative aspect-[16/9] overflow-hidden print:hidden">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img 
                                                    src={recipe.image || "https://placehold.co/600x400?text=Tarif"} 
                                                    alt={recipe.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                                                />
                                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold font-sans flex items-center gap-1 shadow-sm text-slate-700">
                                                    <FaClock className="text-[#db4c3f]"/> {recipe.prep_time} dk
                                                </div>
                                            </div>
                                            <div className="p-5 flex flex-col flex-grow print:p-0 print:mb-4">
                                                <h4 className="text-lg font-bold mb-2 text-slate-900 group-hover:text-[#db4c3f] transition line-clamp-1">{recipe.title}</h4>
                                                <p className="text-gray-500 font-sans text-sm line-clamp-2 mb-3 flex-grow">{recipe.excerpt}</p>
                                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider print:hidden">
                                                    <span className="bg-gray-50 px-2 py-1 rounded">{recipe.calories} kcal</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Actions (Shopping & Pilot) */}
            <div className="mt-16 p-8 bg-slate-50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 font-sans border border-slate-100 print:hidden">
                <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-1">Hazır mısınız?</h4>
                    <p className="text-gray-500 text-sm">Bu menüyü pişirmek için asistanınızı başlatın.</p>
                </div>
                <MenuFooterActions menu={menu} />
            </div>

        </div>

      </div>
    </div>
  );
}