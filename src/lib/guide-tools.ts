/**
 * Mutfak Rehberi interactive tools (P23): pure logic for the egg, pasta,
 * drying and measure tools plus the countdown timer state.
 *
 * No runtime imports on purpose: scripts/check-guide-tools.test.cjs loads this
 * file directly. Roadmap rule: results can never leave safe ranges, so every
 * calculation clamps to (or refuses outside) the bounds declared here.
 *
 * Values (see the P23 report for sources):
 * - Egg times: whole eggs lowered into boiling water, EU size M from the
 *   fridge as the base (Serious Eats boiled-egg tests; USDA FSIS: yolk and
 *   white firm for people at risk).
 * - Pasta: 1 L water and 10 g salt per 100 g dry pasta; typical package times.
 * - Drying: NCHFP (National Center for Home Food Preservation) temperatures
 *   and times, kept conservative (60 °C produce, 35–50 °C herbs).
 * - Densities: King Arthur / USDA cup weights per ml, cross-checked with common
 *   Turkish kitchen references, rounded.
 */

import type { GuideToolKey } from "./guides";

/* ------------------------------------------------------------- tool meta */

export interface GuideToolMeta {
  key: GuideToolKey;
  /** Anchor on /rehber/araclar. */
  anchor: string;
  title: string;
  description: string;
}

export const GUIDE_TOOLS: Record<GuideToolKey, GuideToolMeta> = {
  egg_doneness: {
    key: "egg_doneness", anchor: "yumurta", title: "Yumurta pişme derecesi",
    description: "Boyuta, başlangıç sıcaklığına ve istediğin kıvama göre kaynar suda kaç dakika? Zamanlayıcıyla birlikte.",
  },
  pasta_timer: {
    key: "pasta_timer", anchor: "makarna", title: "Makarna zamanlayıcı",
    description: "Makarna türüne ya da paketteki süreye göre al dente veya yumuşak; porsiyona göre su ve tuz miktarı.",
  },
  drying_guide: {
    key: "drying_guide", anchor: "kurutma", title: "Kurutma rehberi",
    description: "Domatesten nanesine: fırında, kurutma makinesinde ya da güneşte güvenli sıcaklık, süre ve saklama.",
  },
  measure_converter: {
    key: "measure_converter", anchor: "olcu", title: "Ölçü çevirici",
    description: "Su bardağı, çay bardağı, kaşık, mililitre ve gram arasında malzemeye göre çeviri.",
  },
};

export const GUIDE_TOOL_ORDER: GuideToolKey[] = ["egg_doneness", "pasta_timer", "drying_guide", "measure_converter"];

export const GUIDE_TOOLS_PATH = "/rehber/araclar";

/* ------------------------------------------------------------ formatting */

/** "6:30" from seconds (always m:ss, minutes may exceed 59). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** "6 dk 30 sn" / "11 dk" for prose and screen readers. */
export function formatMinutes(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest} sn`;
  return rest ? `${m} dk ${rest} sn` : `${m} dk`;
}

/** Turkish decimal: 2.5 → "2,5"; integers stay plain. */
export function formatDecimal(value: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: maxFractionDigits }).format(value);
}

const QUARTERS = ["", "¼", "½", "¾"];

/** 1.25 → "1¼", 0.5 → "½", 3 → "3". Input must already be a multiple of ¼. */
export function formatQuarters(value: number): string {
  const quarters = Math.round(value * 4);
  const whole = Math.floor(quarters / 4);
  const frac = QUARTERS[quarters % 4];
  if (whole === 0) return frac || "0";
  return `${whole}${frac}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ------------------------------------------------------------- the timer */

/**
 * Countdown state based on timestamps, not tick counting, so a throttled
 * background tab still shows the right time when it wakes up.
 */
export interface TimerState {
  /** Full duration in ms. */
  duration: number;
  /** Wall-clock ms when it ends while running; null while idle or paused. */
  endsAt: number | null;
  /** Ms left while idle or paused. */
  remaining: number;
}

export type TimerStatus = "idle" | "running" | "paused" | "done";

export function timerIdle(durationMs: number): TimerState {
  const duration = Math.max(0, Math.round(durationMs));
  return { duration, endsAt: null, remaining: duration };
}

export function timerRemaining(state: TimerState, now: number): number {
  return state.endsAt === null ? state.remaining : Math.max(0, state.endsAt - now);
}

export function timerStatus(state: TimerState, now: number): TimerStatus {
  const left = timerRemaining(state, now);
  // A zero-length timer (no valid time chosen yet) is idle, never "done".
  if (left <= 0) return state.duration > 0 ? "done" : "idle";
  if (state.endsAt !== null) return "running";
  return left >= state.duration ? "idle" : "paused";
}

