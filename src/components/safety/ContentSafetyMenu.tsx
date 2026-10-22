"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Ban, Flag, UserRoundCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSafety } from "@/context/SafetyContext";
import MoreMenu, { type MoreMenuItem } from "@/components/safety/MoreMenu";
import ReportDialog from "@/components/safety/ReportDialog";
import BlockConfirmDialog from "@/components/safety/BlockConfirmDialog";
import {
  BLOCKED_MEMBERS_HREF, blockActionLabel, canOfferBlock, isOwnContent, loginHref, memberId,
  type ReportTargetType,
} from "@/lib/ugc-safety";

export type SafetyAuthor = { id?: unknown; name?: string; avatar?: string } | null | undefined;

/**
 * "⋯" on content someone else wrote: "Bildir" and "<Ad>'ı engelle".
 * Guests get only "Bildir", which leads to sign-in and back to this page.
 * Nothing is shown on the viewer's own recipe or comment.
 */
export default function ContentSafetyMenu({ targetType, targetId, author, label, size = "md", className = "" }: {
  targetType: ReportTargetType; targetId: number; author: SafetyAuthor; label: string;
  size?: "sm" | "md"; className?: string;
}) {
  const { user } = useAuth();
  const safety = useSafety();
  const router = useRouter();
  const pathname = usePathname();
  const [dialog, setDialog] = useState<"report" | "block" | null>(null);

  const token = user?.token || "";
  const authorId = memberId(author?.id);
  const name = (author?.name || "").trim() || "Bu üye";
  if (isOwnContent(authorId, user?.id) || !memberId(targetId)) return null;

  const items: MoreMenuItem[] = [{
    key: "report",
    label: "Bildir",
    icon: <Flag className="h-4 w-4" />,
    onSelect: () => {
      if (!token) { router.push(loginHref(pathname || "/")); return; }
      setDialog("report");
    },
  }];

  if (token && canOfferBlock(author, user?.id)) {
    if (safety.isBlocked(authorId)) {
      items.push({
        key: "unblock",
        label: "Engeli kaldır",
        icon: <UserRoundCheck className="h-4 w-4" />,
        onSelect: () => {
          safety.unblock(authorId).then(
            () => safety.notify({ text: `${name} için engel kaldırıldı.`, tone: "ok" }),
            (err: unknown) => safety.notify({ text: err instanceof Error ? err.message : "Engel şu anda kaldırılamadı.", tone: "error" }),
          );
        },
      });
    } else {
      items.push({ key: "block", label: blockActionLabel(name), icon: <Ban className="h-4 w-4" />, onSelect: () => setDialog("block") });
    }
  }

  return (
    <>
      <MoreMenu label={label} items={items} size={size} className={className} />
      {dialog === "report" && token && (
        <ReportDialog token={token} targetType={targetType} targetId={targetId}
          onClose={() => setDialog(null)}
          onDone={() => { if (targetType === "comment") safety.markCommentReported(targetId); }} />
      )}
      {dialog === "block" && token && (
        <BlockConfirmDialog name={name} onClose={() => setDialog(null)}
          onConfirm={async () => {
            await safety.block({ id: authorId, name, avatar: author?.avatar });
            safety.notify({ text: `${name} engellendi.`, tone: "ok", href: BLOCKED_MEMBERS_HREF, cta: "Engellenen üyeler" });
          }} />
      )}
    </>
  );
}
