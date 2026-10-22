import type { Metadata } from "next";

// Internal review surface: never indexed, same as /lokma-katalog.
export const metadata: Metadata = {
  title: "Lokma İkon Kataloğu",
  robots: { index: false, follow: false },
};

export default function LokmaIconsLayout({ children }: { children: React.ReactNode }) { return children; }
