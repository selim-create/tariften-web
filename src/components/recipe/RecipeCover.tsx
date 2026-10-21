import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";
import { lokmaDishName } from "@/lib/lokma-emoji";

/**
 * Editorial stand-in for a recipe that has no photograph yet.
 * A typographic cover reads as a deliberate design choice, not a broken
 * image. It states plainly that the photo is pending; nothing is implied.
 */
export default function RecipeCover({ title, kicker, compact = false }: { title: string; kicker?: string; compact?: boolean }) {
  const length = title.length;
  if (compact) {
    // List cards: the dish's own Lokma illustration on the brand cream, so a
    // grid of recipes without photos still reads as designed, not as loading.
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f6efe8]">
        <LokmaIngredientIcon name={lokmaDishName(title)} size="xl" />
        <span className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a89a8d]">Görsel hazırlanıyor</span>
        <span className="sr-only">{title}</span>
      </div>
    );
  }
  const size = length > 60 ? "text-[26px] sm:text-[30px]" : length > 34 ? "text-[30px] sm:text-[36px]" : "text-[34px] sm:text-[44px]";
  return (
    <div className="absolute inset-0 bg-[#f6efe8] text-[#2a211c]">
      <div className="absolute inset-3 rounded-[20px] border border-[#e6dacd] sm:inset-4" aria-hidden />
      <div className="relative flex h-full flex-col justify-between p-8 sm:p-10">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className="text-[#db4c3f]">Tariften</span>
          {kicker && <span className="text-[#9a8b7e]">{kicker}</span>}
        </div>
        <div>
          <span className="mb-5 block h-[3px] w-10 rounded-full bg-[#db4c3f]" aria-hidden />
          <p className={`font-heading font-bold leading-[1.08] tracking-[-0.02em] ${size} max-w-[16ch] text-balance`}>
            {title}
          </p>
        </div>
        <p className="text-xs text-[#9a8b7e]">Fotoğraf hazırlanıyor</p>
      </div>
    </div>
  );
}
