import { lokmaIngredient } from "@/lib/lokma-emoji";

/**
 * Lokma Miniatures — independent vector food illustrations.
 * Not platform emoji, not an external font. Drawn with a consistent soft
 * palette, natural contours, small highlights and subtle outlines.
 * The first curated food families are provided here; unknown ingredients
 * use a neutral plate illustration rather than an incorrect food identity.
 * Decorative only: source ingredient names and amounts remain text.
 */
type Props = { name: string; size?: "sm" | "md" | "lg"; className?: string; previewFigure?: Figure };

type Figure = "tomato" | "carrot" | "onion" | "garlic" | "cheese" | "olive"
 | "pasta" | "herb" | "pepper" | "lemon" | "egg" | "milk"
 | "bean" | "spice" | "potato" | "fish" | "bread" | "plate"
 | "broccoli" | "eggplant" | "mushroom" | "cucumber" | "greens"
 | "chicken" | "meat" | "shrimp" | "butter" | "rice" | "strawberry"
 | "orange" | "apple" | "banana" | "nut" | "honey" | "chocolate" | "sugar"
 | "cherry" | "berry" | "pear" | "grape" | "watermelon" | "peach" | "kiwi"
 | "pineapple" | "avocado" | "corn" | "coffee" | "tea" | "liquid"
 | "leek" | "celery" | "cauliflower" | "artichoke" | "radish" | "beet"
 | "pumpkin" | "asparagus" | "okra" | "zucchini" | "pea" | "greenbean"
 | "yogurt" | "oil" | "flour" | "baking" | "sesame" | "sauce" | "paste"
 | "greenlentil" | "redlentil" | "bellpepper" | "kapiapepper" | "redpepper" | "carliston" | "sivri" | "sweetpepper" | "salt" | "paprikaspice" | "cumin" | "cinnamon" | "vanilla" | "dill" | "arugula" | "walnut" | "almond" | "cabbage" | "melon" | "oliveoil" | "greenapple" | "blackpepper";

const FIGURES: Record<string, Figure> = {
  "🍅": "tomato", "🥕": "carrot", "🧅": "onion", "🧄": "garlic",
  "🧀": "cheese", "🫒": "olive", "🍝": "pasta", "🌿": "herb",
  "🌶️": "pepper", "🍋": "lemon", "🥚": "egg", "🥛": "milk",
  "🫘": "bean", "🧂": "spice", "🥔": "potato", "🐟": "fish",
  "🍞": "bread", "🥦": "broccoli", "🍆": "eggplant",
  "🍄": "mushroom", "🥒": "cucumber", "🥬": "greens",
  "🍗": "chicken", "🥩": "meat", "🍤": "shrimp",
  "🧈": "butter", "🍚": "rice", "🍓": "strawberry",
  "🍊": "orange", "🍎": "apple", "🍌": "banana",
  "🌰": "nut", "🥜": "nut", "🍯": "honey",
  "🍫": "chocolate", "🍬": "sugar",
  "🍒": "cherry", "🫐": "berry", "🍐": "pear", "🍇": "grape",
  "🍉": "watermelon", "🍑": "peach", "🥝": "kiwi", "🍍": "pineapple",
  "🥑": "avocado", "🌽": "corn", "☕": "coffee", "🍵": "tea", "🫗": "liquid",
};