export function timerStart(state: TimerState, now: number): TimerState {
  if (state.endsAt !== null || state.remaining <= 0) return state;
  return { ...state, endsAt: now + state.remaining };
}

export function timerPause(state: TimerState, now: number): TimerState {
  if (state.endsAt === null) return state;
  return { ...state, endsAt: null, remaining: Math.max(0, state.endsAt - now) };
}

export function timerReset(state: TimerState, durationMs = state.duration): TimerState {
  return timerIdle(durationMs);
}

/* ------------------------------------------------------------------- egg */

export type EggSize = "S" | "M" | "L" | "XL";
export type EggStart = "fridge" | "room";
export type EggDoneness = "rafadan" | "kayisi" | "kati";
export type EggAltitude = "low" | "mid" | "high";

export const EGG_SIZES: { id: EggSize; label: string; hint: string; adjust: number }[] = [
  { id: "S", label: "S", hint: "53 g altı", adjust: -30 },
  { id: "M", label: "M", hint: "53–63 g", adjust: 0 },
  { id: "L", label: "L", hint: "63–73 g", adjust: 45 },
  { id: "XL", label: "XL", hint: "73 g üstü", adjust: 90 },
];

export const EGG_STARTS: { id: EggStart; label: string; hint: string; adjust: number }[] = [
  { id: "fridge", label: "Buzdolabından", hint: "Soğuk yumurta", adjust: 0 },
  { id: "room", label: "Oda sıcaklığında", hint: "En az 30 dk dışarıda", adjust: -60 },
];

export const EGG_ALTITUDES: { id: EggAltitude; label: string; hint: string; adjust: number }[] = [
  { id: "low", label: "0–1000 m", hint: "Deniz kıyısı, İstanbul, Ankara", adjust: 0 },
  { id: "mid", label: "1000–2000 m", hint: "Kayseri, Sivas, Erzurum", adjust: 60 },
  { id: "high", label: "2000 m +", hint: "Yayla", adjust: 120 },
];

export const EGG_DONENESS: {
  id: EggDoneness; label: string; summary: string; base: number; min: number; max: number; cooling: string; runny: boolean;
}[] = [
  {
    id: "rafadan", label: "Rafadan", summary: "Beyazı pişmiş, sarısı akışkan.", base: 360, min: 270, max: 600, runny: true,
    cooling: "Süre dolunca 1 dakika soğuk suya al ve hemen servis et.",
  },
  {
    id: "kayisi", label: "Kayısı", summary: "Sarısı koyu ve kremamsı, kenarları hafifçe tutmuş.", base: 450, min: 360, max: 690, runny: true,
    cooling: "Süre dolunca 2 dakika buzlu suya al; kesince sarısı akmadan durur.",
  },
  {
    id: "kati", label: "Katı", summary: "Beyazı ve sarısı tamamen pişmiş.", base: 660, min: 600, max: 960, runny: false,
    cooling: "Süre dolunca 5 dakika buzlu suya al; kabuğu kolay soyulur, sarının çevresi yeşillenmez.",
  },
];

/** Shortest time for a fully set yolk; no "katı" result is ever shorter. */
export const EGG_FULLY_SET_MIN_SECONDS = 600;

export const EGG_SAFETY_NOTE = "Rafadan ve kayısı kıvamda sarı tam pişmez. Çocuklar, hamileler, yaşlılar ve bağışıklığı zayıf kişiler için yumurtayı sarısı tamamen katılaşana kadar pişir.";

export interface EggInput {
  size?: unknown;
  start?: unknown;
  doneness?: unknown;
  altitude?: unknown;
  /** Child, pregnant, elderly or immunocompromised eater: forces a fully set yolk. */
  sensitive?: unknown;
}

export interface EggResult {
  seconds: number;
  size: EggSize;
  start: EggStart;
  altitude: EggAltitude;
  doneness: EggDoneness;
  /** True when a runny choice was replaced by "katı" for a sensitive eater. */
  forcedFullySet: boolean;
}

function pick<T extends string>(list: { id: T }[], value: unknown, fallback: T): T {
  return list.some(item => item.id === value) ? value as T : fallback;
}

