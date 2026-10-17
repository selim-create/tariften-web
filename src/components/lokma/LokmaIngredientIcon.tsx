import { lokmaIngredient } from "@/lib/lokma-emoji";

/**
 * Lokma Miniatures — independent vector food illustrations.
 * Not platform emoji, not an external font. Drawn with a consistent soft
 * palette, natural contours, small highlights and subtle outlines.
 * The first curated food families are provided here; unknown ingredients
 * use a neutral plate illustration rather than an incorrect food identity.
 * Decorative only: source ingredient names and amounts remain text.
 */
type Props = { name: string; size?: "sm" | "md" | "lg"; className?: string };

type Figure = "tomato" | "carrot" | "onion" | "garlic" | "cheese" | "olive"
 | "pasta" | "herb" | "pepper" | "lemon" | "egg" | "milk"
 | "bean" | "spice" | "potato" | "fish" | "bread" | "plate";

const FIGURES: Record<string, Figure> = {
  "🍅": "tomato", "🥕": "carrot", "🧅": "onion", "🧄": "garlic",
  "🧀": "cheese", "🫒": "olive", "🍝": "pasta", "🌿": "herb",
  "🌶️": "pepper", "🍋": "lemon", "🥚": "egg", "🥛": "milk",
  "🫘": "bean", "🧂": "spice", "🥔": "potato", "🐟": "fish",
  "🍞": "bread",
};

