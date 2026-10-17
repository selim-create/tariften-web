/**
 * Browser-only view model for Tariften Core's source-grounded text import.
 *
 * The returned preview is not a saved recipe. Only an explicit user-initiated
 * publish action can call the existing recipes/create endpoint.
 */
export type ImportIngredient = {
  name: string;
  amount: string;
  unit: string;
  original_span: string;
  source_verified: boolean;
  source_name?: string;
  name_corrected?: boolean;
};

export type ImportStep = {
  content: string;
  original_span: string;
  source_verified: boolean;
  editorial_rewrite?: boolean;
};

export type ImportSeo = {
  title: string;
  description: string;
  focus_keywords: string[];
};

export type GroundedImportPreview = {
  success: true;
  mode: "manual_text_import";
  generation_status: "needs_review";
  requires_approval: true;
  source_text: string;
  recipe: {
    title: string;
    excerpt: string;
    ingredients: ImportIngredient[];
    steps: ImportStep[];
    seo: ImportSeo;
  };
  warnings: string[];
  needs_confirmation: string[];
  provenance: {
    origin_type: "manual_text";
    ingredient_evidence: string;
    step_evidence: string;
    editorial_fields: string[];
  };
};

export type EditableIngredient = ImportIngredient & { userEdited?: boolean };
export type EditableStep = ImportStep & { userEdited?: boolean };

