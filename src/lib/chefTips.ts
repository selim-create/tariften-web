export const DEFAULT_CHEF_TIPS = [
  "Malzemeleri oda sıcaklığında kullanmak lezzeti artırır.",
  "Yemekleri pişirmeden önce tüm malzemeleri hazırlayın, bu işinizi kolaylaştırır.",
  "Baharatları yağda kavurmak aromasını daha iyi açığa çıkarır.",
  "Et pişirirken, sık sık çevirmekten kaçının. Böylece dışı güzel karamelleşir.",
  "Makarna suyuna tuz eklemeyi unutmayın, makarna lezzet alır.",
  "Sebzeleri buharda pişirmek besin değerlerini korur.",
  "Tavayı önceden ısıtmak, yiyeceklerin yapışmasını önler.",
  "Limon suyu veya sirke, yemeklere ferahlık katar.",
  "Taze otları yemeğin sonunda eklemek aromasını korur.",
  "Pişirme sırasında kapağı çok açmayın, ısı kaybını önleyin.",
  "Tereyağını köpürene kadar ısıtın, sonra malzemeleri ekleyin.",
  "Yemekleri dinlendirmek, lezzetin oturmasını sağlar.",
  "Keskin bıçak kullanmak hem güvenli hem de işi kolaylaştırır.",
  "Soğan doğrarken ağlamanızı önlemek için buzdolabında bekletin.",
  "Et marine ederken buzdolabında bekletin, böylece güvenli olur."
];

export function getRandomChefTip(recipeId: number): string {
  const index = recipeId % DEFAULT_CHEF_TIPS.length;
  return DEFAULT_CHEF_TIPS[index];
}
