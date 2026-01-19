/**
 * Check if image URL is a placeholder or missing
 */
export function isPlaceholderImage(imageUrl: string | null | undefined): boolean {
  if (!imageUrl) return true;
  if (imageUrl.trim() === '') return true;
  if (imageUrl.includes('placehold.co')) return true;
  if (imageUrl.includes('placeholder')) return true;
  return false;
}
