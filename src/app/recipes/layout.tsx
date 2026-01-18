import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarif Kütüphanesi',
  description: 'Binlerce tarif arasından aradığınızı bulun. Türk mutfağından dünya mutfaklarına, sağlıklı tariflerden pratik önerilere kadar her şey burada.',
  keywords: ['tarif', 'yemek tarifi', 'türk mutfağı', 'kolay tarifler', 'sağlıklı tarifler', 'pratik yemekler'],
  openGraph: {
    title: 'Tarif Kütüphanesi | Tariften',
    description: 'Binlerce tarif arasından aradığınızı bulun.',
    images: ['/og-image.png'],
  },
};

export default function RecipesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