export default function LokmaIngredientIcon({ name, size = "md", className = "", previewFigure }: Props) {
  const ingredient = lokmaIngredient(name);
  // Catalog preview is explicit; editorial ingredient names continue to resolve semantically.
  const figure = previewFigure || (ingredient.art || FIGURES[ingredient.emoji] || "plate") as Figure;
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
        <path d="M19 5c0 3 2 4 2 9m-2-8c-1 3-2 5-2 8" stroke="#acaa8d" strokeWidth="1.8"/>
        <path d="M20 12c-5-4-9 0-11 5C5 22 7 31 12 34c3 2 6 1 8 1 4 1 7 1 10-2 5-5 5-12 1-17-3-5-7-7-11-4Z" fill="#f7efdf" stroke="#bcb59f" strokeWidth="1.4"/>
        <path d="M20 14c-5 3-5 14 0 21m0-21c5 3 5 14 0 21m-10-14c-2 6-1 10 4 12m16-12c2 6 1 10-4 12" stroke="#d9c9ad" strokeWidth="1.3"/>
        <path d="M12 19c1-3 3-4 5-5" stroke="#ffffff" strokeWidth="2.3"/>
        <path d="m14 36-2 2m8-2v2m7-3 2 2" stroke="#c9b999" strokeWidth="1.1"/>
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
        <path d="M6 21h28l-3 10c-1 3-3 4-6 4H15c-3 0-5-1-6-4L6 21Z" fill="#efe7da" stroke="#c4b49b" strokeWidth="1.2"/>
        <path d="M7 21c0-6 6-10 13-10s13 4 13 10H7Z" fill="#f4d48c" stroke="#d2a656" strokeWidth="1.2"/>
        <path d="M10 19c3-4 5 2 8-2s5 2 8-2 4 1 5 2M12 15c2-2 4 1 6-1s4 1 6-1" stroke="#d9a54f" strokeWidth="1.5"/>
        <path d="M5 21h30" stroke="#c4b49b" strokeWidth="1.3"/>
        <path d="M22 10c3-3 7-3 9-1-3 3-6 3-9 1Z" fill="#7fae74" stroke="#56875e" strokeWidth="1"/>
        <path d="M11 26c1 3 3 5 6 6" stroke="#ffffff" strokeWidth="1.8" opacity=".8"/>
      </>}
      {figure === "herb" && <>
        <path d="M20 36c-1-10-1-16-3-23m3 23c5-10 9-16 12-23m-12 16L8 18" stroke="#669567" strokeWidth="2"/>
        <path d="M16 12C9 11 7 6 10 3c4-2 7 1 7 4 4-4 8-2 9 1 0 3-3 5-7 4-1 3-4 4-6 2m-2 7C5 19 3 15 6 12c3-2 7 0 8 3 3-3 8-2 9 2 0 3-5 5-9 3-2 4-6 3-7 1" fill="#85b481" stroke="#558c60" strokeWidth="1.2"/>
        <path d="M30 15c-4-1-5-5-2-8 4-2 7 1 7 4 3-3 5 0 4 3-2 3-5 4-7 2-2 4-6 5-8 2-1-3 1-5 6-3Z" fill="#95c18e" stroke="#568c60" strokeWidth="1.1"/>
        <path d="M14 8c4 5 5 9 6 14m-9-7 9 15" stroke="#cbe1aa" strokeWidth="1.2"/>
      </>}
      {figure === "pepper" && <>
        <path d="M12 9c0-3 2-5 5-6" stroke="#55835a" strokeWidth="2.4"/>
        <path d="M8 13c-1 7 2 13 8 17 5 3 11 5 19 5-3-3-7-6-10-10-4-4-6-9-7-13-3-2-7-2-10 1Z" fill="#e45a4b" stroke="#b8433a" strokeWidth="1.4"/>
        <path d="M7 12c2-3 7-4 11-1l-1 3c-3 1-6 1-9 0l-1-2Z" fill="#6ea56f" stroke="#4d8460" strokeWidth="1.1"/>
        <path d="M11 17c0 5 3 9 7 12" stroke="#ffd6c8" strokeWidth="1.9" opacity=".9"/>
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

      {figure === "broccoli" && <>
        <path d="M18 22h7l-1 13h-6l-1-13Z" fill="#95ba78" stroke="#5b9263" strokeWidth="1.2" />
        <path d="M7 23c-5-5-1-12 5-12 0-7 10-9 13-3 7-2 13 6 8 11 3 6-2 10-8 10H14c-4 0-8-2-7-6Z" fill="#76b27b" stroke="#4e9467" strokeWidth="1.3" />
        <path d="M11 21c3-6 8-5 10-2m3-6c2 0 5 2 5 5" stroke="#a3d1a1" strokeWidth="2" opacity=".85" />
      </>}
      {figure === "eggplant" && <>
        <path d="M16 13C9 17 5 28 10 33c4 5 12 3 19-4 8-8 8-17-1-19-3-1-8 0-12 3Z" fill="#78558f" stroke="#513a72" strokeWidth="1.6"/>
        <path d="M11 23c-2 5-1 7 0 9" stroke="#b69ac7" strokeWidth="2.4"/>
        <path d="M15 16c-2-4-1-8 4-11l2 7c5-3 9-3 12 0-4 2-6 4-7 7l-5-3-4 6-2-6Z" fill="#76a06a" stroke="#4f7b55" strokeWidth="1.25"/>
        <path d="M19 8c3-4 5-4 8-5" stroke="#62875d" strokeWidth="2.5"/>
        <path d="M25 25c3-3 4-6 4-9" stroke="#8d6da8" strokeWidth="1.5"/>
      </>}
      {figure === "mushroom" && <>
        <path d="M14 21h12l-2 14h-8l-2-14Z" fill="#f0e0ca" stroke="#bea78a" strokeWidth="1.3"/>
        <path d="M6 22C6 13 12 7 20 7s15 6 15 15H6Z" fill="#c99570" stroke="#9b7459" strokeWidth="1.5"/>
        <path d="M6 22h29c-2 4-7 6-14 6-8 0-13-2-15-6Z" fill="#f2e0cf" stroke="#b9a18c" strokeWidth="1.2"/>
        <path d="M11 17c2-4 5-6 8-7" stroke="#fbe3c9" strokeWidth="2.2"/>
        <circle cx="27" cy="17" r="2" fill="#eed3b9"/>
        <path d="M24 34h12" stroke="#9ab387" strokeWidth="1.4"/>
      </>}
      {figure === "cucumber" && <>
        <path d="M7 26C6 19 13 11 22 9c6-2 12 1 12 6 0 8-9 17-19 18-4 0-7-2-8-7Z" fill="#6eab68" stroke="#4c8b55" strokeWidth="1.6"/>
        <path d="M11 27C13 18 21 12 30 13" stroke="#acd08d" strokeWidth="2.4"/>
        <path d="M16 22l2 1m6-7 2 1m-8 11 2 1m6-6 2 1" stroke="#3e7b4c" strokeWidth="1.35"/>
        <ellipse cx="29" cy="14" rx="3.5" ry="2.5" transform="rotate(-35 29 14)" fill="#8dc17b" stroke="#659e5f" strokeWidth=".8"/>
        <path d="m34 13 3-2" stroke="#6b965b" strokeWidth="1.8"/>
      </>}
      {figure === "greens" && <>
        <path d="M20 34C9 35 4 28 5 20c-3-4 0-10 5-10 0-6 6-9 10-5 5-4 11-1 11 5 6 0 8 7 5 11 1 7-6 14-16 13Z" fill="#91c084" stroke="#5c9b69" strokeWidth="1.4"/>
        <path d="M20 31c-10-6-11-13-7-19 4 0 6 2 8 5 1-7 7-9 11-5-2 4-3 5-5 7 5 0 8 4 6 7-5 6-8 6-13 5Z" fill="#b7d7a3" stroke="#77ad76" strokeWidth="1.3"/>
        <path d="M20 33c-5-5-6-13 0-19 5 5 6 12 0 19Z" fill="#d7e7b9" stroke="#94ba8c" strokeWidth="1.1"/>
        <path d="m20 32-1-11m-10 1 10 9m13-11-11 11" stroke="#82ac75" strokeWidth="1.2"/>
      </>}
      {figure === "chicken" && <>
        <path d="M11 14c6-7 18-6 21 3 3 8-5 15-13 14-9-1-15-10-8-17Z" fill="#d49b65" stroke="#a87750" strokeWidth="1.4" />
        <path d="m14 27-5 4-4-2c-4-1-6 3-3 5 0 3 4 4 6 2l5-5" fill="#efe0c9" stroke="#bdad97" strokeWidth="1.2" />
        <path d="M14 16c4-4 9-4 12-1" stroke="#f4ce9a" strokeWidth="2" opacity=".8" />
      </>}
      {figure === "meat" && <>
        <path d="M7 15c4-7 15-9 22-5 6 3 8 11 5 17-3 7-12 10-20 8-7-2-11-8-10-14 0-2 1-4 3-6Z" fill="#c8625a" stroke="#9a4943" strokeWidth="1.4"/>
        <path d="M10 15c4-5 13-7 19-3" stroke="#f3cdbd" strokeWidth="2.4"/>
        <path d="M13 23c3-1 5 1 8 0m-6 5c2 1 5 1 7-1" stroke="#e8a093" strokeWidth="1.4"/>
        <circle cx="27" cy="22" r="3.2" fill="#f6eadb" stroke="#c9b9a3" strokeWidth="1.1"/>
      </>}
      {figure === "shrimp" && <>
        <path d="M31 10c-9-4-20 0-22 8-3 8 2 15 10 17l3-6c-6-1-9-6-6-10 4-4 8-4 12-2l3-7Z" fill="#ec9e81" stroke="#d47e71" strokeWidth="1.3" />
        <path d="m18 34-7 2-5-5 3-6m2-7 4 3m5-8 3 6m-1-8 3 6" stroke="#d47e71" strokeWidth="1.5" />
        <circle cx="29" cy="12" r="1.5" fill="#8b544b" />
        <path d="M11 19c1 4 3 7 6 9" stroke="#ffe0c6" strokeWidth="2" />
      </>}
      {figure === "butter" && <>
        <path d="M5 20 19 13l16 7-14 9L5 20Z" fill="#fff1af" stroke="#d6bb65" strokeWidth="1.2" />
        <path d="M5 20v8l16 8v-7L5 20Z" fill="#e7c976" stroke="#c5a858" strokeWidth="1.2" />
        <path d="m21 29 14-9v8l-14 8v-7Z" fill="#f5d784" stroke="#c5a858" strokeWidth="1.2" />
        <path d="m10 20 9-5" stroke="#fff8d8" strokeWidth="2" />
      </>}
      {figure === "rice" && <>
        <path d="M6 21h28l-3 12H9L6 21Z" fill="#d2a77e" stroke="#a98161" strokeWidth="1.2" />
        <path d="M6 21c0-8 28-8 28 0 0 7-28 7-28 0Z" fill="#f2ece0" stroke="#c6b9a2" strokeWidth="1.2" />
        <path d="m13 17 3 2m4-5 2 3m7 2-3 2m-9 1 4 1" stroke="#ffffff" strokeWidth="3" />
      </>}
      {figure === "strawberry" && <>
        <path d="M11 14c-6 4-5 13 1 19 4 5 10 4 14-1 7-7 8-15 1-18-5-2-11-2-16 0Z" fill="#e76964" stroke="#b74c4d" strokeWidth="1.3" />
        <path d="M12 14c2-6 5-6 8-4 4-4 7-2 9 3l-8 3-9-2Z" fill="#7dac74" stroke="#56875e" strokeWidth="1.2" />
        <path d="m15 21 1 2m6-4 1 2m4 5-1 2m-8 0 1 2" stroke="#f8cf95" strokeWidth="1.8" />
      </>}
      {figure === "orange" && <>
        <circle cx="20" cy="22" r="14" fill="#f3ac55" stroke="#d8893d" strokeWidth="1.3" />
        <path d="M19 9c1-6 7-6 10-3-1 4-5 6-9 5" fill="#8caf72" stroke="#608a57" strokeWidth="1.1" />
        <path d="M10 19c1-4 4-7 7-8" stroke="#ffe0a1" strokeWidth="2.1" />
        <circle cx="25" cy="28" r="2" fill="#e99c4d" opacity=".8" />
      </>}
      {figure === "apple" && <>
        <path d="M20 12C10 7 5 14 6 23c0 9 8 14 14 11 6 3 14-3 14-12 0-9-7-15-14-10Z" fill="#db7363" stroke="#b4534a" strokeWidth="1.3" />
        <path d="M20 11c0-3 1-5 3-7m-3 7c-3-7-9-7-11-5 1 5 6 8 11 5Z" fill="#7fae79" stroke="#588b5d" strokeWidth="1.1" />
        <path d="M11 17c-2 4-1 8 0 11" stroke="#ffd2b6" strokeWidth="2.2" opacity=".8" />
      </>}
      {figure === "banana" && <>
        <path d="M7 8c1 13 9 24 20 24 6 0 10-5 10-12-6 9-12 9-19 4-4-3-8-9-8-16H7Z" fill="#f0cc67" stroke="#cda244" strokeWidth="1.5"/>
        <path d="M11 11c2 9 8 17 17 17 3 0 5-2 7-5" stroke="#fff0b3" strokeWidth="2.7"/>
        <path d="M9 8 7 5m29 15 2-3" stroke="#8c6e43" strokeWidth="2.2"/>
        <path d="M9 20c4 10 12 15 21 12" stroke="#dfa847" strokeWidth="1.35"/>
      </>}
      {figure === "nut" && <>
        <path d="M20 10c-8 0-13 7-13 14 0 7 6 12 13 12s13-5 13-12c0-7-5-14-13-14Z" fill="#c58b56" stroke="#93653e" strokeWidth="1.3"/>
        <path d="M9 18c2-5 6-8 11-8s9 3 11 8c-3 2-7 3-11 3s-8-1-11-3Z" fill="#e3c597" stroke="#b08a5c" strokeWidth="1.2"/>
        <path d="M20 10c0-2 1-4 3-5" stroke="#93653e" strokeWidth="1.6"/>
        <path d="M12 25c0 4 3 7 6 8" stroke="#ecc195" strokeWidth="1.9"/>
      </>}
      {figure === "honey" && <>
        <rect x="11" y="14" width="20" height="22" rx="4" fill="#eeb861" stroke="#bb894b" strokeWidth="1.3"/>
        <rect x="9" y="10" width="24" height="6" rx="2" fill="#c49b70" stroke="#997557" strokeWidth="1.2"/>
        <path d="M14 20h14v12H14V20Z" fill="#f9d88f" stroke="#dba858" strokeWidth=".8"/>
        <path d="M16 24c2-4 7-4 10 0-3 5-7 5-10 0Z" fill="#e0a64a"/>
        <path d="M3 7 16 12m-7-7 9 3" stroke="#966b4b" strokeWidth="2"/>
        <path d="M16 12c2 4-1 8-3 7-4-1-3-4 0-7" fill="#ebb44b" stroke="#c79443" strokeWidth="1"/>
      </>}
      {figure === "chocolate" && <>
        <path d="M7 9h26v25H7V9Z" fill="#825848" stroke="#624137" strokeWidth="1.3" />
        <path d="M9 11h22v21H9z" fill="#a46c50" />
        <path d="M20 11v21M9 21h22" stroke="#674638" strokeWidth="2.2" />
        <path d="m13 14 3-1m9 11 3-1" stroke="#db9b72" strokeWidth="1.6" />
      </>}
      {figure === "sugar" && <>
        <path d="m8 17 9-5 9 5-9 5-9-5Z" fill="#ffffff" stroke="#93a9b2" strokeWidth="1.3"/>
        <path d="m8 17 9 5v11l-9-5V17Z" fill="#dfe8ec" stroke="#93a9b2" strokeWidth="1.3"/>
        <path d="m17 22 9-5v11l-9 5V22Z" fill="#eef3f5" stroke="#93a9b2" strokeWidth="1.3"/>
        <path d="m24 26 6-3 6 3-6 3-6-3Z" fill="#ffffff" stroke="#93a9b2" strokeWidth="1.2"/>
        <path d="m24 26 6 3v6l-6-3v-6Z" fill="#dfe8ec" stroke="#93a9b2" strokeWidth="1.2"/>
        <path d="m30 29 6-3v6l-6 3v-6Z" fill="#eef3f5" stroke="#93a9b2" strokeWidth="1.2"/>
        <path d="M30 8v4m-2-2h4" stroke="#c9a85a" strokeWidth="1.4"/>
      </>}

      {figure === "cherry" && <>
        <path d="M19 16c2-8 4-10 12-11m-13 13C13 9 13 7 11 5" stroke="#729463" strokeWidth="2" />
        <path d="M10 21c6-5 13 1 12 8-2 8-13 9-17 3-3-5 0-9 5-11Z" fill="#d95f64" stroke="#af464e" strokeWidth="1.3" />
        <path d="M26 20c8-3 12 4 9 11-3 7-14 6-16 0-2-4 1-9 7-11Z" fill="#c95158" stroke="#a13c49" strokeWidth="1.3" />
        <path d="M10 25c1-2 3-3 5-3m11 2 3-1" stroke="#ffd8bf" strokeWidth="2" opacity=".85"/>
      </>}
      {figure === "berry" && <>
        <g fill="#6c789f" stroke="#526383" strokeWidth="1">
          <circle cx="15" cy="13" r="6"/><circle cx="25" cy="14" r="6"/><circle cx="11" cy="23" r="6"/><circle cx="21" cy="23" r="7"/><circle cx="30" cy="24" r="6"/>
        </g>
        <path d="M17 8c2-4 6-5 8-4m-3 0 2 6" stroke="#83a17a" strokeWidth="2"/>
        <path d="m11 21 2-2m7 2 2-2m6 4 2-2" stroke="#d0d7ea" strokeWidth="1.7" opacity=".8"/>
      </>}
      {figure === "pear" && <>
        <path d="M17 10c0-3 1-6 5-7" stroke="#6f8d55" strokeWidth="2"/>
        <path d="M20 13c-6-1-7 4-8 9-7 9-2 16 8 16s15-7 9-16c-1-5-2-10-9-9Z" fill="#b2c879" stroke="#8ea55e" strokeWidth="1.3"/>
        <path d="M17 13c-2-5-7-5-9-4 1 5 4 6 9 4Z" fill="#7ca474" stroke="#5b8a5f" strokeWidth="1.2"/>
        <path d="M12 27c-1 4 2 7 5 8" stroke="#e8eeb8" strokeWidth="2.1"/>
      </>}
      {figure === "grape" && <>
        <path d="M21 11c1-5 3-6 8-7m-8 9c-5-6-10-6-12-5 0 5 5 8 12 7" fill="#81a777" stroke="#608b69" strokeWidth="1.3"/>
        <g fill="#9484b4" stroke="#756799" strokeWidth="1">
          <circle cx="16" cy="16" r="5"/><circle cx="26" cy="16" r="5"/><circle cx="12" cy="25" r="5"/><circle cx="21" cy="25" r="6"/><circle cx="29" cy="24" r="5"/><circle cx="21" cy="33" r="5"/>
        </g>
        <path d="M14 14h2m8 1h2m-7 9h2" stroke="#ddd4ea" strokeWidth="1.9"/>
      </>}
      {figure === "watermelon" && <>
        <path d="M5 27 19 6 36 27H5Z" fill="#e77e75" stroke="#c75e58" strokeWidth="1.2"/>
        <path d="M5 27h31l-2 6H7l-2-6Z" fill="#79ac7a" stroke="#598b63" strokeWidth="1.2"/>
        <path d="M7 28h27" stroke="#e6eedb" strokeWidth="2.2"/>
        <path d="m19 15-1 4m9 3-2 4m-13-3 2 3" stroke="#8d584f" strokeWidth="2" />
      </>}
      {figure === "peach" && <>
        <path d="M20 12c-1-5 0-7 3-9m-3 9c-5-7-10-8-13-5 2 6 7 8 13 5m2 0c3-6 8-7 12-5-2 6-5 7-12 5" fill="#7ea575" stroke="#56865d" strokeWidth="1.2"/>
        <path d="M19 12C9 7 5 15 6 24c1 10 8 14 14 11 6 3 13-1 14-10 1-9-5-16-15-13Z" fill="#f4b184" stroke="#dc7d68" strokeWidth="1.4"/>
        <path d="M20 15c-5 6-5 13 0 20" stroke="#dc816e" strokeWidth="1.8"/>
        <path d="M9 18c2-4 5-5 7-5" stroke="#ffe1ae" strokeWidth="2.6"/>
        <path d="M25 31c4-2 5-4 5-8" stroke="#ef9e7b" strokeWidth="1.5"/>
      </>}
      {figure === "kiwi" && <>
        <ellipse cx="20" cy="22" rx="15" ry="13" fill="#a48459" stroke="#816747" strokeWidth="1.2"/>
        <ellipse cx="20" cy="22" rx="12" ry="10" fill="#a8c576" stroke="#80a15a" strokeWidth="1.1"/>
        <ellipse cx="20" cy="22" rx="4" ry="3.5" fill="#f5f0cf"/>
        <path d="m20 11-1 6m-7 2 5 2m4 6-1 6m6-12 5-2m-3 8-4-3m-9-1-4 4" stroke="#6e7652" strokeWidth="1.8" />
      </>}
      {figure === "pineapple" && <>
        <path d="M20 13 12 5l7 3V2l4 7 7-4-6 9" fill="#6ba078" stroke="#4c8060" strokeWidth="1.4"/>
        <path d="M20 13c-8-2-12 3-12 11 0 9 4 14 12 14s12-6 12-14c0-8-5-13-12-11Z" fill="#e8bf6b" stroke="#bb9452" strokeWidth="1.4"/>
        <path d="m11 17 18 17M9 24l15 13m-8-23 16 14m-23 5 20-18m-15 21 18-16m-10 17 10-10" stroke="#b9954f" strokeWidth="1.5"/>
        <path d="M12 19c2-3 4-5 7-5" stroke="#f8de98" strokeWidth="2"/>
        <g fill="#fff1ba"><circle cx="16" cy="20" r=".9"/><circle cx="25" cy="22" r=".9"/><circle cx="18" cy="30" r=".9"/></g>
      </>}
      {figure === "avocado" && <>
        <path d="M22 5c-8-1-11 8-12 14-5 9-2 18 9 19 10 1 17-7 14-16-1-7-3-16-11-17Z" fill="#709b65" stroke="#567e59" strokeWidth="1.3"/>
        <path d="M21 10c-6 0-9 8-9 14-2 7 2 12 9 12 8 0 12-7 10-14-2-7-4-12-10-12Z" fill="#c8d794" stroke="#9eaf7b" strokeWidth="1"/>
        <circle cx="21" cy="26" r="6" fill="#a97955" stroke="#895d47" strokeWidth="1.1"/>
        <path d="M14 20c1-3 2-5 4-6" stroke="#f1f1c8" strokeWidth="2"/>
      </>}
      {figure === "corn" && <>
        <path d="M17 7c5-2 10 0 12 7 4 10 0 18-9 22-9-5-13-14-9-23 1-3 3-5 6-6Z" fill="#efd079" stroke="#c9a451" strokeWidth="1.3"/>
        <g fill="#f6dc94" stroke="#dbb866" strokeWidth=".65">
          <ellipse cx="17" cy="14" rx="2" ry="2.5"/><ellipse cx="23" cy="14" rx="2" ry="2.5"/>
          <ellipse cx="15" cy="20" rx="2" ry="2.6"/><ellipse cx="21" cy="20" rx="2" ry="2.6"/><ellipse cx="27" cy="20" rx="2" ry="2.5"/>
          <ellipse cx="17" cy="26" rx="2" ry="2.5"/><ellipse cx="23" cy="26" rx="2" ry="2.5"/>
        </g>
        <path d="M13 13C4 20 8 31 18 37c0-9-1-18-5-24Zm15 0c8 5 6 16-8 24 3-9 6-16 8-24Z" fill="#83ad79" stroke="#60926a" strokeWidth="1.4"/>
        <path d="M12 24c3 4 4 6 6 9m11-10-8 11" stroke="#b8d3a5" strokeWidth="1.4"/>
      </>}
      {figure === "coffee" && <>
        <path d="M8 15h23v10c0 9-4 12-12 12S8 33 8 25V15Z" fill="#f2e1cb" stroke="#bfaa94" strokeWidth="1.2"/>
        <path d="M31 18c9-1 9 10 0 10" stroke="#c5a78d" strokeWidth="3" />
        <ellipse cx="19.5" cy="15" rx="11.5" ry="4" fill="#946d59" stroke="#755542" strokeWidth="1.2"/>
        <path d="M16 10c-3-4 3-4 0-8m7 8c-3-4 3-5 0-8" stroke="#cab6a5" strokeWidth="1.5"/>
      </>}
      {figure === "tea" && <>
        <path d="M7 17h24v8c0 9-5 12-12 12S7 34 7 25v-8Z" fill="#d4ece0" stroke="#95b2a5" strokeWidth="1.2"/>
        <path d="M31 21c8-2 7 10 0 9" stroke="#9cbcae" strokeWidth="2.5"/>
        <ellipse cx="19" cy="17" rx="12" ry="3.7" fill="#a7be8d" stroke="#72905d" strokeWidth="1.2"/>
        <path d="M16 10c-2-4 3-5 1-8m6 8c-2-4 3-5 1-8" stroke="#c5cbb4" strokeWidth="1.5"/>
      </>}
      {figure === "liquid" && <>
        <path d="M20 5c3 7 11 15 11 22 0 8-5 12-12 12S7 34 7 27C7 20 16 12 20 5Z" fill="#91c7d5" stroke="#5ea3b6" strokeWidth="1.3"/>
        <path d="M13 27c0-4 3-8 5-11" stroke="#e4f8f8" strokeWidth="2.4" opacity=".9"/>
        <path d="M22 34c4-1 5-3 5-6" stroke="#5ea3b6" strokeWidth="1.4" opacity=".6"/>
      </>}

      {figure === "leek" && <>
        <path d="M14 13 7 5m10 8-3-10m6 10 3-9m0 11 9-8" stroke="#7ca776" strokeWidth="3" strokeLinecap="round"/>
        <path d="m14 12 9 2-3 23-9-2 3-23Z" fill="#dbe6b9" stroke="#9bb48b" strokeWidth="1.2"/>
        <path d="m13 24 9 2m-10 5 9 2" stroke="#a8c994" strokeWidth="1.4" />
      </>}
      {figure === "celery" && <>
        <path d="m17 13-2 23m6-23 1 23m3-23 5 22" stroke="#83b285" strokeWidth="3.3"/>
        <path d="M17 14C8 13 5 8 8 5c5-1 9 2 9 9Zm4-1C18 7 20 3 26 3c3 5 0 10-5 10Zm4 2c2-6 7-8 11-6 0 6-5 10-11 6Z" fill="#80b786" stroke="#548e64" strokeWidth="1.1" />
        <path d="m14 29 14 1m-13 3 14 1" stroke="#cde2ad" strokeWidth="1.2"/>
      </>}
      {figure === "cauliflower" && <>
        <path d="m15 25-3 8 8 4 9-4-5-9" fill="#8fb58c" stroke="#638d6c" strokeWidth="1.2"/>
        <path d="M6 22c-4-5 2-11 7-10 0-7 9-10 13-5 7-2 11 5 8 10 7 4 4 12-3 12H13c-6 0-9-3-7-7Z" fill="#f1e8d5" stroke="#c9bda5" strokeWidth="1.2"/>
        <path d="M12 18c1-4 5-5 8-3m7-3c-3 1-4 3-4 6m6 6c-3-3-6-3-9-1" stroke="#d7ccb7" strokeWidth="1.4"/>
      </>}
      {figure === "artichoke" && <>
        <path d="M20 35v-7" stroke="#588764" strokeWidth="3"/>
        <path d="M20 31C6 27 3 20 11 16c-4-7 4-12 9-8 6-5 13 1 10 8 8 5 5 12-10 15Z" fill="#92b58c" stroke="#608f6e" strokeWidth="1.3"/>
        <path d="M20 8c-6 8-5 13 0 22 6-8 7-16 0-22Zm-9 8c4 2 7 6 9 14m10-14c-5 3-7 7-10 14" stroke="#d0dfb8" strokeWidth="1.4"/>
      </>}
      {figure === "radish" && <>
        <path d="M20 9c-4-7-9-7-11-5 0 6 5 9 11 8 3-7 8-9 12-7-1 7-5 10-12 7Z" fill="#8ab282" stroke="#648e67" strokeWidth="1.2"/>
        <path d="M20 12C9 9 5 16 8 25c3 8 9 8 12 13 5-7 13-8 13-18 0-7-6-11-13-8Z" fill="#e36b79" stroke="#bb5263" strokeWidth="1.2"/>
        <path d="M12 18c2-3 4-3 6-3" stroke="#ffd9d0" strokeWidth="2.4"/>
        <path d="M20 35v3" stroke="#ddcbb6" strokeWidth="1.7"/>
      </>}
      {figure === "beet" && <>
        <path d="M20 13C9 8 5 18 8 27c3 7 10 8 12 12 4-5 13-8 13-17 0-7-6-12-13-9Z" fill="#9e5774" stroke="#7b425f" strokeWidth="1.3"/>
        <path d="m20 14-2-11m3 11c4-9 8-10 12-8-1 7-5 10-12 8-3-9-8-10-13-8 0 6 5 10 13 8Z" fill="#83a978" stroke="#5a8860" strokeWidth="1.1"/>
        <path d="M12 24c2 5 6 7 10 8m0-15c-4 7-5 13-3 18" stroke="#be7790" strokeWidth="1.4"/>
      </>}
      {figure === "pumpkin" && <>
        <path d="M20 12c-3-5-1-8 4-10" stroke="#658956" strokeWidth="2.5"/>
        <path d="M21 11c-8-4-15 2-16 11-2 10 5 15 15 15 10 0 17-5 15-15-1-9-7-14-14-11Z" fill="#eea052" stroke="#bd713e" strokeWidth="1.5"/>
        <path d="M20 11c-9 5-11 18 0 26m0-26c9 5 11 18 0 26M10 15c-4 7-2 16 2 20m18-20c4 7 2 16-2 20" stroke="#d27d42" strokeWidth="1.7"/>
        <path d="M22 11c4-6 10-5 12-2-3 4-7 6-12 2Z" fill="#84ad72" stroke="#5f8d5c" strokeWidth="1"/>
        <path d="M10 20c1-4 2-5 5-6" stroke="#ffd19a" strokeWidth="2.4"/>
      </>}
      {figure === "asparagus" && <>
        <path d="m10 35 7-23m3 23 1-26m8 27-3-25" stroke="#85ac7e" strokeWidth="4.5" />
        <path d="m17 5-5 11 7-1 3-11-5 1Zm7 0-4 11 7-1-3-10Zm5 3-1 10 6-2-5-8Z" fill="#8aaf7b" stroke="#5a8864" strokeWidth="1.1"/>
        <path d="m11 28 19 2m-19 4 20 1" stroke="#d7e3bb" strokeWidth="1.5" />
      </>}
      {figure === "okra" && <>
        <path d="M10 10c5-4 10-2 13 3 4 6 6 14 4 21-8-1-15-7-19-15-1-4-1-7 2-9Z" fill="#83b278" stroke="#568f61" strokeWidth="1.4"/>
        <path d="M10 11c2-5 6-7 10-6l-3 7m-8 4 17 16m-14-18 14 15" stroke="#c1dba3" strokeWidth="1.8"/>
        <path d="M23 13c5-2 13 2 13 9 0 6-6 10-13 7-5-3-6-12 0-16Z" fill="#75a66b" stroke="#4d8459" strokeWidth="1.2"/>
        <path d="m29 15 2 6-5 1-2-4m7 3 1 5-5 0-1-4m-2-1-3 2" stroke="#d7e9b4" strokeWidth="1.7"/>
        <circle cx="28" cy="22" r="1.8" fill="#f1e9c4"/>
      </>}
      {figure === "zucchini" && <>
        <path d="M6 24c1-8 10-13 21-13 6 0 9 3 8 8-2 8-11 14-22 14-5 0-8-3-7-9Z" fill="#78a977" stroke="#4a8559" strokeWidth="1.5"/>
        <path d="M11 25c7-8 16-11 21-9" stroke="#bbd7a4" strokeWidth="2.4"/>
        <path d="m29 11 4-5" stroke="#6d945e" strokeWidth="2.5"/>
        <ellipse cx="10" cy="27" rx="5" ry="6" transform="rotate(-38 10 27)" fill="#ddeac4" stroke="#76a16d" strokeWidth="1.3"/>
        <ellipse cx="10" cy="27" rx="2.4" ry="2.8" transform="rotate(-38 10 27)" fill="#f4f2d7"/>
        <path d="m7 23 4 5m-3-5 5 3" stroke="#9cbe87" strokeWidth=".95"/>
      </>}
      {figure === "pea" && <>
        <path d="M5 18c10-5 21-6 30 0-2 12-12 18-22 13-5-2-8-7-8-13Z" fill="#91b981" stroke="#65966a" strokeWidth="1.3"/>
        <circle cx="13" cy="22" r="4" fill="#c9d998" stroke="#92b477" strokeWidth="1"/><circle cx="22" cy="24" r="4.5" fill="#b8cf87" stroke="#92b477" strokeWidth="1"/><circle cx="30" cy="21" r="3.5" fill="#cbd997" stroke="#92b477" strokeWidth="1"/>
        <path d="M6 18c9-6 20-6 29 0" stroke="#c0d8a0" strokeWidth="1.7"/>
      </>}
      {figure === "greenbean" && <>
        <path d="M5 23C13 9 23 9 34 16c2 3-2 5-4 4-8-4-13-2-19 8-2 4-8-1-6-5Z" fill="#85b584" stroke="#548f62" strokeWidth="1.2"/>
        <path d="M10 30c7-9 14-9 23-4 4 3 2 6-2 6-8-3-12 0-17 5-3 3-7-3-4-7Z" fill="#9fc592" stroke="#65996c" strokeWidth="1.2"/>
        <path d="M8 24c6-9 14-11 23-7m-19 16c7-7 12-7 20-4" stroke="#cce2b2" strokeWidth="1.6"/>
      </>}
      {figure === "yogurt" && <>
        <path d="M5 17h30l-3 15c-7 5-17 5-24 0L5 17Z" fill="#d9e8e9" stroke="#9dbfc3" strokeWidth="1.2"/>
        <ellipse cx="20" cy="17" rx="15" ry="6" fill="#f8faf6" stroke="#b9d0cd" strokeWidth="1.1"/>
        <path d="M9 18c7-6 11 4 20-1m-11 6c5 2 8-1 9-2" stroke="#dce9e8" strokeWidth="2"/>
      </>}
      {figure === "oil" && <>
        <path d="M16 5h8v6l5 6v18H11V17l5-6V5Z" fill="#dce6cf" stroke="#97ad8b" strokeWidth="1.2"/>
        <path d="M13 20h14v13H13V20Z" fill="#e8cb7a" opacity=".85"/>
        <path d="M17 5h6m-9 15h12" stroke="#93ae8b" strokeWidth="1.3"/>
        <path d="M17 23c1 4-1 6 2 7" stroke="#fff4c9" strokeWidth="2.1"/>
      </>}
      {figure === "flour" && <>
        <path d="M11 7h18l5 28H6l5-28Z" fill="#ead9bf" stroke="#c5ab8c" strokeWidth="1.3"/>
        <path d="M12 7c5 3 10 3 16 0m-19 25h22" stroke="#d0b899" strokeWidth="1.2"/>
        <path d="M12 14h16v14H12V14Z" fill="#faf5e9" stroke="#ddd1bb" strokeWidth="1"/>
        <path d="M21 17v10m-4-7 4 2 4-3m-8 7 4-2 4 2" stroke="#adba92" strokeWidth="1.7"/>
      </>}
      {figure === "baking" && <>
        <path d="M11 8h18l3 27H8l3-27Z" fill="#e4ddcf" stroke="#b7aa97" strokeWidth="1.2"/>
        <path d="M10 8h20v5H10V8Z" fill="#b7a7a0" stroke="#978d87" strokeWidth="1.2"/>
        <path d="M12 17h16v13H12z" fill="#fcf8ed"/>
        <path d="m20 19 2 4 5 1-4 3 1 4-4-3-4 3 1-4-4-3 5-1 2-4Z" fill="#eac88d" stroke="#cba86b" strokeWidth=".9"/>
      </>}
      {figure === "sesame" && <>
        <g fill="#f3e3be" stroke="#c4a571" strokeWidth="1">
          <ellipse cx="13" cy="15" rx="2.6" ry="4" transform="rotate(-30 13 15)"/>
          <ellipse cx="24" cy="12" rx="2.6" ry="4" transform="rotate(25 24 12)"/>
          <ellipse cx="19" cy="22" rx="2.6" ry="4" transform="rotate(-5 19 22)"/>
          <ellipse cx="29" cy="23" rx="2.6" ry="4" transform="rotate(40 29 23)"/>
          <ellipse cx="11" cy="27" rx="2.6" ry="4" transform="rotate(20 11 27)"/>
          <ellipse cx="23" cy="31" rx="2.6" ry="4" transform="rotate(-40 23 31)"/>
        </g>
        <path d="M12 13v2m11-4 1 2m-6 8v2" stroke="#ffffff" strokeWidth="1.3"/>
      </>}
      {figure === "sauce" && <>
        <path d="M13 7h14v7l4 5-2 16H11L9 19l4-5V7Z" fill="#e5d2b4" stroke="#b79b79" strokeWidth="1.2"/>
        <path d="M11 21h18v12H11V21Z" fill="#a57357"/>
        <path d="M13 8h14m-10-4h6m-8 20h10" stroke="#c1a286" strokeWidth="1.8"/>
        <path d="M19 27c2 3 6 2 7-1" stroke="#dec3a4" strokeWidth="1.6"/>
      </>}
      {figure === "paste" && <>
        <path d="M8 19h24l-2 15H10L8 19Z" fill="#e6dacc" stroke="#b9a89b" strokeWidth="1.2"/>
        <ellipse cx="20" cy="19" rx="12" ry="5" fill="#c96653" stroke="#a84b43" strokeWidth="1.2"/>
        <path d="M11 17c4-4 14-4 18 0m-15 7h12" stroke="#f0ae84" strokeWidth="1.8"/>
        <path d="M15 13c-1-3 1-6 4-7m3 5c1-3 3-4 5-4" stroke="#9cb685" strokeWidth="1.6"/>
      </>}

      {figure === "greenlentil" && <>
        <path d="M6 24c0-7 7-11 14-11s14 4 14 11v8c-7 5-21 5-28 0v-8Z" fill="#efe3ce" stroke="#c8b79e" strokeWidth="1.25"/>
        <ellipse cx="20" cy="23" rx="14" ry="7.5" fill="#829e6a" stroke="#688759" strokeWidth="1.2"/>
        <g fill="#a7bc81" stroke="#658052" strokeWidth=".7"><ellipse cx="12" cy="22" rx="2.8" ry="1.8"/><ellipse cx="19" cy="19" rx="2.9" ry="1.9"/><ellipse cx="27" cy="22" rx="2.8" ry="1.8"/><ellipse cx="18" cy="26" rx="3" ry="1.9"/><ellipse cx="25" cy="26" rx="2.8" ry="1.8"/></g>
        <path d="M10 31c5 3 16 4 20 0" stroke="#ffffff" strokeWidth="1.5" opacity=".7"/>
      </>}
      {figure === "redlentil" && <>
        <path d="M6 24c0-7 7-11 14-11s14 4 14 11v8c-7 5-21 5-28 0v-8Z" fill="#efe3ce" stroke="#c8b79e" strokeWidth="1.25"/>
        <ellipse cx="20" cy="23" rx="14" ry="7.5" fill="#e7a46b" stroke="#c98a55" strokeWidth="1.2"/>
        <g fill="#f7c18a" stroke="#c68355" strokeWidth=".7"><ellipse cx="12" cy="22" rx="2.8" ry="1.8"/><ellipse cx="19" cy="19" rx="2.9" ry="1.9"/><ellipse cx="27" cy="22" rx="2.8" ry="1.8"/><ellipse cx="18" cy="26" rx="3" ry="1.9"/><ellipse cx="25" cy="26" rx="2.8" ry="1.8"/></g>
        <path d="M10 31c5 3 16 4 20 0" stroke="#ffffff" strokeWidth="1.5" opacity=".7"/>
      </>}
      {figure === "bellpepper" && <>
        <path d="M20 12c-2-4-1-7 4-9" stroke="#4d8060" strokeWidth="3"/>
        <path d="M20 11c-5-3-11 0-13 8-2 7 1 14 6 15 2 1 5-1 7-1s5 2 8 0c6-4 8-14 4-19-3-4-8-5-12-3Z" fill="#6cad71" stroke="#3d8054" strokeWidth="1.5"/>
        <path d="M15 13c-4 5-4 13-2 19M25 13c5 5 5 13 3 18" stroke="#509260" strokeWidth="1.4"/>
        <path d="M11 19c0-2 1-4 3-5" stroke="#d9f2c5" strokeWidth="2.2"/>
        <path d="M17 10c3 3 5 3 7 0" stroke="#628f5d" strokeWidth="2"/>
      </>}
      {figure === "kapiapepper" && <>
        <path d="M16 11c-1-5 2-7 6-8" stroke="#57835d" strokeWidth="2.6"/>
        <path d="M14 12C9 11 7 15 8 22c1 8 8 13 16 15 7-7 10-15 8-21-3-7-12-8-18-4Z" fill="#df594c" stroke="#b6413f" strokeWidth="1.4"/>
        <path d="M20 12c-3 7-4 15 3 22m3-19c3 6 2 12-2 18" stroke="#b94942" strokeWidth="1.5"/>
        <path d="M11 18c1-3 2-4 4-5" stroke="#ffd2bd" strokeWidth="2.4"/>
      </>}
      {figure === "redpepper" && <>
        <path d="M21 10c-2-4-1-7 3-8" stroke="#50845e" strokeWidth="2.8"/>
        <path d="M20 12C10 7 6 15 7 24c1 8 6 10 12 9 6 3 14 0 15-10 1-10-5-15-14-11Z" fill="#e95c4f" stroke="#b94740" strokeWidth="1.5"/>
        <path d="M15 13c-4 6-3 15 0 20m10-20c4 6 4 14 1 20" stroke="#cd4740" strokeWidth="1.35"/>
        <path d="M11 19c1-3 2-4 4-5" stroke="#ffddd0" strokeWidth="2.2"/>
      </>}
      {figure === "carliston" && <>
        <path d="M12 12c-3-4-2-6 2-9" stroke="#608a59" strokeWidth="2.4"/>
        <path d="M11 12C7 15 8 20 13 24c5 5 10 8 21 9-4-7-7-14-14-20-4-3-7-4-9-1Z" fill="#a8ca73" stroke="#729950" strokeWidth="1.4"/>
        <path d="M13 14c6 4 13 12 18 16" stroke="#e1efb0" strokeWidth="2"/>
        <path d="m9 11 7 2" stroke="#77a55d" strokeWidth="1.6"/>
      </>}
      {figure === "sivri" && <>
        <path d="M13 11c-2-4 0-7 4-9" stroke="#618f61" strokeWidth="2.5"/>
        <path d="M13 11C7 13 7 19 10 23c5 7 15 10 25 12-5-10-12-20-17-23-3-2-4-2-5-1Z" fill="#569566" stroke="#3c7954" strokeWidth="1.4"/>
        <path d="M12 15c6 5 13 13 19 17" stroke="#b1d495" strokeWidth="2" />
      </>}
      {figure === "sweetpepper" && <>
        <path d="M19 10c-1-5 1-7 5-8" stroke="#4f805c" strokeWidth="2.6"/>
        <path d="M20 12C12 8 7 14 7 22c0 9 5 13 11 11 8 3 15-2 15-12 0-7-5-12-13-9Z" fill="#7bb47c" stroke="#558e61" strokeWidth="1.5"/>
        <path d="M16 13c-4 7-3 13-1 18m10-18c3 6 3 13 1 18" stroke="#5b9a67" strokeWidth="1.4"/>
        <path d="M11 17c1-2 3-4 5-4" stroke="#d6efc1" strokeWidth="2"/>
      </>}
      {figure === "salt" && <>
        <path d="M12 11h16l4 23H8l4-23Z" fill="#dce7e6" stroke="#a5b8b9" strokeWidth="1.3"/>
        <path d="M13 7h14l2 4H11l2-4Z" fill="#b6c8c8" stroke="#879c9d" strokeWidth="1.2"/>
        <path d="M12 17h16v12H12V17Z" fill="#fdfcf8" stroke="#d8e0da" strokeWidth="1"/>
        <path d="M15 24c2-6 8-6 10 0-3 4-7 4-10 0Z" fill="#d5e0e2" stroke="#b4c2c3" strokeWidth="1"/>
        <g fill="#748788"><circle cx="17" cy="9" r=".7"/><circle cx="20" cy="9" r=".7"/><circle cx="23" cy="9" r=".7"/></g>
      </>}
      {figure === "paprikaspice" && <>
        <path d="M5 26h30l-3 9H8l-3-9Z" fill="#f2e6d7" stroke="#cdb5a3" strokeWidth="1.3"/>
        <ellipse cx="20" cy="25" rx="14.5" ry="6" fill="#cf5944" stroke="#aa4439" strokeWidth="1.2"/>
        <path d="M9 23c5-5 16-5 22 0" stroke="#ec9674" strokeWidth="2.2"/>
        <path d="M15 23c3-2 7-2 10 0" stroke="#f3ae88" strokeWidth="1.3"/>
      </>}
      {figure === "cumin" && <>
        <path d="M5 25h30l-4 10H9L5 25Z" fill="#efe3d1" stroke="#c7b196" strokeWidth="1.2"/>
        <ellipse cx="20" cy="25" rx="15" ry="6" fill="#b49a70" stroke="#8f7453" strokeWidth="1.2"/>
        <path d="M11 23c5-3 14-4 18 0" stroke="#d6bf99" strokeWidth="1.6"/>
        <g stroke="#8d6e50" strokeWidth="1.3"><path d="m14 22 3 2m6-4 3 2m-6 3 3 2m-11 1 2-1m13-2 2-1"/></g>
      </>}
      {figure === "cinnamon" && <>
        <path d="M8 13 26 31c2 3 5 1 5-2L13 10c-3-3-8 0-5 3Z" fill="#b17851" stroke="#895838" strokeWidth="1.4"/>
        <path d="M14 9 32 26c3 2 1 6-2 7L11 14c-3-3 0-7 3-5Z" fill="#cd9368" stroke="#995f40" strokeWidth="1.3"/>
        <path d="M10 10c3 0 4 1 4 4-3 2-6 0-4-4Zm20 17c3 1 2 4 0 5-3-1-3-3 0-5Z" fill="#e2b289" stroke="#916342" strokeWidth="1"/>
        <path d="m15 14 12 12m-16-14 17 17" stroke="#e5b18a" strokeWidth="1.1"/>
      </>}
      {figure === "vanilla" && <>
        <path d="M9 34c6-16 13-23 24-28M15 36C20 23 23 14 29 5" stroke="#5d5149" strokeWidth="2.7"/>
        <path d="M11 32c9-2 16-10 20-21M19 34c7-10 9-16 11-26" stroke="#a18970" strokeWidth=".9"/>
        <path d="M8 35c-1-4 3-5 6-3m0 4c2-4 5-3 7-1" stroke="#e4cfad" strokeWidth="1.2"/>
      </>}
      {figure === "dill" && <>
        <path d="M17 36c2-9 4-22 2-32M24 36c-1-10 1-19 5-28" stroke="#608e64" strokeWidth="2"/>
        <g stroke="#81b380" strokeWidth="1.8"><path d="M20 13 8 7m11 7 12-8M19 19 6 15m13 5 13-6M18 25 7 22m12 2 14-3M26 17 32 12m-7 13 10-7M18 10 13 3"/></g>
        <g stroke="#b4d39a" strokeWidth="1.2"><path d="m8 7-4-4m4 4-4 1m27-2 3-3m-2 10 4-1M6 15l-3-3m4 10-4 1"/></g>
      </>}
      {figure === "arugula" && <>
        <path d="M20 35V15m0 9-8 9m8-10 10 8" stroke="#628b5b" strokeWidth="2"/>
        <path d="M19 27c-7-2-12-10-9-14 4 0 6 4 9 4-3-8-1-13 3-13 4 3 2 8 1 13 4-5 8-5 11-3-1 7-6 11-15 13Z" fill="#85b184" stroke="#528661" strokeWidth="1.3"/>
        <path d="M20 11v17m-8-10 8 10m9-9-9 9" stroke="#d0e3b3" strokeWidth="1.25"/>
      </>}
      {figure === "walnut" && <>
        <path d="M20 6c-5-4-11-1-12 5-6 3-6 11-2 15-2 7 4 11 10 10 2 2 6 2 8 0 8 2 12-6 9-12 4-5 1-12-4-14-1-6-6-7-9-4Z" fill="#c79764" stroke="#936a49" strokeWidth="1.4"/>
        <path d="M20 7c-4 4-5 9-2 15-4 6-3 11 2 14m0-29c4 4 5 9 2 15 4 6 3 11-2 14" stroke="#895d3e" strokeWidth="1.7"/>
        <path d="m11 14 5 4m13-3-6 5M9 27l7-4m14 4-6-4" stroke="#a7754e" strokeWidth="1.45"/>
        <path d="M12 11c2-3 4-4 6-3" stroke="#efc495" strokeWidth="1.9"/>
      </>}
      {figure === "almond" && <>
        <path d="M11 8C4 16 5 30 17 35 26 30 28 16 19 8c-2-2-6-2-8 0Z" fill="#cc9365" stroke="#996744" strokeWidth="1.3"/>
        <path d="M22 11c-5 8-2 21 8 23 8-6 8-19 1-24-3-2-6-1-9 1Z" fill="#d3a06d" stroke="#9d704b" strokeWidth="1.3"/>
        <path d="M15 10c-5 8-3 17 1 22m13-19c-4 6-3 14 1 18" stroke="#edc496" strokeWidth="1.6"/>
      </>}
      {figure === "cabbage" && <>
        <path d="M20 6C8 5 4 14 5 23s8 13 16 13 15-6 15-16S29 6 20 6Z" fill="#add09b" stroke="#74996e" strokeWidth="1.3"/>
        <path d="M20 9C9 11 10 25 19 33c8-4 12-15 3-24M8 22c4-1 9 2 12 11m13-14c-6-1-10 6-12 14" stroke="#78a578" strokeWidth="1.6"/>
        <path d="M8 18c2-5 6-7 10-7m9 5c3 2 4 6 4 9m-18 5c3 2 7 3 11 2" stroke="#e3efca" strokeWidth="2.2"/>
      </>}
      {figure === "melon" && <>
        <path d="M21 9c0-4 2-6 5-7" stroke="#7a9568" strokeWidth="2.3"/>
        <path d="M20 10c-9-1-15 6-15 15 0 8 6 12 15 12s15-5 15-12S29 11 20 10Z" fill="#e6cd89" stroke="#bba76b" strokeWidth="1.3"/>
        <path d="M20 11c-8 7-8 19 0 25m0-25c8 7 8 19 0 25m-13-10c8-4 18-4 26 0M10 16c6 4 15 4 20 0" stroke="#d0b979" strokeWidth="1.6"/>
        <path d="M8 23c2-6 5-9 9-10" stroke="#f8e4ad" strokeWidth="2"/>
      </>}
      {figure === "oliveoil" && <>
        <rect x="16" y="5" width="8" height="6" rx="1.5" fill="#a08d65" stroke="#786d54" strokeWidth="1"/>
        <path d="M16 11h8l4 5v18c-4 3-13 3-17 0V16l5-5Z" fill="#eaf2dd" stroke="#98ad8c" strokeWidth="1.2"/>
        <path d="M13 20h13v13H13V20Z" fill="#c6bf55" opacity=".84"/>
        <path d="M18 12h4m-7 9h10" stroke="#8a9f7a" strokeWidth="1.4"/>
        <path d="M20 22c4 5 1 9-1 9-4-2-2-6 1-9Z" fill="#e6e69a" stroke="#9baa62" strokeWidth=".8"/>
        <path d="M16 17h8" stroke="#ffffff" strokeWidth="1.9" opacity=".8"/>
      </>}
      {figure === "greenapple" && <>
        <path d="M20 13C10 7 5 14 6 23c0 9 8 14 14 11 6 3 14-3 14-12 0-9-7-15-14-9Z" fill="#9bc468" stroke="#679a56" strokeWidth="1.3"/>
        <path d="M20 12c0-4 1-6 3-8m-3 8c-4-6-8-7-12-5 2 5 6 7 12 5Z" fill="#73a772" stroke="#4d895d" strokeWidth="1.2"/>
        <path d="M11 17c-2 4-1 8 0 10" stroke="#e5f3c5" strokeWidth="2.2"/>
        <path d="M25 31c2-1 3-3 4-6" stroke="#5e9155" strokeWidth="1.4"/>
      </>}
      {figure === "blackpepper" && <>
        <path d="M6 30c0-3 6-5 14-5s14 2 14 5-6 5-14 5-14-2-14-5Z" fill="#efe6da" stroke="#c7b8a4" strokeWidth="1.1"/>
        <g fill="#4b403a" stroke="#2f2824" strokeWidth="1">
          <circle cx="13" cy="27" r="3.4"/><circle cx="20" cy="28.5" r="3.4"/><circle cx="27" cy="27" r="3.4"/>
          <circle cx="16.5" cy="21.5" r="3.4"/><circle cx="23.5" cy="21.5" r="3.4"/><circle cx="20" cy="15.5" r="3.4"/>
        </g>
        <path d="M12 26l1-1m6 2 1-1m6 0 1-1m-11-4 1-1m6 0 1-1m-4-5 1-1" stroke="#a89b90" strokeWidth="1.3"/>
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
