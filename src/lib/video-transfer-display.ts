/** Display helpers for video recipe transfers; they only read what the API returned. */

/** API timestamps are UTC unless they carry their own offset. */
export function parseTransferDate(value: string): number {
  if (typeof value !== "string") return NaN;
  return Date.parse(value.replace(" ", "T") + (value.includes("Z") || /[+-]\d\d:\d\d$/.test(value) ? "" : "Z"));
}

/** Where the video came from, read from the link the cook pasted. */
export function transferPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtu")) return "YouTube";
    if (host.includes("facebook") || host === "fb.watch") return "Facebook";
    if (host.includes("pinterest") || host === "pin.it") return "Pinterest";
    return host;
  } catch { return "Bağlantı"; }
}

/** "Bugün 10:12", "Dün 19:40" or "18 Ekim". */
export function transferWhen(value: string, now = new Date()): string {
  if (typeof value !== "string") return "";
  const time = parseTransferDate(value);
  if (!Number.isFinite(time)) return "";
  const date = new Date(time);
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 86400000);
  const clock = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `Bugün ${clock}`;
  if (days === 1) return `Dün ${clock}`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}
