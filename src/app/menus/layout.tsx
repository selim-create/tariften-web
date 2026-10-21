import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menü Koleksiyonu - Özel Davet Sofraları',
  description: 'Çorbadan tatlıya birbirine eşlik eden tariflerle kurulmuş menüler: akşam yemekleri, bayram kahvaltıları ve davet sofraları.',
  keywords: ['menü planlama', 'davet menüsü', 'akşam yemeği menüsü', 'özel gün menüleri', 'yemek planı'],
  openGraph: {
    title: 'Menü Koleksiyonu | Tariften',
    description: 'Birbirine eşlik eden tariflerle kurulmuş hazır menüler.',
    images: ['/og-image.jpg'],
  },
};

export default function MenusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