/** Minutes in boiling water, rounded to 15 s and clamped to the doneness' safe range. */
export function eggBoilTime(input: EggInput = {}): EggResult {
  const size = pick(EGG_SIZES, input.size, "M");
  const start = pick(EGG_STARTS, input.start, "fridge");
  const altitude = pick(EGG_ALTITUDES, input.altitude, "low");
  const wanted = pick(EGG_DONENESS, input.doneness, "kayisi");
  const sensitive = input.sensitive === true;
  const doneness: EggDoneness = sensitive ? "kati" : wanted;
  const level = EGG_DONENESS.find(d => d.id === doneness)!;
  const raw = level.base
    + EGG_SIZES.find(s => s.id === size)!.adjust
    + EGG_STARTS.find(s => s.id === start)!.adjust
    + EGG_ALTITUDES.find(a => a.id === altitude)!.adjust;
  let seconds = clamp(Math.round(raw / 15) * 15, level.min, level.max);
  if (doneness === "kati") seconds = Math.max(seconds, EGG_FULLY_SET_MIN_SECONDS);
  return { seconds, size, start, altitude, doneness, forcedFullySet: sensitive && wanted !== "kati" };
}

/* ----------------------------------------------------------------- pasta */

export type PastaTexture = "aldente" | "yumusak";

export const PASTA_TYPES: { id: string; label: string; minutes: number; precook?: boolean }[] = [
  { id: "spagetti", label: "Spagetti", minutes: 9 },
  { id: "linguine", label: "Linguine", minutes: 10 },
  { id: "penne", label: "Penne", minutes: 11 },
  { id: "fusilli", label: "Burgu (fusilli)", minutes: 10 },
  { id: "farfalle", label: "Kelebek (farfalle)", minutes: 11 },
  { id: "rigatoni", label: "Rigatoni", minutes: 12 },
  { id: "dirsek", label: "Dirsek", minutes: 8 },
  { id: "eriste", label: "Erişte", minutes: 9 },
  { id: "lazanya", label: "Lazanya yaprağı", minutes: 4, precook: true },
];

export const PASTA_PACKAGE_MIN = 2;
export const PASTA_PACKAGE_MAX = 30;
export const PASTA_MIN_SECONDS = 120;
export const PASTA_GRAMS_MIN = 50;
export const PASTA_GRAMS_MAX = 1000;
export const PASTA_GRAMS_STEP = 50;
/** Per 100 g dry pasta. */
export const PASTA_WATER_LITERS_PER_100G = 1;
export const PASTA_SALT_GRAMS_PER_100G = 10;
/** Fine table salt: 1 yemek kaşığı (15 ml) ≈ 18 g, 1 çay kaşığı (5 ml) ≈ 6 g. */
const SALT_TBSP_GRAMS = 18;
const SALT_TSP_GRAMS = 6;

export interface PastaInput {
  /** A PASTA_TYPES id, or "paket" to use packageMinutes. */
  type?: unknown;
  packageMinutes?: unknown;
  texture?: unknown;
}

export type PastaTimeResult =
  | { ok: true; seconds: number; precook: boolean; packageMinutes: number; texture: PastaTexture | null }
  | { ok: false; error: "invalid_package_time" };

/** Package minutes as typed ("9", "8,5"); null if not a number in 2–30. */
export function parsePackageMinutes(value: unknown): number | null {
  const raw = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim().replace(",", ".")) : NaN;
  if (!Number.isFinite(raw) || raw < PASTA_PACKAGE_MIN || raw > PASTA_PACKAGE_MAX) return null;
  return Math.round(raw * 2) / 2;
}

/**
 * Package time is the reference: al dente = 1 minute less, yumuşak = 1 minute
 * more. Lazanya sheets are only pre-cooked (they finish in the oven).
 */
export function pastaCookTime(input: PastaInput = {}): PastaTimeResult {
  const texture: PastaTexture = input.texture === "yumusak" ? "yumusak" : "aldente";
  let minutes: number;
  let precook = false;
  if (input.type === "paket") {
    const parsed = parsePackageMinutes(input.packageMinutes);
    if (parsed === null) return { ok: false, error: "invalid_package_time" };
    minutes = parsed;
  } else {
    const type = PASTA_TYPES.find(p => p.id === input.type) || PASTA_TYPES[0];
    minutes = type.minutes;
    precook = Boolean(type.precook);
  }
  const offset = precook ? 0 : texture === "aldente" ? -1 : 1;
  const seconds = Math.max(PASTA_MIN_SECONDS, Math.round((minutes + offset) * 60));
  return { ok: true, seconds, precook, packageMinutes: minutes, texture: precook ? null : texture };
}

export interface PastaWaterSalt {
  grams: number;
  waterLiters: number;
  saltGrams: number;
  /** Salt as a kitchen spoon amount, e.g. { amount: 1.5, unit: "yemek kaşığı" }. */
  saltSpoon: { amount: number; unit: "yemek kaşığı" | "çay kaşığı" };
  /** Rough servings at 100 g per main-course portion. */
  servings: number;
}

/** Clamp a portion to 50–1000 g in 50 g steps. */
export function clampPastaGrams(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 200;
  return clamp(Math.round(n / PASTA_GRAMS_STEP) * PASTA_GRAMS_STEP, PASTA_GRAMS_MIN, PASTA_GRAMS_MAX);
}

