import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dolap Modu - Akıllı Mutfak Yönetimi',
  description: 'Evdeki malzemelerinizi girin, yapay zeka size uygun tarifler önersin. İsrafı önleyin, tasarruf edin.',
  keywords: ['dolap yönetimi', 'malzeme takibi', 'yemek planlama', 'israf önleme', 'akıllı mutfak'],
  openGraph: {
    title: 'Dolap Modu | Tariften',
    description: 'Evdeki malzemelerinizi girin, yapay zeka size uygun tarifler önersin.',
    images: ['/og-image.png'],
  },
};

export default function PantryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
