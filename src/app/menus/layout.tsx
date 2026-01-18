import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menü Koleksiyonu - Özel Davet Sofraları',
  description: 'Yapay zeka şefimizin tasarladığı, birbiriyle uyumlu ve dengeli menüleri keşfedin. Özel günler için hazır menü önerileri.',
  keywords: ['menü planlama', 'davet menüsü', 'akşam yemeği menüsü', 'özel gün menüleri', 'yemek planı'],
  openGraph: {
    title: 'Menü Koleksiyonu | Tariften',
    description: 'Yapay zeka şefimizin tasarladığı özel menüleri keşfedin.',
    images: ['/og-image.png'],
  },
};

export default function MenusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