/** 1 L water and 10 g salt per 100 g pasta, scaled linearly. */
export function pastaWaterSalt(gramsInput: unknown): PastaWaterSalt {
  const grams = clampPastaGrams(gramsInput);
  const waterLiters = (grams / 100) * PASTA_WATER_LITERS_PER_100G;
  const saltGrams = (grams / 100) * PASTA_SALT_GRAMS_PER_100G;
  const tbsp = Math.round((saltGrams / SALT_TBSP_GRAMS) * 2) / 2;
  const saltSpoon = tbsp >= 1
    ? { amount: tbsp, unit: "yemek kaşığı" as const }
    : { amount: Math.max(0.5, Math.round((saltGrams / SALT_TSP_GRAMS) * 2) / 2), unit: "çay kaşığı" as const };
  return { grams, waterLiters, saltGrams, saltSpoon, servings: Math.max(0.5, Math.round(grams / 50) / 2) };
}

/* ---------------------------------------------------------------- drying */

export type DryingMethod = "oven" | "dehydrator" | "sun";
export type DryingKind = "produce" | "herb";

export const DRYING_METHODS: { id: DryingMethod; label: string }[] = [
  { id: "oven", label: "Fırın" },
  { id: "dehydrator", label: "Kurutma makinesi" },
  { id: "sun", label: "Güneş / açık hava" },
];

/**
 * Safe air temperatures. Produce: warm enough to dry before spoiling, cool
 * enough not to cook or case-harden. Herbs: low heat keeps the aroma.
 */
export const DRYING_SAFE_BOUNDS: Record<DryingKind, { min: number; max: number }> = {
  produce: { min: 50, max: 70 },
  herb: { min: 35, max: 50 },
};

/** Sun drying only on hot, dry days. */
export const SUN_MIN_AIR_C = 30;

export interface DryingRange { min: number; max: number }
export interface DryingTime extends DryingRange { unit: "saat" | "gün" }

export interface DryingMethodPlan {
  /** Air temperature in °C; null for sun / open-air drying. */
  temperature: DryingRange | null;
  time: DryingTime;
  note?: string;
}

export interface DryingFood {
  id: string;
  label: string;
  kind: DryingKind;
  prep: string;
  ready: string;
  storage: string;
  methods: Partial<Record<DryingMethod, DryingMethodPlan>>;
  /** Why a method is left out for this food. */
  unsupported?: Partial<Record<DryingMethod, string>>;
}

const FRUIT_STORAGE = "Önce şartlandır: kavanozu üçte iki dolduracak kadar koy, 7–10 gün her gün çalkala. Camda buğu ya da nem görürsen kurumaya geri gönder. Sonra hava almayan kavanozda serin ve karanlık yerde 6–12 ay saklanır.";
const VEG_STORAGE = "Tamamen soğuyunca kuru, hava almayan kavanoza ya da bez torbaya koy; serin, kuru ve karanlık yerde 6–12 ay saklanır. Küf, koku ya da nem görürsen tüketme.";

