/**
 * Core (<= 1.0.40) filled an empty chef tip with one of these generic library
 * tips. They are not about the recipe they appear on, so the page must not
 * present them as "Şefin notu". Kept only to filter responses from servers
 * that have not been updated yet; Core 1.0.41 returns an empty tip instead.
 */
const LEGACY_GENERIC_TIPS = new Set([
  "Malzemeleri oda sıcaklığında kullanmak lezzeti artırır.",
  "Yemekleri pişirmeden önce tüm malzemeleri hazırlayın.",
  "Yemekleri pişirmeden önce tüm malzemeleri hazırlayın, bu işinizi kolaylaştırır.",
  "Baharatları yağda kavurmak aromasını daha iyi açığa çıkarır.",
  "Et pişirirken sık sık çevirmekten kaçının.",
  "Et pişirirken, sık sık çevirmekten kaçının. Böylece dışı güzel karamelleşir.",
  "Makarna suyuna tuz eklemeyi unutmayın.",
  "Makarna suyuna tuz eklemeyi unutmayın, makarna lezzet alır.",
  "Sebzeleri buharda pişirmek besin değerlerini korur.",
  "Tavayı önceden ısıtmak yapışmayı önler.",
  "Tavayı önceden ısıtmak, yiyeceklerin yapışmasını önler.",
  "Limon suyu veya sirke yemeklere ferahlık katar.",
  "Limon suyu veya sirke, yemeklere ferahlık katar.",
  "Taze otları yemeğin sonunda eklemek aromasını korur.",
  "Pişirme sırasında kapağı çok açmayın.",
  "Pişirme sırasında kapağı çok açmayın, ısı kaybını önleyin.",
  "Tereyağını köpürene kadar ısıtın, sonra malzemeleri ekleyin.",
  "Yemekleri dinlendirmek lezzetin oturmasını sağlar.",
  "Yemekleri dinlendirmek, lezzetin oturmasını sağlar.",
  "Keskin bıçak kullanmak hem güvenli hem de pratiktir.",
  "Keskin bıçak kullanmak hem güvenli hem de işi kolaylaştırır.",
  "Soğan doğrarken ağlamanızı önlemek için buzdolabında bekletin.",
  "Et marine ederken buzdolabında bekletin.",
  "Et marine ederken buzdolabında bekletin, böylece güvenli olur.",
]);

/** The recipe's own tip, or null. Never substitutes a generic one. */
export function recipeChefTip(tip: unknown): string | null {
  if (typeof tip !== "string") return null;
  const trimmed = tip.trim();
  if (!trimmed || LEGACY_GENERIC_TIPS.has(trimmed)) return null;
  return trimmed;
}
