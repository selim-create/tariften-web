import { lokmaIngredient, lokmaIngredientClasses } from "@/lib/lokma-emoji";

type Props = { name: string; size?: "sm" | "md" | "lg"; className?: string };

/** Ingredient decorations never substitute for source-derived text or amounts. */
export default function LokmaIngredientIcon({ name, size = "md", className = "" }: Props) {
  const ingredient = lokmaIngredient(name);
  const styles = size === "sm" ? "h-8 w-8 text-[19px] rounded-xl"
    : size === "lg" ? "h-12 w-12 text-[28px] rounded-2xl"
      : "h-10 w-10 text-[23px] rounded-[14px]";
  return (
    <span aria-hidden="true" title={ingredient.label}
      className={`inline-grid shrink-0 select-none place-items-center ring-1 ring-inset ${styles} ${lokmaIngredientClasses(ingredient.tint)} ${className}`}>
      <span className="drop-shadow-[0_2px_1px_rgba(80,60,40,0.08)]">{ingredient.emoji}</span>
    </span>
  );
}