export const DRYING_FOODS: DryingFood[] = [
  {
    id: "domates", label: "Domates", kind: "produce",
    prep: "Olgun ama sert domatesleri yıka. Çeri domatesi ikiye böl, iri domatesi 1 cm kalınlıkta dilimle ya da dörde böl. Kesik yüzü yukarıda, parçalar birbirine değmeden diz; istersen hafifçe tuzla.",
    ready: "Deri gibi esnek ve kuru; sıkınca nem çıkmıyor, yapış yapış değil. Ortası hâlâ sulu olanları kurumaya devam ettir.",
    storage: "Tamamen soğuyunca hava almayan kavanozda serin ve karanlık yerde 6 aya kadar saklanır. Zeytinyağına yatıracaksan buzdolabında tut ve 1 hafta içinde tüket; yağda oda sıcaklığında bekletme.",
    methods: {
      oven: { temperature: { min: 60, max: 70 }, time: { min: 8, max: 14, unit: "saat" } },
      dehydrator: { temperature: { min: 57, max: 63 }, time: { min: 6, max: 12, unit: "saat" } },
      sun: { temperature: null, time: { min: 4, max: 8, unit: "gün" } },
    },
  },
  {
    id: "biber", label: "Biber", kind: "produce",
    prep: "Yıka, sapını ve çekirdeklerini çıkar; 1 cm şeritler ya da halkalar halinde kes. Dolmalık biber kurusu için bütün biberi oyup ipe diz (bu yalnızca güneşte kurutulur).",
    ready: "Sert ve kırılgan ya da deri gibi esnek; içinde nem kalmamış. İpe dizili bütün biberlerin içi de tamamen kurumuş olmalı.",
    storage: VEG_STORAGE,
    methods: {
      oven: { temperature: { min: 60, max: 70 }, time: { min: 6, max: 10, unit: "saat" } },
      dehydrator: { temperature: { min: 57, max: 63 }, time: { min: 8, max: 12, unit: "saat" } },
      sun: { temperature: null, time: { min: 5, max: 14, unit: "gün" }, note: "İpe dizili bütün biber şeritlerden daha uzun sürer." },
    },
  },
  {
    id: "patlican", label: "Patlıcan", kind: "produce",
    prep: "Yıka, 1 cm kalınlıkta dilimle ve 4 dakika buharda haşla; rengi ve dokusu korunur. Dolmalık patlıcan kurusu için bütün patlıcanı oyup ipe diz (haşlamadan, yalnızca güneşte).",
    ready: "Deri gibi sert ya da kırılgan; dilimin ortasında yumuşak yer kalmamış.",
    storage: VEG_STORAGE,
    methods: {
      oven: { temperature: { min: 60, max: 70 }, time: { min: 6, max: 10, unit: "saat" } },
      dehydrator: { temperature: { min: 57, max: 63 }, time: { min: 6, max: 12, unit: "saat" } },
      sun: { temperature: null, time: { min: 7, max: 14, unit: "gün" }, note: "İpe dizili bütün patlıcan dilimlerden daha uzun sürer." },
    },
  },
  {
    id: "elma", label: "Elma", kind: "produce",
    prep: "Yıka, çekirdek evini çıkar; kabuklu ya da kabuksuz 0,5 cm halkalar halinde kes. Kararmaması için 1 litre suya 1 limonun suyunu kat, dilimleri 5 dakika beklet, süz ve kurula.",
    ready: "Deri gibi esnek; ortadan kesince ıslaklık görünmüyor, ikiye katlayınca yapışmıyor.",
    storage: FRUIT_STORAGE,
    methods: {
      oven: { temperature: { min: 60, max: 70 }, time: { min: 6, max: 10, unit: "saat" } },
      dehydrator: { temperature: { min: 57, max: 63 }, time: { min: 6, max: 12, unit: "saat" } },
      sun: { temperature: null, time: { min: 3, max: 5, unit: "gün" } },
    },
  },
  {
    id: "kayisi", label: "Kayısı", kind: "produce",
    prep: "Olgun ama sert kayısıları yıka, ikiye bölüp çekirdeğini çıkar. Kararmaması için limonlu suda 10 dakika beklet. Kesik yüzü yukarıda, aralıklı diz.",
    ready: "Deri gibi esnek, ortası yumuşak ama ıslak değil; sıkınca su çıkmıyor.",
    storage: FRUIT_STORAGE,
    methods: {
      oven: { temperature: { min: 60, max: 70 }, time: { min: 18, max: 28, unit: "saat" } },
      dehydrator: { temperature: { min: 57, max: 63 }, time: { min: 20, max: 28, unit: "saat" } },
      sun: { temperature: null, time: { min: 4, max: 7, unit: "gün" } },
    },
  },
  {
    id: "mantar", label: "Mantar", kind: "produce",
    prep: "Yıkamak yerine nemli bir bezle sil, 0,5 cm dilimle. Yalnızca kültür mantarı ya da güvenilir yerden alınmış mantar kullan.",
    ready: "Kâğıt gibi kuru; büktüğünde esnemeden kırılıyor.",
    storage: "Hava almayan kavanozda serin ve karanlık yerde 6–12 ay saklanır. Kullanmadan önce 20 dakika ılık suda beklet; süzülmüş suyunu yemeğe katabilirsin.",
    methods: {
      oven: { temperature: { min: 60, max: 65 }, time: { min: 4, max: 8, unit: "saat" } },
      dehydrator: { temperature: { min: 52, max: 60 }, time: { min: 4, max: 10, unit: "saat" } },
    },
    unsupported: { sun: "Mantar güneşte yavaş kurur ve kururken bozulabilir. Fırın ya da kurutma makinesi kullan." },
  },
  {
    id: "nane-kekik", label: "Nane ve kekik", kind: "herb",
    prep: "Sabah çiy kalktıktan sonra topla. Gerekiyorsa yıka ve iyice kurula; sararmış yaprakları ayıkla. Küçük demetler yap ya da tepsiye tek kat ser.",
    ready: "Yapraklar parmak arasında ufalanıyor, saplar bükünce kırılıyor.",
    storage: "Yaprakları saplarından ayır; hava almayan, mümkünse koyu renkli kavanozda ışıktan uzak sakla. Aroması en iyi 6–12 ay korunur.",
    methods: {
      oven: { temperature: { min: 40, max: 50 }, time: { min: 2, max: 4, unit: "saat" }, note: "Fırının bu kadar düşük ısıyı tutamıyorsa gölgede kurut; yüksek ısıda aroma uçar." },
      dehydrator: { temperature: { min: 35, max: 45 }, time: { min: 1, max: 4, unit: "saat" } },
      sun: { temperature: null, time: { min: 5, max: 14, unit: "gün" } },
    },
  },
];

