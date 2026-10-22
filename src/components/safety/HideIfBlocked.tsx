"use client";

import type { ReactNode } from "react";
import { useSafety } from "@/context/SafetyContext";

/**
 * Wraps one recipe card (or any item written by a member). Renders nothing
 * when the signed-in member has blocked that author, so lists that were
 * rendered or cached without a token still drop them in the browser.
 */
export default function HideIfBlocked({ authorId, children }: { authorId: unknown; children: ReactNode }) {
  const { isBlocked } = useSafety();
  if (isBlocked(authorId)) return null;
  return <>{children}</>;
}
