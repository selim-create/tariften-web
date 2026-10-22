import NotFound from "@/app/not-found";
import PrivateRecipeFallback from "@/components/recipe/PrivateRecipeFallback";

/**
 * The public (cacheable) server lookup never returns a private recipe, so its
 * owner lands here. The fallback re-reads the recipe in the browser with the
 * member's own token; everyone else sees the normal 404 page (still a 404).
 */
export default function RecipeNotFound() {
  return <PrivateRecipeFallback fallback={<NotFound />} />;
}
