/**
 * Mutfak Rehberi interactive tools (P23): pure logic for the egg, pasta,
 * drying and measure tools plus the countdown timer state.
 *
 * No runtime imports on purpose: scripts/check-guide-tools.test.cjs loads this
 * file directly. Roadmap rule: results can never leave safe ranges, so every
 * calculation clamps to (or refuses outside) the bounds declared here.
 *
 * Parity rule: the mobile app's lib/guide-tools.ts is the source of truth.
 * Every shared number here (egg minutes and clamps, pasta package times and
 * timer window, drying temperatures/times/sun rules, converter units,
 * densities, rounding and limits) is the mobile value, and the test suite
 * asserts the same expectations as the mobile suite. Change both together.
 * Web-only extras: egg altitude (sea level adds nothing) and the "sensitive
 * eater" switch that forces katı; esmer şeker, kabartma tozu, karbonat.
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

/** "6 dk 30 sn" / "11 dk" for prose and screen readers (mobile `minutesLabel`). */
export function formatMinutes(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest} sn`;
  return rest ? `${m} dk ${rest} sn` : `${m} dk`;
}

/** Turkish decimal, same as mobile: 1.5 → "1,5"; trailing zeros dropped, no thousands separator. */
export function formatNumberTr(value: number, maxDecimals = 1): string {
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(value * factor) / factor;
  return String(rounded).replace(".", ",");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Amount as people type it, identical to mobile: "1,5" · "1.5" · "1/2" ·
 * "1 1/2" · "1½" · "½" → number; anything else → null. Zero and negatives
 * parse but every calculator refuses them.
 */
export function parseAmount(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  const fractions: Record<string, string> = { "½": " 1/2", "¼": " 1/4", "¾": " 3/4", "⅓": " 1/3", "⅔": " 2/3" };
  const text = input.trim().replace(/[½¼¾⅓⅔]/g, c => fractions[c]).replace(/\s+/g, " ").trim();
  if (!text) return null;
  let m = /^(\d+) (\d+)\/(\d+)$/.exec(text);
  if (m) return Number(m[3]) > 0 ? Number(m[1]) + Number(m[2]) / Number(m[3]) : null;
  m = /^(\d+)\/(\d+)$/.exec(text);
  if (m) return Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
  if (/^\d+(?:[.,]\d+)?$/.test(text)) return Number(text.replace(",", "."));
  return null;
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

export const EGG_SIZES: { id: EggSize; label: string; hint: string }[] = [
  { id: "S", label: "S", hint: "53 g altı" },
  { id: "M", label: "M", hint: "53–63 g" },
  { id: "L", label: "L", hint: "63–73 g" },
  { id: "XL", label: "XL", hint: "73 g üstü" },
];

export const EGG_STARTS: { id: EggStart; label: string; hint: string }[] = [
  { id: "fridge", label: "Buzdolabından", hint: "Soğuk yumurta" },
  { id: "room", label: "Oda sıcaklığında", hint: "En az 30 dk dışarıda" },
];

/** Web-only extra. Sea level (the default) adds nothing, so it gives the mobile numbers. */
export const EGG_ALTITUDES: { id: EggAltitude; label: string; hint: string; minutes: number }[] = [
  { id: "low", label: "0–1000 m", hint: "Deniz kıyısı, İstanbul, Ankara", minutes: 0 },
  { id: "mid", label: "1000–2000 m", hint: "Kayseri, Sivas, Erzurum", minutes: 1 },
  { id: "high", label: "2000 m +", hint: "Yayla", minutes: 2 },
];

export const EGG_DONENESS: { id: EggDoneness; label: string; summary: string; cooling: string; runny: boolean }[] = [
  {
    id: "rafadan", label: "Rafadan", summary: "Beyazı pişmiş, sarısı akışkan.", runny: true,
    cooling: "Süre dolunca 1 dakika soğuk suya al ve hemen servis et.",
  },
  {
    id: "kayisi", label: "Kayısı", summary: "Sarısı koyu, kremamsı; ortası hafif yumuşak.", runny: true,
    cooling: "Süre dolunca 2 dakika buzlu suya al; kesince sarısı akmadan durur.",
  },
  {
    id: "kati", label: "Katı", summary: "Beyazı ve sarısı tamamen pişmiş.", runny: false,
    cooling: "Süre dolunca 5 dakika buzlu suya al; kabuğu kolay soyulur, sarının çevresi yeşillenmez.",
  },
];

/* Same numbers as mobile lib/guide-tools.ts (source of truth). */
/** Minutes from boiling water for a fridge-cold M egg. */
export const EGG_BASE_MINUTES: Record<EggDoneness, number> = { rafadan: 6, kayisi: 8, kati: 11 };
/** Size correction, minutes. */
export const EGG_SIZE_OFFSET: Record<EggSize, number> = { S: -0.5, M: 0, L: 0.5, XL: 1 };
/** A room-temperature egg is ready about a minute sooner. */
export const EGG_ROOM_OFFSET = -1;
/** Safe window per doneness, minutes. Katı never goes under 10: the yolk must be fully set. */
export const EGG_RANGE: Record<EggDoneness, [number, number]> = { rafadan: [4.5, 7.5], kayisi: [6.5, 9.5], kati: [10, 13] };

/** Shortest time for a fully set yolk; no "katı" result is ever shorter. */
export const EGG_FULLY_SET_MIN_SECONDS = EGG_RANGE.kati[0] * 60;

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
  minutes: number;
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

/**
 * Minutes in boiling water, as mobile `eggTime`: base + size + room offset
 * (+ the web-only altitude offset), rounded to half minutes, then clamped to
 * the doneness' safe window.
 */
export function eggBoilTime(input: EggInput = {}): EggResult {
  const size = pick(EGG_SIZES, input.size, "M");
  const start = pick(EGG_STARTS, input.start, "fridge");
  const altitude = pick(EGG_ALTITUDES, input.altitude, "low");
  const wanted = pick(EGG_DONENESS, input.doneness, "kayisi");
  const sensitive = input.sensitive === true;
  const doneness: EggDoneness = sensitive ? "kati" : wanted;
  const [min, max] = EGG_RANGE[doneness];
  const raw = EGG_BASE_MINUTES[doneness]
    + EGG_SIZE_OFFSET[size]
    + (start === "room" ? EGG_ROOM_OFFSET : 0)
    + EGG_ALTITUDES.find(a => a.id === altitude)!.minutes;
  const minutes = clamp(roundTo(raw, 0.5), min, max);
  return { seconds: Math.round(minutes * 60), minutes, size, start, altitude, doneness, forcedFullySet: sensitive && wanted !== "kati" };
}

/* ----------------------------------------------------------------- pasta */

export type PastaShape = "spagetti" | "linguine" | "penne" | "burgu" | "fiyonk" | "rigatoni" | "eriste" | "taze";
export type PastaTexture = "al_dente" | "yumusak";

/** Typical package time (minutes) for dried pasta; fresh pasta is short. Same list as mobile. */
export const PASTA_SHAPES: { id: PastaShape; label: string; minutes: number }[] = [
  { id: "spagetti", label: "Spagetti", minutes: 9 },
  { id: "linguine", label: "Linguine", minutes: 10 },
  { id: "penne", label: "Penne", minutes: 11 },
  { id: "burgu", label: "Burgu", minutes: 10 },
  { id: "fiyonk", label: "Fiyonk", minutes: 11 },
  { id: "rigatoni", label: "Rigatoni", minutes: 12 },
  { id: "eriste", label: "Erişte", minutes: 8 },
  { id: "taze", label: "Taze makarna", minutes: 3 },
];

export const PASTA_TEXTURES: { id: PastaTexture; label: string; description: string }[] = [
  { id: "al_dente", label: "Al dente", description: "Dişe gelen, ortası hafif diri." },
  { id: "yumusak", label: "Yumuşak", description: "Tamamen yumuşak; çocuklar için ideal." },
];

/** Package minutes we accept from the person; outside → refused. */
export const PASTA_PACKAGE_RANGE: [number, number] = [2, 20];
/** Final timer window, minutes. */
export const PASTA_TIMER_RANGE: [number, number] = [2, 20];
export const PASTA_GRAMS_PER_PORTION = 100;
export const PASTA_PORTION_RANGE: [number, number] = [1, 10];
/** 1 L water and 10 g salt per 100 g pasta. */
export const PASTA_WATER_L_PER_100G = 1;
export const PASTA_SALT_G_PER_100G = 10;

export const PASTA_FRESH_NOTE = "Taze makarna çok çabuk pişer; paketinde süre yazıyorsa onu gir.";
export const PASTA_BIG_POT_NOTE = "Bu kadar su için tencere küçük kalırsa makarnayı iki partide haşla.";

/** Package minutes as typed ("9", "8,5"), parsed like mobile; null if not a number in 2–20. */
export function parsePackageMinutes(value: unknown): number | null {
  const n = parseAmount(value);
  if (n === null || n < PASTA_PACKAGE_RANGE[0] || n > PASTA_PACKAGE_RANGE[1]) return null;
  return n;
}

export interface PastaInput {
  /** A PASTA_SHAPES id, or "paket" to use packageMinutes. */
  type?: unknown;
  packageMinutes?: unknown;
  texture?: unknown;
}

export type PastaTimeResult =
  | { ok: true; seconds: number; minutes: number; packageMinutes: number; texture: PastaTexture; note: string | null }
  | { ok: false; error: "invalid_package_time" | "unknown_type" | "unknown_texture" };

/**
 * Package time is the reference (mobile `pastaPlan`): al dente = 1 minute
 * less, yumuşak = 1 minute more, rounded to half minutes, timer clamped to 2–20.
 */
export function pastaCookTime(input: PastaInput = {}): PastaTimeResult {
  let pkg: number;
  if (input.type === "paket") {
    const parsed = parsePackageMinutes(input.packageMinutes);
    if (parsed === null) return { ok: false, error: "invalid_package_time" };
    pkg = parsed;
  } else {
    const shape = PASTA_SHAPES.find(p => p.id === input.type);
    if (!shape) return { ok: false, error: "unknown_type" };
    pkg = shape.minutes;
  }
  if (input.texture !== "al_dente" && input.texture !== "yumusak") return { ok: false, error: "unknown_texture" };
  const texture: PastaTexture = input.texture;
  const minutes = clamp(roundTo(pkg + (texture === "al_dente" ? -1 : 1), 0.5), PASTA_TIMER_RANGE[0], PASTA_TIMER_RANGE[1]);
  return { ok: true, seconds: Math.round(minutes * 60), minutes, packageMinutes: pkg, texture, note: input.type === "taze" ? PASTA_FRESH_NOTE : null };
}

export interface PastaWaterSalt {
  portions: number;
  grams: number;
  waterLiters: number;
  saltGrams: number;
  /** "yaklaşık 1 ¾ tatlı kaşığı" (mobile `spoonHint`). */
  saltHint: string;
  note: string | null;
}

/** 100 g per portion (1–10), 1 L water and 10 g salt per 100 g; out of range → null. */
export function pastaWaterSalt(portionsInput: unknown): PastaWaterSalt | null {
  const portions = Math.round(Number(portionsInput));
  if (!Number.isFinite(portions) || portions < PASTA_PORTION_RANGE[0] || portions > PASTA_PORTION_RANGE[1]) return null;
  const grams = portions * PASTA_GRAMS_PER_PORTION;
  const waterLiters = (grams / 100) * PASTA_WATER_L_PER_100G;
  const saltGrams = (grams / 100) * PASTA_SALT_G_PER_100G;
  return { portions, grams, waterLiters, saltGrams, saltHint: spoonHint(saltGrams, "tuz"), note: waterLiters > 6 ? PASTA_BIG_POT_NOTE : null };
}

/* ---------------------------------------------------------------- drying */

export type DryingFoodId = "domates" | "biber" | "patlican" | "elma" | "armut" | "kayisi" | "mantar" | "nane" | "kekik";
export type DryingMethod = "firin" | "makine" | "gunes";
export type DryingGroup = "sebze" | "meyve" | "ot";

export const DRYING_METHODS: { id: DryingMethod; label: string }[] = [
  { id: "firin", label: "Fırın" },
  { id: "makine", label: "Kurutma makinesi" },
  { id: "gunes", label: "Güneş" },
];

export interface DryingSpec {
  prep: string;
  /** null when drying happens at ambient temperature (sun, shade). */
  tempC: [number, number] | null;
  /** Ambient conditions or oven handling. */
  conditions: string;
  time: { min: number; max: number; unit: "saat" | "gün" };
  ready: string;
  storage: string;
  notes: string[];
}

export interface DryingFood {
  id: DryingFoodId;
  label: string;
  group: DryingGroup;
  methods: Record<DryingMethod, DryingSpec | { notRecommended: string }>;
}

/** Safe bounds every spec must respect (checked by the tests). */
export const DRYING_TEMP_LIMITS: Record<DryingGroup, [number, number]> = {
  sebze: [50, 70],
  meyve: [50, 70],
  ot: [35, 50],
};

/** Sun drying only on hot, dry days. */
export const SUN_MIN_AIR_C = 30;

export const DRYING_GENERAL_NOTES = [
  "Yalnızca taze, sağlam ve iyice yıkanmış ürün kurut; ezik ya da küflü kısımları ayıkla.",
  "Dilimleri aynı kalınlıkta kes ve tepsiye üst üste gelmeden diz.",
  "Et, tavuk ve balık kurutma (jerky) bu rehberde yok: güvenli olması için özel ısıl işlem ve ölçüm gerekir.",
];

export const DRYING_NO_MEAT_NOTE = "Et ve balık bu araçta yok. Güvenli kuru et ve balık için önce etin iç sıcaklığının 71 °C'ye ulaşması, ardından düzenli sıcaklık ve sıkı hijyen kontrolü gerekir. Ev fırını ya da güneş bunu güvenle sağlayamadığı için Salmonella ve E. coli gibi bakterilerin hayatta kalma riski yüksektir; bu yüzden et ve balık kurutmayı önermiyoruz.";

/* Data below mirrors mobile DRYING_FOODS one to one (temperatures, times, sun rules, warnings). */
const OVEN = "Fırını en düşük ısıya ayarla, kapağı tahta kaşıkla 3–5 cm aralık bırak; fanlı programı kullan. Tepsilerin yerini ara ara değiştir.";
const DEHYDRATOR = "Raflar arasında hava dolaşsın; yarı sürede rafların yerini değiştir.";
const SUN = "Hava en az 30 °C, güneşli ve nemi düşük olmalı. Tepsiyi yerden yükseğe koy, üstünü tülbentle ört; akşam çiğ düşmeden içeri al.";
/** After sun drying fruit (mobile SUN_PASTEURIZE): kills insect eggs. */
export const DRYING_SUN_PASTEURIZE = "Güneşte kuruyan ürünü saklamadan önce 48 saat dondurucuda beklet ya da 70 °C fırında 30 dakika tut; olası böcek yumurtalarından arınır.";
const CONDITION = "Kavanoza gevşek doldurup 7–10 gün her gün çalkala; kavanozda buğu oluşursa kurutmaya geri dön.";
const LOW_ACID = "Düşük asitli sebzelerde güneşte bozulma riski yüksek olduğu için önermiyoruz; fırın ya da kurutma makinesini kullan.";
const OIL_TOMATO = "Yağlı domatesi oda sıcaklığında saklama: botulizm riski taşır.";
const WILD_MUSHROOM = "Yalnızca market ya da güvenilir kaynaktan kültür mantarı kurut; yabani mantarı tanımadan toplama.";
const HERB_OVEN = "Fırının en düşük ısısı 50 °C üstündeyse fırın yerine gölgede kurut. Kapağı aralık bırak, sık kontrol et.";
const HERB_DEHYDRATOR = "En düşük ayarı kullan; yüksek ısı aromayı uçurur.";

const FRUIT_STORAGE = `Ağzı sıkı kapanan kavanozda, serin ve karanlık yerde 6 aya kadar; daha uzun saklamak için dondurucuya al. ${CONDITION}`;
const VEG_STORAGE = "Ağzı sıkı kapanan kavanozda, serin ve karanlık yerde 6 aya kadar. Nem kapmışsa ya da kokusu değiştiyse tüketme.";
const TOMATO_STORAGE = `${FRUIT_STORAGE} Zeytinyağına yatırırsan buzdolabında sakla ve 1 hafta içinde tüket.`;
const MINT_STORAGE = "Işık almayan, ağzı kapalı kavanozda; aroması 6–12 ayda azalır. Kullanırken ufala.";
const THYME_STORAGE = "Işık almayan, ağzı kapalı kavanozda; aroması 6–12 ayda azalır.";

export const DRYING_FOODS: DryingFood[] = [
  {
    id: "domates", label: "Domates", group: "meyve",
    methods: {
      firin: {
        prep: "İkiye ya da 1 cm kalın dilimlere böl; çekirdekli suyunu hafifçe al. Kesik yüz yukarı gelecek şekilde diz, az tuz serp.",
        tempC: [60, 70], conditions: OVEN, time: { min: 6, max: 12, unit: "saat" },
        ready: "Deri gibi esnek; sıkınca nem çıkmıyor, ortası yapış yapış değil.", storage: TOMATO_STORAGE, notes: [OIL_TOMATO],
      },
      makine: {
        prep: "İkiye ya da 1 cm kalın dilimlere böl; çekirdekli suyunu hafifçe al. Kesik yüz yukarı gelecek şekilde diz, az tuz serp.",
        tempC: [55, 60], conditions: DEHYDRATOR, time: { min: 8, max: 16, unit: "saat" },
        ready: "Deri gibi esnek; sıkınca nem çıkmıyor, ortası yapış yapış değil.", storage: TOMATO_STORAGE, notes: [OIL_TOMATO],
      },
      gunes: {
        prep: "İkiye böl, çekirdekli suyunu hafifçe al; kesik yüzlere tuz serp ve tepsiye diz.",
        tempC: null, conditions: SUN, time: { min: 4, max: 8, unit: "gün" },
        ready: "Deri gibi esnek; sıkınca nem çıkmıyor, ortası yapış yapış değil.", storage: TOMATO_STORAGE, notes: [DRYING_SUN_PASTEURIZE, OIL_TOMATO],
      },
    },
  },
  {
    id: "biber", label: "Biber", group: "sebze",
    methods: {
      firin: {
        prep: "Sap ve çekirdeklerini çıkar; 1 cm şeritler ya da halkalar halinde doğra. Acı biberde eldiven kullan.",
        tempC: [60, 70], conditions: OVEN, time: { min: 6, max: 10, unit: "saat" },
        ready: "Gevrek ve kırılgan; büküldüğünde çıt diye kırılıyor.", storage: VEG_STORAGE, notes: [],
      },
      makine: {
        prep: "Sap ve çekirdeklerini çıkar; 1 cm şeritler ya da halkalar halinde doğra. Acı biberde eldiven kullan.",
        tempC: [55, 60], conditions: DEHYDRATOR, time: { min: 8, max: 12, unit: "saat" },
        ready: "Gevrek ve kırılgan; büküldüğünde çıt diye kırılıyor.", storage: VEG_STORAGE, notes: [],
      },
      gunes: { notRecommended: `Biber geleneksel olarak güneşte de kurutulur. ${LOW_ACID}` },
    },
  },
  {
    id: "patlican", label: "Patlıcan", group: "sebze",
    methods: {
      firin: {
        prep: "6 mm kalın dilimle. Kaynar suda 3–4 dakika haşla, soğuk suya alıp iyice kurula; renk ve güvenlik için önerilir.",
        tempC: [60, 70], conditions: OVEN, time: { min: 4, max: 8, unit: "saat" },
        ready: "Gevrek ve kırılgan; ortasında nem kalmamış.", storage: VEG_STORAGE, notes: [],
      },
      makine: {
        prep: "6 mm kalın dilimle. Kaynar suda 3–4 dakika haşla, soğuk suya alıp iyice kurula; renk ve güvenlik için önerilir.",
        tempC: [55, 60], conditions: DEHYDRATOR, time: { min: 6, max: 10, unit: "saat" },
        ready: "Gevrek ve kırılgan; ortasında nem kalmamış.", storage: VEG_STORAGE, notes: [],
      },
      gunes: { notRecommended: `Dolmalık patlıcan geleneksel olarak güneşte de kurutulur. ${LOW_ACID}` },
    },
  },
  {
    id: "elma", label: "Elma", group: "meyve",
    methods: {
      firin: {
        prep: "Çekirdek evini çıkar, 6 mm halkalar kes. Kararmasın diye 1 litre suya 1 limonun suyunu ekleyip dilimleri 10 dakika beklet, kurula.",
        tempC: [60, 70], conditions: OVEN, time: { min: 5, max: 10, unit: "saat" },
        ready: "Deri gibi esnek; ikiye kesince içinde nem görünmüyor.", storage: FRUIT_STORAGE, notes: [],
      },
      makine: {
        prep: "Çekirdek evini çıkar, 6 mm halkalar kes. Kararmasın diye 1 litre suya 1 limonun suyunu ekleyip dilimleri 10 dakika beklet, kurula.",
        tempC: [55, 60], conditions: DEHYDRATOR, time: { min: 6, max: 12, unit: "saat" },
        ready: "Deri gibi esnek; ikiye kesince içinde nem görünmüyor.", storage: FRUIT_STORAGE, notes: [],
      },
      gunes: {
        prep: "Çekirdek evini çıkar, 6 mm halkalar kes; limonlu suda 10 dakika beklet, kurula.",
        tempC: null, conditions: SUN, time: { min: 2, max: 4, unit: "gün" },
        ready: "Deri gibi esnek; ikiye kesince içinde nem görünmüyor.", storage: FRUIT_STORAGE, notes: [DRYING_SUN_PASTEURIZE],
      },
    },
  },
  {
    id: "armut", label: "Armut", group: "meyve",
    methods: {
      firin: {
        prep: "Kabuğunu soy, çekirdek evini çıkar; 6 mm dilimle. Limonlu suda 10 dakika beklet, kurula.",
        tempC: [60, 70], conditions: OVEN, time: { min: 6, max: 12, unit: "saat" },
        ready: "Esnek ve hafif yumuşak; sıkınca nem çıkmıyor.", storage: FRUIT_STORAGE, notes: [],
      },
      makine: {
        prep: "Kabuğunu soy, çekirdek evini çıkar; 6 mm dilimle. Limonlu suda 10 dakika beklet, kurula.",
        tempC: [55, 60], conditions: DEHYDRATOR, time: { min: 8, max: 14, unit: "saat" },
        ready: "Esnek ve hafif yumuşak; sıkınca nem çıkmıyor.", storage: FRUIT_STORAGE, notes: [],
      },
      gunes: {
        prep: "Kabuğunu soy, çekirdek evini çıkar; 6 mm dilimle. Limonlu suda 10 dakika beklet, kurula.",
        tempC: null, conditions: SUN, time: { min: 3, max: 5, unit: "gün" },
        ready: "Esnek ve hafif yumuşak; sıkınca nem çıkmıyor.", storage: FRUIT_STORAGE, notes: [DRYING_SUN_PASTEURIZE],
      },
    },
  },
  {
    id: "kayisi", label: "Kayısı", group: "meyve",
    methods: {
      firin: {
        prep: "İkiye böl, çekirdeğini çıkar. Limonlu suda 10 dakika beklet, kurula; kesik yüz yukarı gelecek şekilde diz.",
        tempC: [60, 70], conditions: OVEN, time: { min: 12, max: 20, unit: "saat" },
        ready: "Esnek, yapışkan değil; ikiye katlayınca nem damlası çıkmıyor.", storage: FRUIT_STORAGE, notes: [],
      },
      makine: {
        prep: "İkiye böl, çekirdeğini çıkar. Limonlu suda 10 dakika beklet, kurula; kesik yüz yukarı gelecek şekilde diz.",
        tempC: [55, 60], conditions: DEHYDRATOR, time: { min: 18, max: 30, unit: "saat" },
        ready: "Esnek, yapışkan değil; ikiye katlayınca nem damlası çıkmıyor.", storage: FRUIT_STORAGE, notes: [],
      },
      gunes: {
        prep: "İkiye böl, çekirdeğini çıkar; kesik yüz yukarı gelecek şekilde diz.",
        tempC: null, conditions: SUN, time: { min: 3, max: 6, unit: "gün" },
        ready: "Esnek, yapışkan değil; ikiye katlayınca nem damlası çıkmıyor.", storage: FRUIT_STORAGE, notes: [DRYING_SUN_PASTEURIZE],
      },
    },
  },
  {
    id: "mantar", label: "Mantar", group: "sebze",
    methods: {
      firin: {
        prep: "Yıkamadan, nemli bezle ya da fırçayla temizle; 6 mm dilimle.",
        tempC: [55, 65], conditions: OVEN, time: { min: 3, max: 6, unit: "saat" },
        ready: "Kuru ve sert; büküldüğünde kırılıyor.", storage: VEG_STORAGE, notes: [WILD_MUSHROOM],
      },
      makine: {
        prep: "Yıkamadan, nemli bezle ya da fırçayla temizle; 6 mm dilimle.",
        tempC: [50, 55], conditions: DEHYDRATOR, time: { min: 4, max: 8, unit: "saat" },
        ready: "Kuru ve sert; büküldüğünde kırılıyor.", storage: VEG_STORAGE, notes: [WILD_MUSHROOM],
      },
      gunes: { notRecommended: `Mantar nemi hızla çeker. ${LOW_ACID}` },
    },
  },
  {
    id: "nane", label: "Nane", group: "ot",
    methods: {
      firin: {
        prep: "Yıkayıp iyice kurula; yaprakları saplarından ayır ve tepsiye tek kat ser.",
        tempC: [40, 50], conditions: HERB_OVEN, time: { min: 1, max: 3, unit: "saat" },
        ready: "Yapraklar parmakta ufalanıyor, saplar çıt diye kırılıyor.", storage: MINT_STORAGE, notes: [],
      },
      makine: {
        prep: "Yıkayıp iyice kurula; yaprakları saplarından ayır ve rafa tek kat ser.",
        tempC: [35, 45], conditions: HERB_DEHYDRATOR, time: { min: 2, max: 4, unit: "saat" },
        ready: "Yapraklar parmakta ufalanıyor, saplar çıt diye kırılıyor.", storage: MINT_STORAGE, notes: [],
      },
      gunes: {
        prep: "Yıkayıp iyice kurula; küçük demetler halinde bağla.",
        tempC: null, conditions: "Doğrudan güneş rengini ve aromasını soldurur: demetleri gölgede, havadar bir yerde baş aşağı as ya da tülbent üstüne ser.",
        time: { min: 5, max: 10, unit: "gün" },
        ready: "Yapraklar parmakta ufalanıyor, saplar çıt diye kırılıyor.", storage: MINT_STORAGE, notes: [],
      },
    },
  },
  {
    id: "kekik", label: "Kekik", group: "ot",
    methods: {
      firin: {
        prep: "Yıkayıp iyice kurula; dalları tepsiye tek kat ser.",
        tempC: [40, 50], conditions: HERB_OVEN, time: { min: 1, max: 2, unit: "saat" },
        ready: "Yapraklar dallardan kolayca dökülüyor ve ufalanıyor.", storage: THYME_STORAGE, notes: [],
      },
      makine: {
        prep: "Yıkayıp iyice kurula; dalları rafa tek kat ser.",
        tempC: [35, 45], conditions: HERB_DEHYDRATOR, time: { min: 2, max: 4, unit: "saat" },
        ready: "Yapraklar dallardan kolayca dökülüyor ve ufalanıyor.", storage: THYME_STORAGE, notes: [],
      },
      gunes: {
        prep: "Yıkayıp iyice kurula; küçük demetler halinde bağla.",
        tempC: null, conditions: "Doğrudan güneş yerine gölgede, havadar bir yerde baş aşağı as.",
        time: { min: 5, max: 10, unit: "gün" },
        ready: "Yapraklar dallardan kolayca dökülüyor ve ufalanıyor.", storage: THYME_STORAGE, notes: [],
      },
    },
  },
];

export type DryingPlanResult =
  | ({
    ok: true; food: DryingFood; method: DryingMethod; tempLabel: string; timeLabel: string;
    /** The post-sun freezer/oven step when it applies (also kept in `notes`, as on mobile). */
    finish: string | null;
  } & DryingSpec)
  | { ok: false; error: "unknown_food" | "unknown_method" }
  | { ok: false; error: "not_recommended"; food: DryingFood; method: DryingMethod; reason: string; alternatives: DryingMethod[] };

/** Food × method, same rules as mobile `dryingPlan`. Meat, fish and unknown foods are refused. */
export function dryingPlan(foodId: unknown, methodId: unknown): DryingPlanResult {
  const food = DRYING_FOODS.find(f => f.id === foodId);
  if (!food) return { ok: false, error: "unknown_food" };
  const method = DRYING_METHODS.find(m => m.id === methodId)?.id;
  if (!method) return { ok: false, error: "unknown_method" };
  const spec = food.methods[method];
  if ("notRecommended" in spec) {
    return {
      ok: false, error: "not_recommended", food, method, reason: spec.notRecommended,
      alternatives: DRYING_METHODS.map(m => m.id).filter(m => m !== method && !("notRecommended" in food.methods[m])),
    };
  }
  const tempLabel = spec.tempC
    ? `${spec.tempC[0]}–${spec.tempC[1]} °C`
    : method === "gunes" && food.group === "ot" ? "Gölgede, oda sıcaklığı" : `Hava en az ${SUN_MIN_AIR_C} °C`;
  const timeLabel = `${spec.time.min}–${spec.time.max} ${spec.time.unit}`;
  const finish = spec.notes.includes(DRYING_SUN_PASTEURIZE) ? DRYING_SUN_PASTEURIZE : null;
  return { ok: true, food, method, tempLabel, timeLabel, finish, ...spec };
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

/**
 * Grams per ml, level (silme) measures. Every ingredient mobile has uses the
 * mobile density and key; esmer şeker, kabartma tozu and karbonat are web-only.
 */
export const MEASURE_INGREDIENTS: { id: string; label: string; density: number; aliases: string[] }[] = [
  { id: "un", label: "Un", density: 0.55, aliases: ["buğday unu", "beyaz un"] },
  { id: "seker", label: "Toz şeker", density: 0.85, aliases: ["şeker", "toz şeker", "kristal şeker"] },
  { id: "pudra_sekeri", label: "Pudra şekeri", density: 0.56, aliases: ["pudra şekeri", "pudra"] },
  { id: "esmer_seker", label: "Esmer şeker (bastırılmış)", density: 0.9, aliases: ["esmer şeker"] },
  { id: "pirinc", label: "Pirinç", density: 0.85, aliases: ["pirinç", "baldo", "osmancık"] },
  { id: "bulgur", label: "Bulgur", density: 0.75, aliases: ["bulgur", "pilavlık bulgur"] },
  { id: "mercimek", label: "Mercimek", density: 0.85, aliases: ["mercimek", "kırmızı mercimek", "yeşil mercimek"] },
  { id: "tuz", label: "Tuz", density: 1.2, aliases: ["tuz", "sofra tuzu", "ince tuz"] },
  { id: "kabartma_tozu", label: "Kabartma tozu", density: 0.8, aliases: ["kabartma tozu"] },
  { id: "karbonat", label: "Karbonat", density: 1.2, aliases: ["karbonat", "yemek sodası"] },
  { id: "tereyagi", label: "Tereyağı", density: 0.91, aliases: ["tereyağı", "tereyag", "margarin"] },
  { id: "sut", label: "Süt", density: 1.03, aliases: ["süt"] },
  { id: "su", label: "Su", density: 1, aliases: ["su"] },
  { id: "yogurt", label: "Yoğurt", density: 1.05, aliases: ["yoğurt"] },
  { id: "sivi_yag", label: "Sıvı yağ", density: 0.92, aliases: ["sıvı yağ", "yağ", "ayçiçek yağı", "mısırözü yağı"] },
  { id: "zeytinyagi", label: "Zeytinyağı", density: 0.91, aliases: ["zeytinyağı", "zeytin yağı"] },
  { id: "bal", label: "Bal", density: 1.42, aliases: ["bal"] },
  { id: "kakao", label: "Kakao", density: 0.42, aliases: ["kakao", "kakao tozu"] },
  { id: "irmik", label: "İrmik", density: 0.75, aliases: ["irmik"] },
  { id: "nisasta", label: "Nişasta", density: 0.55, aliases: ["nişasta", "mısır nişastası", "buğday nişastası"] },
];

const trLower = (s: string) => s.replace(/I/g, "ı").replace(/İ/g, "i").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").trim();

/** Density for an id or a Turkish name (aliases, any case); null when unknown. */
export function ingredientDensity(nameOrId: unknown): { id: string; label: string; density: number } | null {
  if (typeof nameOrId !== "string" || !nameOrId.trim()) return null;
  const q = trLower(nameOrId);
  const hit = MEASURE_INGREDIENTS.find(i => i.id === nameOrId || trLower(i.label) === q || i.aliases.some(a => trLower(a) === q));
  return hit ? { id: hit.id, label: hit.label, density: hit.density } : null;
}

/** Largest amount converted: 10 litres (grams count through their density, as on mobile). */
export const MEASURE_MAX_ML = 10_000;

/** Household units (cups, spoons) are only shown between ¼ and 20, as on mobile. */
export const MEASURE_HOUSEHOLD_RANGE: [number, number] = [0.25, 20];

/** Mobile rounding: grams/ml by size (0,5 · 1 · 5 · 10); cups and spoons to quarters. */
export function roundMeasure(value: number, unit: MeasureUnitId): number {
  if (unit === "g" || unit === "ml") {
    if (value < 10) return roundTo(value, 0.5);
    if (value < 100) return Math.round(value);
    if (value < 1000) return roundTo(value, 5);
    return roundTo(value, 10);
  }
  return roundTo(value, 0.25);
}

/** 1.5 → "1 ½ su bardağı", 0.25 → "¼ çay kaşığı"; grams/ml with a Turkish decimal comma. */
export function formatMeasure(value: number, unit: MeasureUnitId): string {
  const v = roundMeasure(value, unit);
  if (unit === "g" || unit === "ml") return `${formatNumberTr(v)} ${unit}`;
  const whole = Math.floor(v + 1e-9);
  const frac = Math.round((v - whole) * 4);
  const glyph = ["", "¼", "½", "¾"][frac] || "";
  const num = whole && glyph ? `${whole} ${glyph}` : whole ? String(whole) : glyph || "0";
  return `${num} ${MEASURE_UNITS.find(u => u.id === unit)?.short || ""}`.trim();
}

/** "yaklaşık ¾ tatlı kaşığı" style hint for a weight (salt for pasta water, etc.). */
export function spoonHint(grams: number, ingredient: string): string {
  const info = ingredientDensity(ingredient);
  if (!info || !(grams > 0)) return "";
  const ml = grams / info.density;
  const tbsp = ml / 15;
  if (tbsp >= 2) return `yaklaşık ${formatMeasure(tbsp, "yemek_kasigi")}`;
  const dsp = ml / 10;
  if (dsp >= 0.75) return `yaklaşık ${formatMeasure(dsp, "tatli_kasigi")}`;
  return `yaklaşık ${formatMeasure(Math.max(0.25, ml / 5), "cay_kasigi")}`;
}

export interface MeasureAmount {
  unit: MeasureUnitId;
  /** Exact value in the unit. */
  value: number;
  /** Rounded value shown to people. */
  rounded: number;
  /** "1 ½ su bardağı", "120 g"; for an out-of-range cup/spoon a "¼ … az" / "20 … fazla" hint. */
  text: string;
  /** A cup or spoon amount under ¼ or over 20: mobile hides such rows. */
  outOfRange: boolean;
}

export type MeasureResult =
  | { ok: true; ml: number; grams: number | null; result: MeasureAmount; others: MeasureAmount[] }
  | { ok: false; error: "invalid_amount" | "unknown_unit" | "unknown_ingredient" | "too_large" };

export const MEASURE_ERRORS: Record<"invalid_amount" | "unknown_unit" | "unknown_ingredient" | "too_large", string> = {
  invalid_amount: "Sıfırdan büyük bir miktar yaz: 2, 1,5 ya da 1/2 gibi.",
  unknown_unit: "Bu ölçü birimini tanımıyoruz.",
  unknown_ingredient: "Gram çevirisi için malzemeyi seç. Listede olmayan bir malzemenin yoğunluğunu bilmediğimiz için gram hesaplamıyoruz; bardak, kaşık ve ml arasında çevirebilirsin.",
  too_large: "Bu kadar büyük bir miktarı çevirmiyoruz; 10 litre / 10 kg altında bir değer yaz.",
};

function amountIn(unit: (typeof MEASURE_UNITS)[number], value: number): MeasureAmount {
  const rounded = roundMeasure(value, unit.id);
  const household = unit.id !== "g" && unit.id !== "ml";
  const outOfRange = household && (value < MEASURE_HOUSEHOLD_RANGE[0] || value > MEASURE_HOUSEHOLD_RANGE[1]);
  const text = !outOfRange ? formatMeasure(value, unit.id)
    : value < MEASURE_HOUSEHOLD_RANGE[0] ? `¼ ${unit.short}ndan az` : `20 ${unit.short}ndan fazla`;
  return { unit: unit.id, value, rounded, text, outOfRange };
}

/**
 * Converts between household measures, ml and grams with the mobile math:
 * everything goes through millilitres; grams need a known ingredient
 * (density), an unknown or missing one is refused, never guessed.
 * `others` are the remaining units, skipping out-of-range cups/spoons and
 * grams for an unknown ingredient (mobile `converterRows`).
 */
export function convertMeasure(input: { amount: unknown; from: unknown; to: unknown; ingredient?: unknown }): MeasureResult {
  const n = parseAmount(input.amount);
  if (n === null || n <= 0) return { ok: false, error: "invalid_amount" };
  const from = MEASURE_UNITS.find(u => u.id === input.from);
  const to = MEASURE_UNITS.find(u => u.id === input.to);
  if (!from || !to) return { ok: false, error: "unknown_unit" };
  const info = ingredientDensity(input.ingredient);
  const needsDensity = (from.id === "g") !== (to.id === "g");
  if (needsDensity && !info) return { ok: false, error: "unknown_ingredient" };

  const density = info ? info.density : 1;
  const ml = from.ml === null ? n / density : n * from.ml;
  if (ml > MEASURE_MAX_ML) return { ok: false, error: "too_large" };
  const grams = from.ml === null ? n : info ? ml * info.density : null;
  /** Value in a unit; null when it would need an unknown density. */
  const valueIn = (unit: (typeof MEASURE_UNITS)[number]): number | null => {
    if (unit.id === from.id) return n;
    if (unit.ml === null) return info ? ml * info.density : null;
    if (from.ml === null && !info) return null;
    return ml / unit.ml;
  };

  const result = amountIn(to, valueIn(to) as number);
  const others = MEASURE_UNITS
    .filter(u => u.id !== to.id && u.id !== from.id)
    .map(u => {
      const value = valueIn(u);
      return value === null ? null : amountIn(u, value);
    })
    .filter((a): a is MeasureAmount => a !== null && !a.outOfRange);
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
