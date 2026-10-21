/**
 * Small, deterministic helpers for the cooking guide (Pilot).
 * They only read the recipe's own text: nothing is inferred by a model and
 * nothing is shown that the step does not literally mention.
 */

function fold(value: string): string {
  return value.toLocaleLowerCase("tr-TR").normalize("NFC")
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
}

function tokens(value: string): string[] {
  return fold(value).replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
}

// State words that describe how an ingredient is bought or prepared, not
// what it is. They are ignored on the ingredient side only.
const STATE_WORDS = new Set([
  "taze", "kuru", "cig", "cekilmis", "haslanmis", "rendelenmis", "dogranmis", "kiyilmis",
  "ince", "iri", "kucuk", "buyuk", "orta", "boy", "yarim", "sicak", "soguk", "ilik",
  "eritilmis", "yumusatilmis", "oda", "sicakliginda", "organik", "ev", "yapimi", "sizma",
]);

// Heads that classify rather than identify: "Parmesan peyniri" is about
// parmesan, "fesleğen yaprakları" about basil.
const CLASSIFIERS = new Set(["peyniri", "peynir", "yapraklari", "yapragi", "yaprak", "disi", "dis", "sapi", "tanesi", "fileto", "but", "gogsu"]);

// Heads that change identity: "haşlama suyu" is water, not gnocchi.
const IDENTITY_HEADS = new Set(["su", "suyu", "yag", "yagi", "sos", "sosu", "puresi", "kabugu", "rendesi"]);

// Turkish inflections allowed after a word in the step text
// ("domatesleri", "gnocchinin", "zeytinyağını", "suyundan").
const SUFFIX = /^(?:l[ae]r)?(?:i|u|si|su|yi|yu|ni|nu|in|un|nin|nun|ini|unu|n?[dt][ae]n|y?l[ae]|n?[dt][ae]|y?[ae]|n[ae])?$/;

function wordMatches(stepWord: string, word: string): boolean {
  return stepWord === word || (stepWord.startsWith(word) && SUFFIX.test(stepWord.slice(word.length)));
}

function phraseIn(step: string[], phrase: string[]): boolean {
  if (!phrase.length || phrase.length > step.length) return false;
  for (let start = 0; start + phrase.length <= step.length; start++) {
    if (phrase.every((word, i) => wordMatches(step[start + i], word))) return true;
  }
  return false;
}

/** Indices of ingredients the step text names. Conservative by design. */
export function ingredientsInStep(names: string[], step: string): number[] {
  const stepWords = tokens(step);
  const found: number[] = [];
  names.forEach((name, index) => {
    const main = (typeof name === "string" ? name : "").replace(/\([^()]*\)/g, " ");
    const words = tokens(main).filter(word => !STATE_WORDS.has(word));
    if (!words.length) return;
    const head = words[words.length - 1];
    const candidates: string[][] = [words];
    if (words.length > 1 && !IDENTITY_HEADS.has(head)) {
      candidates.push(CLASSIFIERS.has(head) ? words.slice(0, -1) : [head]);
    }
    if (candidates.some(phrase => phrase.every(word => word.length >= 2) && phraseIn(stepWords, phrase))) found.push(index);
  });
  return found;
}

const NUMBER_WORDS: Record<string, number> = {
  "bir": 1, "iki": 2, "uc": 3, "dort": 4, "bes": 5, "alti": 6, "yedi": 7, "sekiz": 8, "dokuz": 9, "on": 10,
  "on bes": 15, "yirmi": 20, "yirmi bes": 25, "otuz": 30, "kirk": 40, "kirk bes": 45, "elli": 50, "altmis": 60,
};

/**
 * Durations a step states, in minutes, largest-first and unique.
 * "8-10 dakika" → 10, "1 saat" → 60, "yarım saat" → 30, "beş dakika" → 5.
 */
export function durationsInStep(step: string): number[] {
  const text = fold(step);
  const minutes = new Set<number>();
  const numeric = /(\d{1,3})(?:\s*(?:-|–|ile|ila|veya)\s*(\d{1,3}))?\s*(dakika|dk|saat)\b/g;
  for (const match of text.matchAll(numeric)) {
    const value = Math.max(Number(match[1]), Number(match[2] || 0));
    minutes.add(match[3] === "saat" ? value * 60 : value);
  }
  const words = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join("|");
  const spoken = new RegExp(`(?:^|\\s)(${words}|yarim)\\s*(dakika|dk|saat)\\b`, "g");
  for (const match of text.matchAll(spoken)) {
    const value = match[1] === "yarim" ? 0.5 : NUMBER_WORDS[match[1]];
    minutes.add(match[2] === "saat" ? value * 60 : value);
  }
  return [...minutes].filter(m => Number.isFinite(m) && m >= 1 && m <= 240).sort((a, b) => b - a);
}