export const DRYING_METHOD_NOTES: Record<DryingMethod, string> = {
  oven: "Fırın kapağını tahta bir kaşıkla 3–5 cm aralık bırak ki nem çıksın; fanlı modu kullan. Sıcaklığı bir fırın termometresiyle kontrol et, tepsileri ara ara çevir.",
  dehydrator: "Tepsileri tek kat doldur, parçalar birbirine değmesin. Kurumanın eşit olması için tepsilerin yerini ara ara değiştir.",
  sun: `Yalnızca gündüz en az ${SUN_MIN_AIR_C} °C, nemi düşük (yaklaşık %60 altı), rüzgârlı ve tozsuz günlerde kurut. Tepsiyi yerden yükselt, üstünü tülbentle ört ve akşam içeri al; gece çiyi yeniden nemlendirir.`,
};

export const DRYING_HERB_SHADE_NOTE = "Otları doğrudan güneşte değil; gölgede, havadar ve tozsuz bir yerde kurut. Güneş rengini ve aromasını soldurur.";

/** After sun drying fruit or vegetables (NCHFP): kills insect eggs. */
export const DRYING_SUN_PASTEURIZE = "Bitince böcek yumurtalarına karşı son bir işlem yap: 48 saat dondurucuda (−18 °C) beklet ya da tek kat tepside 75 °C fırında 30 dakika tut.";

export const DRYING_NO_MEAT_NOTE = "Et ve balık bu araçta yok. Güvenli kuru et ve balık için önce etin iç sıcaklığının 71 °C'ye ulaşması, ardından düzenli sıcaklık ve sıkı hijyen kontrolü gerekir. Ev fırını ya da güneş bunu güvenle sağlayamadığı için Salmonella ve E. coli gibi bakterilerin hayatta kalma riski yüksektir; bu yüzden et ve balık kurutmayı önermiyoruz.";

export type DryingPlanResult =
  | {
    ok: true; food: DryingFood; method: DryingMethod; plan: DryingMethodPlan;
    /** Extra notes for the method: oven/dehydrator handling, sun conditions, herb shade. */
    methodNotes: string[];
    /** Required finishing step (sun-dried produce). */
    finish: string | null;
  }
  | { ok: false; error: "unknown_food" | "unknown_method" }
  | { ok: false; error: "unsupported"; food: DryingFood; method: DryingMethod; reason: string; alternatives: DryingMethod[] };

export function dryingPlan(foodId: unknown, methodId: unknown): DryingPlanResult {
  const food = DRYING_FOODS.find(f => f.id === foodId);
  if (!food) return { ok: false, error: "unknown_food" };
  const method = DRYING_METHODS.find(m => m.id === methodId)?.id;
  if (!method) return { ok: false, error: "unknown_method" };
  const plan = food.methods[method];
  if (!plan) {
    return {
      ok: false, error: "unsupported", food, method,
      reason: food.unsupported?.[method] || "Bu yöntem bu yiyecek için önerilmiyor.",
      alternatives: DRYING_METHODS.map(m => m.id).filter(id => food.methods[id]),
    };
  }
  const methodNotes = method === "sun" && food.kind === "herb" ? [DRYING_HERB_SHADE_NOTE] : [DRYING_METHOD_NOTES[method]];
  const finish = method === "sun" && food.kind === "produce" ? DRYING_SUN_PASTEURIZE : null;
  return { ok: true, food, method, plan, methodNotes, finish };
}

/** True when every temperature in the table sits inside the safe bounds. */
export function dryingRangeIsSafe(kind: DryingKind, range: DryingRange | null): boolean {
  if (range === null) return true;
  const bounds = DRYING_SAFE_BOUNDS[kind];
  return range.min >= bounds.min && range.max <= bounds.max && range.min <= range.max;
}

export function formatRange(range: DryingRange, unit: string): string {
  return range.min === range.max ? `${range.min} ${unit}` : `${range.min}–${range.max} ${unit}`;
}

/* --------------------------------------------------------------- measure */

export type MeasureUnitId = "su_bardagi" | "cay_bardagi" | "yemek_kasigi" | "tatli_kasigi" | "cay_kasigi" | "ml" | "g";

