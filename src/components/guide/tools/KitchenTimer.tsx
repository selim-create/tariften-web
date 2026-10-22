"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Pause, Play, RotateCcw } from "lucide-react";
import {
  formatClock, formatMinutes, timerIdle, timerPause, timerRemaining, timerReset, timerStart, timerStatus, type TimerState,
} from "@/lib/guide-tools";

type AudioCtor = typeof AudioContext;

/** Three soft beeps, scheduled on the audio clock so a background tab still rings on time. */
function scheduleBeeps(ctx: AudioContext, delaySeconds: number): OscillatorNode[] {
  const nodes: OscillatorNode[] = [];
  const start = ctx.currentTime + Math.max(0, delaySeconds);
  for (let i = 0; i < 3; i++) {
    const at = start + i * 0.42;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.18, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.3);
    nodes.push(osc);
  }
  return nodes;
}

/**
 * Countdown for a kitchen tool. Time is kept as an end timestamp (see
 * timerStart in guide-tools), so a throttled background tab is never behind;
 * the screen refreshes every 250 ms while running and on tab focus.
 * End alert: a calm visual state, a screen-reader announcement, the tab title
 * and (optional) a WebAudio beep — no audio files.
 */
export default function KitchenTimer({ seconds, label, doneText, disabled = false }: {
  seconds: number;
  /** Accessible name, e.g. "Yumurta zamanlayıcısı". */
  label: string;
  /** Shown when time is up, e.g. "Yumurtayı buzlu suya al." */
  doneText: string;
  disabled?: boolean;
}) {
  const durationMs = Math.max(0, Math.round(seconds)) * 1000;
  const [stored, setStored] = useState<TimerState>(() => timerIdle(durationMs));
  const [now, setNow] = useState(0);
  const [sound, setSound] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const audioRef = useRef<AudioContext | null>(null);
  const beepsRef = useRef<OscillatorNode[]>([]);
  const titleRef = useRef<string | null>(null);

  // While idle the timer follows the chosen settings; once started it keeps its own duration.
  const idle = stored.endsAt === null && stored.remaining === stored.duration;
  const state = idle && stored.duration !== durationMs ? timerIdle(durationMs) : stored;
  const status = timerStatus(state, now);
  const remainingMs = status === "running" ? timerRemaining(state, now) : state.remaining;
  const changed = !idle && state.duration !== durationMs;

  function cancelBeeps() {
    for (const node of beepsRef.current) {
      try { node.stop(); node.disconnect(); } catch { /* already stopped */ }
    }
    beepsRef.current = [];
  }

  function audio(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!audioRef.current) {
        const Ctor: AudioCtor | undefined = window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
        if (!Ctor) return null;
        audioRef.current = new Ctor();
      }
      if (audioRef.current.state === "suspended") void audioRef.current.resume();
      return audioRef.current;
    } catch {
      return null;
    }
  }

  function armBeeps(msLeft: number) {
    cancelBeeps();
    const ctx = audio();
    if (ctx) beepsRef.current = scheduleBeeps(ctx, msLeft / 1000);
  }

  function restoreTitle() {
    if (titleRef.current !== null) {
      document.title = titleRef.current;
      titleRef.current = null;
    }
  }

  // Tick while running; finish exactly once.
  useEffect(() => {
    if (stored.endsAt === null) return;
    const endsAt = stored.endsAt;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= endsAt) {
        setStored(s => (s.endsAt === endsAt ? { ...s, endsAt: null, remaining: 0 } : s));
        setAnnouncement(`Süre doldu. ${doneText}`);
        if (titleRef.current === null) {
          titleRef.current = document.title;
          document.title = `Süre doldu · ${titleRef.current}`;
        }
        try { navigator.vibrate?.([220, 120, 220]); } catch { /* not supported */ }
      }
    };
    const id = window.setInterval(tick, 250);
    const exact = window.setTimeout(tick, Math.max(0, endsAt - Date.now()) + 20);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(exact);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [stored.endsAt, doneText]);

  // Leave nothing behind when the tool unmounts.
  useEffect(() => () => {
    for (const node of beepsRef.current) {
      try { node.stop(); } catch { /* already stopped */ }
    }
    if (titleRef.current !== null) document.title = titleRef.current;
    void audioRef.current?.close().catch(() => {});
  }, []);

  function start() {
    const t = Date.now();
    restoreTitle();
    const next = timerStart(state, t);
    setStored(next);
    setNow(t);
    if (sound) armBeeps(timerRemaining(next, t));
    setAnnouncement(`${label} başladı: ${formatMinutes(next.remaining / 1000)}.`);
  }

  function pause() {
    const t = Date.now();
    cancelBeeps();
    const next = timerPause(state, t);
    setStored(next);
    setNow(t);
    setAnnouncement(`Duraklatıldı. Kalan ${formatMinutes(next.remaining / 1000)}.`);
  }

  function reset() {
    cancelBeeps();
    restoreTitle();
    setStored(timerReset(state, durationMs));
    setAnnouncement(`Sıfırlandı: ${formatMinutes(seconds)}.`);
  }

  function toggleSound(on: boolean) {
    setSound(on);
    if (!on) cancelBeeps();
    else if (status === "running") armBeeps(timerRemaining(state, Date.now()));
  }

  const progress = state.duration > 0 ? 1 - remainingMs / state.duration : 0;
  const done = status === "done";

  return (
    <div className={`gd-tool-tile p-3.5 transition-colors sm:p-5 ${done ? "gd-tool-done" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <span className="gd-tool-muted block text-xs font-medium">{done ? "Süre doldu" : status === "running" ? "Kalan süre" : status === "paused" ? "Duraklatıldı" : "Zamanlayıcı"}</span>
          <span role="timer" aria-label={label} aria-live="off"
            className="gd-tool-strong block font-heading text-[44px] font-semibold leading-none tabular-nums tracking-[-0.02em] sm:text-[52px]">
            {formatClock(remainingMs / 1000)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === "running" ? (
            <button type="button" onClick={pause} className="gd-tool-primary">
              <Pause className="h-4 w-4" aria-hidden /> Duraklat
            </button>
          ) : (
            <button type="button" onClick={done ? reset : start} disabled={disabled || (!done && remainingMs <= 0)} className="gd-tool-primary">
              {done ? <RotateCcw className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {done ? "Yeniden kur" : status === "paused" ? "Devam et" : "Başlat"}
            </button>
          )}
          {!done && (
            <button type="button" onClick={reset} disabled={idle && !changed} className="gd-tool-btn" aria-label="Zamanlayıcıyı sıfırla">
              <RotateCcw className="h-4 w-4" aria-hidden /> Sıfırla
            </button>
          )}
        </div>
      </div>

      <div className="gd-tool-track mt-4 h-1.5 overflow-hidden rounded-full" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-[width] duration-300 ease-linear" style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} />
      </div>

      {done && (
        <p className="gd-tool-done-text mt-3 flex items-start gap-2 text-[15px] font-medium leading-snug">
          <BellRing className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> <span>{doneText}</span>
        </p>
      )}
      {changed && !done && (
        <p className="gd-tool-muted mt-3 text-[13px] leading-snug">
          Seçimin değişti. Yeni süre ({formatMinutes(seconds)}) için zamanlayıcıyı sıfırla.
        </p>
      )}

      <label className="gd-tool-muted mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[13.5px]">
        <input type="checkbox" checked={sound} onChange={event => toggleSound(event.target.checked)}
          className="h-4 w-4 rounded accent-[#db4c3f]" />
        Bitince sesli uyar
      </label>
      <span className="gd-tool-muted block text-xs leading-snug">Sekme arka planda olsa da süre doğru işler.</span>

      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </div>
  );
}
