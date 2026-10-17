import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Lokma İkon Kataloğu · Tariften",
  robots: { index: false, follow: false },
};
export default function LokmaCatalogLayout({ children }: { children: React.ReactNode }) { return children; }
