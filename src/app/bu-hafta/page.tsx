import type { Metadata } from "next";
import WeekScreen from "./WeekScreen";

export const metadata: Metadata = {
  title: "Bu Hafta",
  description: "Haftanın sofrası: tarifleri günlere yerleştir, malzemeleri tek dokunuşla alışveriş listene ekle.",
  robots: { index: false, follow: false },
};

export default function WeekPage() {
  return <WeekScreen />;
}