export type ImportEditor = {
  title: string;
  excerpt: string;
  ingredients: EditableIngredient[];
  steps: EditableStep[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
};

export function validateRecipeSource(text: string): string | null {
  const size = new TextEncoder().encode(text).length;
  if (size > 20000) return "Metin çok uzun. En fazla 20 KB metin aktarabilirsin.";
  if (text.trim().length < 25) return "Malzeme ve hazırlanışı içeren biraz daha ayrıntılı bir metin gir.";
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function isString(value: unknown): value is string {
  return typeof value === "string";
}
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}
function isIngredient(value: unknown): value is ImportIngredient {
  return isRecord(value) && isString(value.name) && isString(value.amount)
    && isString(value.unit) && isString(value.original_span) && value.source_verified === true
    && (value.source_name === undefined || isString(value.source_name))
    && (value.name_corrected === undefined || typeof value.name_corrected === "boolean");
}
function isStep(value: unknown): value is ImportStep {
  return isRecord(value) && isString(value.content) && isString(value.original_span)
    && value.source_verified === true
    && (value.editorial_rewrite === undefined || typeof value.editorial_rewrite === "boolean");
}

export function parseImportPreview(value: unknown): GroundedImportPreview {
  if (!isRecord(value) || value.success !== true || value.mode !== "manual_text_import"
    || value.generation_status !== "needs_review" || value.requires_approval !== true
    || !isString(value.source_text) || !isRecord(value.recipe) || !isRecord(value.provenance)
    || !isStringArray(value.warnings) || !isStringArray(value.needs_confirmation)) {
    throw new Error("Tarif aktarımı yanıtı beklenen biçimde değil.");
  }
  const r = value.recipe;
  if (!isString(r.title) || !isString(r.excerpt)
    || !Array.isArray(r.ingredients) || !r.ingredients.every(isIngredient)
    || !Array.isArray(r.steps) || !r.steps.every(isStep)
    || r.ingredients.length > 40 || r.steps.length > 40 || !isRecord(r.seo)
    || !isString(r.seo.title) || !isString(r.seo.description)
    || !isStringArray(r.seo.focus_keywords)
    || value.provenance.origin_type !== "manual_text") {
    throw new Error("Tarif alanları eksik veya beklenmeyen türde.");
  }
  for (const ingredient of r.ingredients as ImportIngredient[]) {
    const sourceName = ingredient.source_name || ingredient.name;
    if (!value.source_text.includes(ingredient.original_span)
        || !ingredient.original_span.toLocaleLowerCase("tr-TR").includes(sourceName.toLocaleLowerCase("tr-TR"))
        || (ingredient.name_corrected && !ingredient.source_name)) {
      throw new Error("Malzeme kanıtı orijinal kaynakla eşleşmiyor.");
    }
  }
  for (const step of r.steps as ImportStep[]) {
    if (!value.source_text.includes(step.original_span) || !step.content.trim()) {
      throw new Error("Tarif adımı kaynakla doğrulanamadı.");
    }
  }
  return value as GroundedImportPreview;
}

export function editorFromPreview(p: GroundedImportPreview): ImportEditor {
  return {
    title: p.recipe.title,
    excerpt: p.recipe.excerpt,
    ingredients: p.recipe.ingredients.map(i => ({ ...i })),
    steps: p.recipe.steps.map(s => ({ ...s })),
    seoTitle: p.recipe.seo.title,
    seoDescription: p.recipe.seo.description,
    seoKeywords: p.recipe.seo.focus_keywords.join(", "),
  };
}

export function publishValidation(editor: ImportEditor): string | null {
  if (!editor.title.trim()) return "Tarif başlığını tamamlamalısın.";
  if (!editor.ingredients.length || editor.ingredients.some(i => !i.name.trim())) {
    return "En az bir malzeme eklemeli ve tüm malzeme isimlerini tamamlamalısın.";
  }
  if (!editor.steps.length || editor.steps.some(s => !s.content.trim())) {
    return "En az bir hazırlanış adımı eklemeli ve tüm adımları tamamlamalısın.";
  }
  if (editor.ingredients.length > 40 || editor.steps.length > 40) {
    return "En fazla 40 malzeme ve 40 adım eklenebilir.";
  }
  return null;
}

/**
 * Only keys accepted by current recipes/create are supplied; image is
 * deliberately never included. No image generation or payment is triggered.
 * The existing WP create endpoint PUBLISHES immediately, not a draft.
 */
export function buildApprovedRecipe(editor: ImportEditor) {
  const error = publishValidation(editor);
  if (error) throw new Error(error);
  return {
    title: editor.title.trim(),
    excerpt: editor.excerpt.trim(),
    ingredients: editor.ingredients.map(i => ({
      name: i.name.trim(),
      amount: i.amount.trim(),
      unit: i.unit.trim(),
    })),
    steps: editor.steps.map(s => s.content.trim()),
    seo: {
      title: editor.seoTitle.trim() || editor.title.trim(),
      description: editor.seoDescription.trim() || editor.excerpt.trim(),
      focus_keywords: editor.seoKeywords.split(",").map(k => k.trim()).filter(Boolean).slice(0, 5).join(", "),
    },
  };
}

const WARNING_LABELS: Record<string, string> = {
  ingredient_evidence_invalid: "Bazı malzemeler kaynak metinde doğrulanamadı ve aktarılmadı.",
  ingredient_name_corrected: "Yazım hataları düzeltilmiş olabilir. Malzeme adlarını kaynakla karşılaştır.",
  ingredient_name_unverified: "Bazı malzeme isimlerinin düzeltmesi belirsiz. Kaynağa bakıp kontrol et.",
  step_editorial_rewrite: "Adımlar daha akıcı bir Türkçeyle önerildi. Anlamın değişmediğini kontrol et.",
  step_rewrite_needs_review: "Bazı adımların önerilen düzenlemesi korunamadı. Süre ve miktarları karşılaştır.",
  ingredient_amount_unverified: "Bazı malzemelerin miktarı belirsiz. Kontrol ederek tamamla.",
  ingredient_unit_unverified: "Bazı malzemelerin birimi doğrulanamadı. Kontrol et.",
  step_evidence_invalid: "Kaynakta doğrulanamayan bazı yapılış adımları çıkarıldı.",
  ingredients_missing_or_unverified: "Malzeme listesi eksik veya doğrulanamadı.",
  steps_missing_or_unverified: "Yapılış adımları eksik veya doğrulanamadı.",
  high_salt_quantity_review: "Tuz miktarı alışılmadık derecede yüksek olabilir. Kaynağı dikkatle incele.",
  title_missing: "Tarif başlığı önerilemedi. Başlığı kendin yaz.",
  spot_needs_editorial_review: "Spot yeterince özgün olmayabilir. Kaynağa uygun, daha iştah açıcı bir giriş yazabilirsin.",
};
export function importWarningLabel(code: string): string {
  if (WARNING_LABELS[code]) return WARNING_LABELS[code];
  if (code.startsWith("ingredient_")) return "Bir malzeme alanını kaynak metinden doğrulamalısın.";
  if (code.startsWith("step_")) return "Bir yapılış adımını kaynak metinden doğrulamalısın.";
  if (code === "salt_quantity") return "Tuz miktarını kontrol edip onayla.";
  if (code === "title") return "Tarif başlığını tamamla.";
  if (code === "excerpt") return "Editoryal spotu tarifinle karşılaştırarak gözden geçir.";
  if (code === "ingredients") return "Malzemeleri tamamla.";
  if (code === "steps") return "Yapılış adımlarını tamamla.";
  return "Tarifin bu alanını kaynak metinle karşılaştırıp doğrula.";
}
