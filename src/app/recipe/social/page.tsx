import RecipeTextImportPage from "../import/page";

/** Standalone entry: the editor and API contract remain shared with text import. */
export default function SocialRecipeImportPage() {
  return <RecipeTextImportPage initialMethod="social" />;
}
