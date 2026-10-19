import RecipeTextImportPage from "../import/page";

/**
 * One creation-menu entry for both social URLs and pasted recipe text.
 * Reuse the existing authenticated import/editor/quotas pipeline.
 * Previous /recipe/social and /recipe/import deep links stay valid.
 */
export default function UnifiedRecipeImportPage() {
  return <RecipeTextImportPage initialMethod="social" />;
}
