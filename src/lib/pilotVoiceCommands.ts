/**
 * Only exact, short Turkish commands can control the pilot.
 * Text recognized from spoken recipe instructions must not trigger actions.
 * There are no AI calls, remote requests or audio retention here.
 */
export type PilotVoiceCommand =
  | { type: "next" | "previous" | "read" | "pause_audio" | "resume_audio" | "stop_audio"
      | "pause_timer" | "resume_timer" | "cancel_timer" | "pause_context" | "cancel_context" | "step_status" | "mute_mic" | "stop_alarm" | "help" | "close_modal" }
  | { type: "start_timer"; minutes: number };

const numberWords: Record<string, number> = {
  bir: 1, iki: 2, üç: 3, dört: 4, beş: 5, altı: 6, yedi: 7, sekiz: 8,
  dokuz: 9, on: 10, "on beş": 15, yirmi: 20, otuz: 30, kırk: 40,
};

export function normalizePilotCommand(raw: string): string {
  return raw.toLocaleLowerCase("tr-TR")
    .normalize("NFC")
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePilotCommand(raw: string): PilotVoiceCommand | null {
  const c = normalizePilotCommand(raw);
  if (!c || c.length > 64 || c.split(" ").length > 7) return null;

  if (/^(sonraki( adım| adıma geç)?|sıradaki( adım)?|bir sonraki( adım)?|ileri( geç| git)?|ilerle|geç)$/.test(c)) return { type: "next" };
  if (/^(önceki( adım| adıma dön)?|bir önceki|geri( dön| git)?)$/.test(c)) return { type: "previous" };
  if (/^(oku|konuş|anlat|tekrar( oku| et)?|adımı (oku|tekrar oku|seslendir)|tarifi oku|seslendir)$/.test(c)) return { type: "read" };
  if (/^(okumayı duraklat|sesi duraklat)$/.test(c)) return { type: "pause_audio" };
  if (/^(okumaya devam et|sesi sürdür)$/.test(c)) return { type: "resume_audio" };
  if (/^(sesi durdur|okumayı durdur)$/.test(c)) return { type: "stop_audio" };
  if (/^(sayacı durdur|sayaç durdur|süreyi durdur|süreyi duraklat|sayacı duraklat|sayaç duraklat|zamanlayıcıyı durdur|sayacı duraklatır mısın)$/.test(c)) return { type: "pause_timer" };
  if (/^(sayacı başlat|sayaç devam et|sayacı sürdür|süreyi sürdür|süreyi devam ettir|sayaca devam et)$/.test(c)) return { type: "resume_timer" };
  if (/^(sayacı iptal et|sayaç iptal|süreyi iptal et|sayacı sıfırla|sayaç sıfırla|zamanlayıcıyı iptal et)$/.test(c)) return { type: "cancel_timer" };
  if (/^(duraklat|durdur|bekle|biraz bekle)$/.test(c)) return { type: "pause_context" };
  if (/^(iptal|iptal et|sıfırla)$/.test(c)) return { type: "cancel_context" };
  if (/^(pasife al|mikrofonu kapat|sesli komutları kapat|dinlemeyi durdur)$/.test(c)) return { type: "mute_mic" };
  if (/^(kaçıncı adımdayım|hangi adımdayım|kaçıncı adım|neredeyiz|şu an hangi adımdayız)$/.test(c)) return { type: "step_status" };
  if (/^(devam et|devam)$/.test(c)) return { type: "resume_audio" };
  if (/^(alarmı sustur|alarmı kapat|alarmı durdur|sus|tamam)$/.test(c)) return { type: "stop_alarm" };
  if (/^(yardım|komutlar|ne diyebilirim)$/.test(c)) return { type: "help" };
  if (/^(kapat|menüyü kapat|yardımı kapat)$/.test(c)) return { type: "close_modal" };

  const match = c.match(/^((?:\d{1,2}|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on beş|on|yirmi|otuz|kırk)) dakika(?:lık)?(?: süre| sayaç)? (?:başlat|kur)$/);
  if (match) {
    const minutes = Number(match[1]) || numberWords[match[1]];
    if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 60) {
      return { type: "start_timer", minutes };
    }
  }
  return null;
}
