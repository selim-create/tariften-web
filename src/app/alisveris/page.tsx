import type { Metadata } from "next";
import ShoppingScreen from "./ShoppingScreen";

export const metadata: Metadata = {
  title: "Alışveriş Listesi",
  description: "Tariflerin malzemeleri tek listede: aynı birimdekiler toplanır, kendi ürünlerini ekleyebilirsin.",
  robots: { index: false, follow: false },
};

export default function ShoppingPage() {
  return <ShoppingScreen />;
}
