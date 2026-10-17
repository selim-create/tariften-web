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
 | "bean" | "spice" | "potato" | "fish" | "bread" | "plate"
 | "broccoli" | "eggplant" | "mushroom" | "cucumber" | "greens"
 | "chicken" | "meat" | "shrimp" | "butter" | "rice" | "strawberry"
 | "orange" | "apple" | "banana" | "nut" | "honey" | "chocolate" | "sugar"
 | "cherry" | "berry" | "pear" | "grape" | "watermelon" | "peach" | "kiwi"
 | "pineapple" | "avocado" | "corn" | "coffee" | "tea" | "liquid"
 | "leek" | "celery" | "cauliflower" | "artichoke" | "radish" | "beet"
 | "pumpkin" | "asparagus" | "okra" | "zucchini" | "pea" | "greenbean"
 | "yogurt" | "oil" | "flour" | "baking" | "sesame" | "sauce" | "paste";

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

export default function LokmaIngredientIcon({ name, size = "md", className = "" }: Props) {
  const ingredient = lokmaIngredient(name);
  const figure = (ingredient.art || FIGURES[ingredient.emoji] || "plate") as Figure;
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

      {figure === "broccoli" && <>
        <path d="M18 22h7l-1 13h-6l-1-13Z" fill="#95ba78" stroke="#5b9263" strokeWidth="1.2" />
        <path d="M7 23c-5-5-1-12 5-12 0-7 10-9 13-3 7-2 13 6 8 11 3 6-2 10-8 10H14c-4 0-8-2-7-6Z" fill="#76b27b" stroke="#4e9467" strokeWidth="1.3" />
        <path d="M11 21c3-6 8-5 10-2m3-6c2 0 5 2 5 5" stroke="#a3d1a1" strokeWidth="2" opacity=".85" />
      </>}
      {figure === "eggplant" && <>
        <path d="M13 15c-9 6-10 16-4 20 7 5 21-2 23-14 1-8-9-11-19-6Z" fill="#795a93" stroke="#5c4473" strokeWidth="1.4" />
        <path d="M13 15c1-7 6-9 9-8l-2 7c7-3 10-1 12 3l-11 1-5 6-3-9Z" fill="#78a475" stroke="#527d58" strokeWidth="1.2" />
        <path d="M11 22c-3 5-3 8-1 10" stroke="#c2a6d1" strokeWidth="2" opacity=".8" />
      </>}
      {figure === "mushroom" && <>
        <path d="M16 23h9l-1 12h-7l-1-12Z" fill="#eedcc7" stroke="#c6ad90" strokeWidth="1.2" />
        <path d="M5 23c0-11 7-18 16-18s15 7 15 18H5Z" fill="#bc9277" stroke="#946d59" strokeWidth="1.4" />
        <path d="M7 23h27c-2 4-7 6-13 6S10 27 7 23Z" fill="#f3dfc9" stroke="#c8ae94" strokeWidth="1.2" />
        <path d="M13 12c3-4 7-5 11-4" stroke="#f7e4d3" strokeWidth="2" opacity=".75" />
      </>}
      {figure === "cucumber" && <>
        <path d="M8 28C3 22 9 13 17 9c7-4 15-3 17 3 3 8-6 15-12 19-6 4-11 2-14-3Z" fill="#86b86c" stroke="#5b9659" strokeWidth="1.4" />
        <path d="M11 27c6-5 11-10 19-13m-12 13 2 2m-7-10 2 2m12 0 2 2" stroke="#b8d58f" strokeWidth="2" opacity=".9" />
      </>}
      {figure === "greens" && <>
        <path d="M21 35V18m-7 17 7-14 7 14" stroke="#638e64" strokeWidth="1.8" />
        <path d="M19 30C8 29 5 20 8 13c6-1 12 3 13 13C22 15 28 8 35 9c2 10-4 18-14 21C18 18 12 11 5 9 2 20 8 28 19 30Z" fill="#8fc28b" stroke="#609b70" strokeWidth="1.1" />
        <path d="M10 15c4 4 7 8 10 13m10-14-9 14" stroke="#d6ebc0" strokeWidth="1.2" />
      </>}
      {figure === "chicken" && <>
        <path d="M11 14c6-7 18-6 21 3 3 8-5 15-13 14-9-1-15-10-8-17Z" fill="#d49b65" stroke="#a87750" strokeWidth="1.4" />
        <path d="m14 27-5 4-4-2c-4-1-6 3-3 5 0 3 4 4 6 2l5-5" fill="#efe0c9" stroke="#bdad97" strokeWidth="1.2" />
        <path d="M14 16c4-4 9-4 12-1" stroke="#f4ce9a" strokeWidth="2" opacity=".8" />
      </>}
      {figure === "meat" && <>
        <path d="M7 10c8-5 20-3 26 6 5 8-2 17-12 19C11 37 4 28 5 20c0-4 0-8 2-10Z" fill="#bd6e63" stroke="#96524b" strokeWidth="1.4" />
        <path d="M12 13c7-4 15-1 18 6s-3 12-10 13c-6 1-12-6-11-12 0-3 1-5 3-7Z" stroke="#efb7a2" strokeWidth="3" />
        <path d="M19 17c6-1 10 6 5 10-5 3-9-2-7-6" stroke="#f5d1bc" strokeWidth="2.5" />
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
        <path d="M6 12c2 12 13 19 26 12 3-2 3-5 2-8-7 7-17 6-25-6L6 12Z" fill="#f1cd68" stroke="#d7ad45" strokeWidth="1.3" />
        <path d="M9 12c7 13 16 16 25 6" stroke="#fff1b8" strokeWidth="2.2" />
        <path d="m7 12-2-2m28 6 2-1" stroke="#9d7a46" strokeWidth="2" />
      </>}
      {figure === "nut" && <>
        <path d="M8 19c-2-8 5-13 10-9 4-6 14-1 13 6 6 5 2 15-5 17-8 5-20 0-18-14Z" fill="#c69e79" stroke="#946d50" strokeWidth="1.3" />
        <path d="M19 10c-5 7-5 14 1 23m-1-22c7 3 4 9 10 12m-17-7c4 3 5 5 6 8" stroke="#987354" strokeWidth="1.4" />
      </>}
      {figure === "honey" && <>
        <path d="M11 14h18l2 6-2 14H11L9 20l2-6Z" fill="#e9b45f" stroke="#bc8845" strokeWidth="1.2" />
        <path d="M9 10h22v5H9z" fill="#ae8766" stroke="#906d52" strokeWidth="1.2" />
        <path d="M12 22h16v9H12z" fill="#f7d18b" opacity=".8" />
        <path d="M15 25c2 5 8 5 10 0" stroke="#d19c52" strokeWidth="1.7" />
      </>}
      {figure === "chocolate" && <>
        <path d="M7 9h26v25H7V9Z" fill="#825848" stroke="#624137" strokeWidth="1.3" />
        <path d="M9 11h22v21H9z" fill="#a46c50" />
        <path d="M20 11v21M9 21h22" stroke="#674638" strokeWidth="2.2" />
        <path d="m13 14 3-1m9 11 3-1" stroke="#db9b72" strokeWidth="1.6" />
      </>}
      {figure === "sugar" && <>
        <path d="m11 15 10-5 10 6-10 6-10-7Z" fill="#fffefa" stroke="#beced5" strokeWidth="1.2" />
        <path d="m11 15 10 7v12l-10-7V15Z" fill="#e5edf0" stroke="#beced5" strokeWidth="1.2" />
        <path d="m21 22 10-6v12l-10 6V22Z" fill="#f7faf9" stroke="#beced5" strokeWidth="1.2" />
        <path d="m6 26 7 4m22-15 2-2" stroke="#cedce0" strokeWidth="1.7" />
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
        <path d="M20 11c-2-4-2-7 1-9m0 10c2-8 8-8 12-6-2 5-6 8-12 6" fill="#8fb37b" stroke="#628e66" strokeWidth="1.2"/>
        <path d="M21 12C7 6 4 18 8 29c3 10 12 8 14 6 7 4 13-1 13-10 0-9-5-15-14-13Z" fill="#f0ac80" stroke="#d78d69" strokeWidth="1.3"/>
        <path d="M21 15c-4 8-4 15 1 20" stroke="#e48d73" strokeWidth="1.6"/>
        <path d="M10 19c1-3 3-4 5-5" stroke="#ffe3ba" strokeWidth="2.2"/>
      </>}
      {figure === "kiwi" && <>
        <ellipse cx="20" cy="22" rx="15" ry="13" fill="#a48459" stroke="#816747" strokeWidth="1.2"/>
        <ellipse cx="20" cy="22" rx="12" ry="10" fill="#a8c576" stroke="#80a15a" strokeWidth="1.1"/>
        <ellipse cx="20" cy="22" rx="4" ry="3.5" fill="#f5f0cf"/>
        <path d="m20 11-1 6m-7 2 5 2m4 6-1 6m6-12 5-2m-3 8-4-3m-9-1-4 4" stroke="#6e7652" strokeWidth="1.8" />
      </>}
      {figure === "pineapple" && <>
        <path d="M20 12C11 11 8 18 9 26c1 7 6 11 11 11s11-4 11-11c1-8-3-15-11-14Z" fill="#dfbd65" stroke="#be9c4e" strokeWidth="1.3"/>
        <path d="m12 17 16 16m-17-7 14-13m-5 1 10 9M10 23l10 13" stroke="#b49b58" strokeWidth="1.5"/>
        <path d="M20 14 12 6l7 3V2l4 8 7-4-6 9" fill="#78a779" stroke="#578b61" strokeWidth="1.2"/>
      </>}
      {figure === "avocado" && <>
        <path d="M22 5c-8-1-11 8-12 14-5 9-2 18 9 19 10 1 17-7 14-16-1-7-3-16-11-17Z" fill="#709b65" stroke="#567e59" strokeWidth="1.3"/>
        <path d="M21 10c-6 0-9 8-9 14-2 7 2 12 9 12 8 0 12-7 10-14-2-7-4-12-10-12Z" fill="#c8d794" stroke="#9eaf7b" strokeWidth="1"/>
        <circle cx="21" cy="26" r="6" fill="#a97955" stroke="#895d47" strokeWidth="1.1"/>
        <path d="M14 20c1-3 2-5 4-6" stroke="#f1f1c8" strokeWidth="2"/>
      </>}
      {figure === "corn" && <>
        <path d="M16 8c3-3 6-3 9 0 6 8 6 22-2 28-7 2-14-7-13-16 0-4 3-9 6-12Z" fill="#e9c76c" stroke="#cba955" strokeWidth="1.2"/>
        <path d="M13 16c5-2 11-2 15 1m-17 5c6-3 13-3 18 0m-16 5c5-3 11-2 15 1M18 9v24m5-24v24" stroke="#f8dd8a" strokeWidth="1.5"/>
        <path d="M12 15c-8 6-8 16 2 21 4-2 6-5 7-8-6-3-7-7-9-13Zm18 1c8 7 6 15-4 20-3-2-5-4-6-7 6-4 8-9 10-13Z" fill="#8aaf7a" stroke="#619466" strokeWidth="1.2" />
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
      {figure === "plate" && <>
        <ellipse cx="20" cy="21" rx="15" ry="12" fill="#f2eee7" stroke="#a7afa5" strokeWidth="1.2" />
        <ellipse cx="20" cy="21" rx="10" ry="8" fill="#ffffff" stroke="#cfd5c9" strokeWidth="1.1" />
        <path d="M30 7v8m-3-8v5m6-5v5m-3 3v18" stroke="#b3aaa0" strokeWidth="1.5" />
        <path d="M8 8c3 2 3 6 0 8v17" stroke="#b3aaa0" strokeWidth="1.5" />
      </>}
    </svg>
  </span>;
}