export const MEASURE_UNITS: { id: MeasureUnitId; label: string; short: string; ml: number | null }[] = [
  { id: "su_bardagi", label: "Su bardağı (200 ml)", short: "su bardağı", ml: 200 },
  { id: "cay_bardagi", label: "Çay bardağı (100 ml)", short: "çay bardağı", ml: 100 },
  { id: "yemek_kasigi", label: "Yemek kaşığı (15 ml)", short: "yemek kaşığı", ml: 15 },
  { id: "tatli_kasigi", label: "Tatlı kaşığı (10 ml)", short: "tatlı kaşığı", ml: 10 },
  { id: "cay_kasigi", label: "Çay kaşığı (5 ml)", short: "çay kaşığı", ml: 5 },
  { id: "ml", label: "Mililitre (ml)", short: "ml", ml: 1 },
  { id: "g", label: "Gram (g)", short: "g", ml: null },
];

/** Grams per ml, level (silme) measures. */
export const MEASURE_INGREDIENTS: { id: string; label: string; density: number }[] = [
  { id: "un", label: "Un (elenmiş)", density: 0.55 },
  { id: "toz-seker", label: "Toz şeker", density: 0.84 },
  { id: "pudra-sekeri", label: "Pudra şekeri", density: 0.5 },
  { id: "esmer-seker", label: "Esmer şeker (bastırılmış)", density: 0.9 },
  { id: "pirinc", label: "Pirinç (çiğ)", density: 0.84 },
  { id: "irmik", label: "İrmik", density: 0.75 },
  { id: "nisasta", label: "Mısır nişastası", density: 0.5 },
  { id: "kakao", label: "Kakao", density: 0.4 },
  { id: "tuz", label: "Tuz (sofra tuzu)", density: 1.2 },
  { id: "kabartma-tozu", label: "Kabartma tozu", density: 0.8 },
  { id: "karbonat", label: "Karbonat", density: 1.2 },
  { id: "tereyagi", label: "Tereyağı", density: 0.95 },
  { id: "sut", label: "Süt", density: 1.03 },
  { id: "su", label: "Su", density: 1 },
  { id: "yogurt", label: "Yoğurt", density: 1.03 },
  { id: "sivi-yag", label: "Sıvı yağ", density: 0.92 },
  { id: "zeytinyagi", label: "Zeytinyağı", density: 0.91 },
  { id: "bal", label: "Bal", density: 1.42 },
];

/** Largest amount converted: 20 litres / 20 kg. Anything bigger is a typo. */
export const MEASURE_MAX_ML = 20000;
export const MEASURE_MAX_G = 20000;

const UNICODE_FRACTIONS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };

/**
 * Amount as people type it: "2", "1,5", "1.5", "1/2", "1 1/2", "1½", "½".
 * Null for anything else (including negatives and zero).
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (typeof value !== "string") return null;
  let s = value.trim().replace(/\s+/g, " ");
  if (!s) return null;
  let extra = 0;
  const uni = s.match(/^(\d+)?\s?([¼½¾⅓⅔⅛])$/);
  if (uni) {
    extra = UNICODE_FRACTIONS[uni[2]];
    s = uni[1] || "0";
    const whole = Number(s);
    const total = whole + extra;
    return total > 0 ? total : null;
  }
  const mixed = s.match(/^(\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const den = Number(mixed[3]);
    if (den === 0) return null;
    const total = Number(mixed[1]) + Number(mixed[2]) / den;
    return total > 0 ? total : null;
  }
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    const total = Number(frac[1]) / den;
    return total > 0 ? total : null;
  }
  if (!/^\d+(?:[.,]\d+)?$/.test(s)) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Sensible rounding for grams / ml: <1 → 0.1, <10 → 0.5, <100 → 1, else 5. */
export function roundMetric(value: number): number {
  if (value < 1) return Math.max(0.1, Math.round(value * 10) / 10);
  if (value < 10) return Math.round(value * 2) / 2;
  if (value < 100) return Math.round(value);
  return Math.round(value / 5) * 5;
}

export interface MeasureAmount {
  unit: MeasureUnitId;
  /** Exact value in the unit. */
  value: number;
  /** Rounded value shown to people. */
  rounded: number;
  /** "1½ su bardağı", "120 g". */
  text: string;
  /** Less than ¼ of a household unit: too small to measure with it. */
  tooSmall: boolean;
}

export type MeasureResult =
  | { ok: true; ml: number; grams: number | null; result: MeasureAmount; others: MeasureAmount[] }
  | { ok: false; error: "invalid_amount" | "unknown_unit" | "unknown_ingredient" | "too_large" };