export default function LokmaIngredientIcon({ name, size = "md", className = "" }: Props) {
  const figure = FIGURES[lokmaIngredient(name).emoji] || "plate";
  const dimensions = size === "sm" ? "h-5 w-5" : size === "lg" ? "h-7 w-7" : "h-6 w-6";
  const dark = "#65584c";
  const shine = "#ffffff";
  return <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center ${dimensions} ${className}`}>
    <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round">
      {figure === "tomato" && <>
        <path d="M9 17c-3 3-3 10 2 15 5 5 16 4 20-2 4-5 3-12-2-15-4-3-16-2-20 2Z" fill="#e75a49" stroke="#bc483d" strokeWidth="1.2" />
        <path d="M15 17c1-6 4-7 5-10 0 4 2 6 4 8m-4 0-6-3 2 6 4-3 7 1-3-5-4 4" fill="#64a777" stroke="#49885e" strokeWidth="1.1" />
        <path d="M11 22c0-2 1-4 3-5" stroke={shine} strokeWidth="2.2" opacity=".65" />
        <path d="M27 30c2-1 3-4 3-6" stroke="#bc483d" strokeWidth="1.1" opacity=".4" />
      </>}
      {figure === "carrot" && <>
        <path d="M16 17c5-3 12-1 12 5 0 4-10 13-14 13-5 0-3-6-2-12 1-3 2-5 4-6Z" fill="#f3a64c" stroke="#d78a38" strokeWidth="1.3" />
        <path d="M17 16c-2-4-2-8-1-10 3 2 4 5 5 8 3-4 6-5 9-5-1 4-4 7-8 9" fill="#73ad79" stroke="#4d8e60" strokeWidth="1.2" />
        <path d="M15 25l4 2m1-8 3 2m-8 10 2 1" stroke="#d98737" strokeWidth="1.6" />
        <path d="M14 22c1-3 2-4 4-4" stroke={shine} strokeWidth="1.9" opacity=".65" />
      </>}
      {figure === "onion" && <>
        <path d="M20 6c-3 4-2 5-5 8-5 4-7 7-7 13 0 7 6 10 12 10s12-4 12-11c0-5-4-9-8-13-3-2-3-4-4-7Z" fill="#e8bf8f" stroke="#bc956d" strokeWidth="1.3" />
        <path d="M20 13c-8 6-8 13-7 16 1 3 4 5 7 6m0-22c8 6 8 13 7 16-1 3-4 5-7 6" stroke="#d9a779" strokeWidth="1.4" />
        <path d="M20 7v28" stroke={shine} strokeWidth="1.6" opacity=".6" />
      </>}
      {figure === "garlic" && <>
        <path d="M19 6c2 3 0 5 0 7-4-1-8 1-10 7-3 9 2 16 11 16s15-7 11-16c-3-6-5-8-10-7" fill="#f4e9cf" stroke="#c7b79a" strokeWidth="1.2" />
        <path d="M20 14c-5 5-6 15-2 20m4-20c6 8 5 17 1 20" stroke="#decba9" strokeWidth="1.1" />
        <path d="M12 19c-2 4-2 7 0 9" stroke={shine} strokeWidth="1.8" opacity=".85" />
      </>}
      {figure === "cheese" && <>
        <path d="M5 20 21 9 35 18v15H5V20Z" fill="#f5cb69" stroke="#d8a74f" strokeWidth="1.2" />
        <path d="m5 20 16-11 14 9-15 10L5 20Z" fill="#ffe091" stroke="#d8a74f" strokeWidth="1.2" />
        <path d="M20 28v5" stroke="#d8a74f" strokeWidth="1.2" />
        <circle cx="12" cy="27" r="3" fill="#d9a64d" opacity=".7" />
        <circle cx="29" cy="25" r="2.1" fill="#d9a64d" opacity=".65" />
        <circle cx="21" cy="17" r="2.3" fill="#edb956" opacity=".8" />
      </>}
      {figure === "olive" && <>
        <path d="M20 8c-2 6-2 15-3 23" stroke="#577e4c" strokeWidth="2.1" />
        <path d="M18 18c-7-9-10-7-11-5 0 5 5 8 11 9m2-9c5-8 9-8 10-7 1 4-5 10-10 10" fill="#8aaf77" stroke="#5d8d61" strokeWidth="1.2" />
        <ellipse cx="16" cy="27" rx="6" ry="7" transform="rotate(-25 16 27)" fill="#a5aa51" stroke="#77863f" strokeWidth="1.2" />
        <ellipse cx="27" cy="23" rx="5.5" ry="6.5" transform="rotate(22 27 23)" fill="#7d9b63" stroke="#52784e" strokeWidth="1.2" />
        <path d="m13 23 1-1m11-3 1-1" stroke={shine} strokeWidth="2.2" opacity=".85" />
      </>}
      {figure === "pasta" && <>
        <path d="M7 21c0-8 26-8 26 0v8c0 9-26 9-26 0v-8Z" fill="#e4ac62" stroke="#be8551" strokeWidth="1.2" />
        <ellipse cx="20" cy="21" rx="13" ry="6" fill="#f3d193" stroke="#c2935d" strokeWidth="1.2" />
        <path d="M12 19c4-4 5 4 9 0s5 3 8-1m-19 6c5-3 7 5 13-1 2-2 4 2 5 1" stroke="#cc874a" strokeWidth="2.3" />
        <path d="m17 15 2-2m6 1 2 2" stroke="#7d9d60" strokeWidth="2" />
      </>}
      {figure === "herb" && <>
        <path d="M20 35V12" stroke="#5d9067" strokeWidth="2" />
        <path d="M20 27c-10-1-15-9-14-12 7-2 13 4 14 12Zm0-8c-1-9 4-13 10-13 2 6-2 12-10 13Zm0 14c3-9 9-12 14-10 0 7-5 10-14 10Z" fill="#78b48c" stroke="#509768" strokeWidth="1.3" />
        <path d="M9 18c4 2 7 5 11 9m6-15-6 7m9 9-9 5" stroke="#4d8f67" strokeWidth="1.1" />
      </>}
      {figure === "pepper" && <>
        <path d="M22 9c-7-3-14 1-15 9-1 8 4 15 12 15 9 0 15-7 14-15-1-7-5-10-11-9Z" fill="#e65e48" stroke="#b9473b" strokeWidth="1.2" />
        <path d="M19 10c-2-5 0-7 5-7" stroke="#66865c" strokeWidth="2.7" />
        <path d="M15 13c-2 5-1 13 0 17m10-17c3 5 2 13 0 17" stroke="#cd4d40" strokeWidth="1.5" />
        <path d="M11 19c0-3 2-5 4-6" stroke={shine} strokeWidth="2" opacity=".7" />
      </>}
      {figure === "lemon" && <>
        <path d="M8 19c3-9 11-13 20-9l5 5c2 9-3 17-12 19-8 2-15-4-16-11l3-4Z" fill="#f4d36e" stroke="#d7ac45" strokeWidth="1.2" />
        <path d="M9 19c4-6 10-8 14-8" stroke={shine} strokeWidth="2" opacity=".7" />
        <path d="M30 13c3-3 6-2 7 1-2 3-3 3-5 3" fill="#e9c351" stroke="#d5a63e" strokeWidth="1.1" />
      </>}
      {figure === "egg" && <>
        <path d="M21 5c-7 0-14 10-14 20 0 7 5 11 13 11 9 0 14-5 14-12 0-9-6-19-13-19Z" fill="#f4e9d5" stroke="#cbbda4" strokeWidth="1.3" />
        <path d="M13 23c0-6 2-11 6-13" stroke={shine} strokeWidth="2.5" opacity=".8" />
      </>}
      {figure === "milk" && <>
        <path d="M13 7h15l3 8v18c-6 2-13 2-19 0V15l1-8Z" fill="#e3edf3" stroke="#a6c1cf" strokeWidth="1.2" />
        <path d="M13 7l7 6 8-6m-8 6v21" stroke="#a6c1cf" strokeWidth="1.1" />
        <path d="M14 18h15v9H14z" fill="#b4d9e5" opacity=".75" />
        <path d="m15 10 2 2m-1 9v3" stroke={shine} strokeWidth="2" opacity=".85" />
      </>}
      {figure === "bean" && <>
        <path d="M17 8c-7-2-13 3-13 10 0 9 8 14 15 10 4-3 4-8 0-12-2-2-3-6-2-8Z" fill="#c7a47d" stroke="#9a7858" strokeWidth="1.2" />
        <path d="M30 14c-7-3-13 3-12 10 0 8 6 12 13 9 5-3 6-8 2-12-3-2-4-4-3-7Z" fill="#a98368" stroke="#87614c" strokeWidth="1.2" />
        <path d="M9 15c-2 3-2 5-1 7m16 3c0 3 2 5 4 6" stroke={shine} strokeWidth="1.8" opacity=".5" />
      </>}
      {figure === "spice" && <>
        <path d="M13 12h14l2 5-1 17H12l-1-17 2-5Z" fill="#e9d7bf" stroke="#b6a38c" strokeWidth="1.2" />
        <path d="M12 7h16v5H12z" fill="#bca88c" stroke="#99856d" strokeWidth="1.1" />
        <path d="M13 22h14v10H13z" fill="#b38464" />
        <circle cx="17" cy="26" r="1.5" fill="#744e40" /><circle cx="23" cy="28" r="1.5" fill="#744e40" />
      </>}
      {figure === "potato" && <>
        <path d="M10 13c5-8 16-8 21-1 5 7 2 16-5 20-8 4-17 2-20-5-2-6 1-11 4-14Z" fill="#cfa978" stroke="#a48257" strokeWidth="1.2" />
        <circle cx="13" cy="22" r="1.3" fill="#93724f" /><circle cx="24" cy="14" r="1.4" fill="#93724f" /><circle cx="23" cy="29" r="1.1" fill="#93724f" />
        <path d="M10 17c2-4 4-6 8-6" stroke={shine} strokeWidth="2" opacity=".48" />
      </>}
      {figure === "fish" && <>
        <path d="M7 20c6-9 15-10 23-3l6-5v17l-6-5c-8 7-17 6-23-4Z" fill="#83bdc5" stroke="#5894a0" strokeWidth="1.3" />
        <path d="M7 20c4 2 6 6 5 10m-5-10 5-10" stroke="#5894a0" strokeWidth="1.1" />
        <circle cx="13" cy="18" r="1.5" fill="#4d727a" />
        <path d="M18 17c4 2 6 4 6 7m-4-13 4 5" stroke={shine} strokeWidth="1.8" opacity=".55" />
      </>}
      {figure === "bread" && <>
        <path d="M7 15c-1-8 8-13 14-9 6-3 14 3 12 10v17H7V15Z" fill="#d8a36c" stroke="#b67d4e" strokeWidth="1.3" />
        <path d="M11 18c-2-7 5-11 10-8 5-2 9 3 8 9v10H11V18Z" fill="#f2d2a0" />
        <path d="M16 16v4m8-4v4" stroke="#e5b988" strokeWidth="1.4" />
      </>}
      {figure === "plate" && <>
        <ellipse cx="20" cy="21" rx="15" ry="12" fill="#f2eee7" stroke="#a7afa5" strokeWidth="1.2" />
        <ellipse cx="20" cy="21" rx="10" ry="8" fill="#ffffff" stroke="#cfd5c9" strokeWidth="1.1" />
        <path d="M30 7v8m-3-8v5m6-5v5m-3 3v18" stroke="#b3aaa0" strokeWidth="1.5" />
        <path d="M8 8c3 2 3 6 0 8v17" stroke="#b3aaa0" strokeWidth="1.5" />
      </>}
    </svg>
  </span>;
}
