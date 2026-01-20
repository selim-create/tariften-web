/**
 * Safely parse a field that might be a JSON string or already an array
 */
export function parseJsonField<T>(field: T | string | null | undefined): T | null {
  if (!field) return null;
  
  // Already an array or object
  if (typeof field !== 'string') {
    return field as T;
  }
  
  // Try to parse JSON string
  try {
    const parsed = JSON.parse(field);
    return parsed as T;
  } catch (e) {
    console.warn('Failed to parse JSON field:', e);
    return null;
  }
}

/**
 * Parse recipe ingredients - handles both string and array formats
 */
export function parseIngredients(ingredients: any): Array<{name: string; amount: number | string; unit: string}> {
  const parsed = parseJsonField<Array<{name: string; amount: number | string; unit: string}>>(ingredients);
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Parse recipe steps - handles both string and array formats
 */
export function parseSteps(steps: any): string[] {
  const parsed = parseJsonField<string[] | Array<{content: string}>>(steps);
  
  if (!Array.isArray(parsed)) return [];
  
  // Handle both formats: string[] or {content: string}[]
  return parsed.map(step => {
    if (typeof step === 'string') return step;
    if (typeof step === 'object' && step !== null && 'content' in step) return step.content;
    return '';
  }).filter(Boolean);
}