export const MEASURE_ERRORS: Record<"invalid_amount" | "unknown_unit" | "unknown_ingredient" | "too_large", string> = {
  invalid_amount: "Sıfırdan büyük bir miktar yaz: 2, 1,5 ya da 1/2 gibi.",
  unknown_unit: "Bu ölçü birimini tanımıyoruz.",
  unknown_ingredient: "Gram çevirisi için malzemeyi seç. Listede olmayan bir malzemenin yoğunluğunu bilmediğimiz için gram hesaplamıyoruz; bardak, kaşık ve ml arasında çevirebilirsin.",
  too_large: "Bu miktar bir mutfak ölçüsü için çok büyük; 20 litre / 20 kg'a kadar çevirebiliriz.",
};

function amountIn(unit: (typeof MEASURE_UNITS)[number], ml: number, grams: number | null): MeasureAmount | null {
  if (unit.ml === null) {
    if (grams === null) return null;
    const rounded = roundMetric(grams);
    return { unit: unit.id, value: grams, rounded, text: `${formatDecimal(rounded)} g`, tooSmall: false };
  }
  const value = ml / unit.ml;
  if (unit.id === "ml") {
    const rounded = roundMetric(value);
    return { unit: unit.id, value, rounded, text: `${formatDecimal(rounded)} ml`, tooSmall: false };
  }
  const rounded = Math.round(value * 4) / 4;
  const tooSmall = rounded === 0;
  return { unit: unit.id, value, rounded, text: tooSmall ? `¼ ${unit.short}ndan az` : `${formatQuarters(rounded)} ${unit.short}`, tooSmall };
}

/**
 * Converts between household measures, ml and grams. Grams need a known
 * ingredient (density); an unknown or missing one is refused, never guessed.
 */
export function convertMeasure(input: { amount: unknown; from: unknown; to: unknown; ingredient?: unknown }): MeasureResult {
  const amount = parseAmount(input.amount);
  if (amount === null) return { ok: false, error: "invalid_amount" };
  const from = MEASURE_UNITS.find(u => u.id === input.from);
  const to = MEASURE_UNITS.find(u => u.id === input.to);
  if (!from || !to) return { ok: false, error: "unknown_unit" };
  const ingredient = MEASURE_INGREDIENTS.find(i => i.id === input.ingredient) || null;
  const needsDensity = from.ml === null || to.ml === null;
  if (needsDensity && from.id !== to.id && !ingredient) return { ok: false, error: "unknown_ingredient" };

  let ml: number;
  let grams: number | null;
  if (from.ml === null) {
    if (amount > MEASURE_MAX_G) return { ok: false, error: "too_large" };
    grams = amount;
    ml = ingredient ? amount / ingredient.density : NaN;
  } else {
    ml = amount * from.ml;
    if (ml > MEASURE_MAX_ML) return { ok: false, error: "too_large" };
    grams = ingredient ? ml * ingredient.density : null;
  }
  if (from.id === "g" && to.id === "g" && !ingredient) {
    const rounded = roundMetric(amount);
    return { ok: true, ml: NaN, grams: amount, result: { unit: "g", value: amount, rounded, text: `${formatDecimal(rounded)} g`, tooSmall: false }, others: [] };
  }
  const result = amountIn(to, ml, grams)!;
  const others = MEASURE_UNITS
    .filter(u => u.id !== to.id && u.id !== from.id)
    .map(u => amountIn(u, ml, grams))
    .filter((a): a is MeasureAmount => a !== null && !a.tooSmall && !(a.unit !== "ml" && a.unit !== "g" && a.rounded > 20));
  return { ok: true, ml, grams, result, others };
}

/* --------------------------------------------------------------- JSON-LD */

/** CollectionPage + ItemList of WebApplication entries + BreadcrumbList for /rehber/araclar. */
export function guideToolsJsonLd(siteUrl: string, description: string): Record<string, unknown>[] {
  const url = `${siteUrl}${GUIDE_TOOLS_PATH}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Mutfak araçları",
      description,
      url,
      inLanguage: "tr-TR",
      isPartOf: { "@type": "WebSite", name: "Tariften", url: siteUrl },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: GUIDE_TOOL_ORDER.length,
        itemListElement: GUIDE_TOOL_ORDER.map((key, i) => {
          const tool = GUIDE_TOOLS[key];
          return {
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "WebApplication",
              name: tool.title,
              description: tool.description,
              url: `${url}#${tool.anchor}`,
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Web",
              browserRequirements: "JavaScript gerekir",
              inLanguage: "tr-TR",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
              publisher: { "@type": "Organization", name: "Tariften", url: siteUrl },
            },
          };
        }),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Anasayfa", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Mutfak Rehberi", item: `${siteUrl}/rehber` },
        { "@type": "ListItem", position: 3, name: "Mutfak araçları", item: url },
      ],
    },
  ];
}
