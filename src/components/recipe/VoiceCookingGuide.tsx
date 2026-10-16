"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const VOICES = [
  { id: "tr-TR-Chirp3-HD-Enceladus", label: "Enceladus · Varsayılan" },
  { id: "tr-TR-Chirp3-HD-Zephyr", label: "Zephyr" },
  { id: "tr-TR-Chirp3-HD-Aoede", label: "Aoede" },
  { id: "tr-TR-Chirp3-HD-Kore", label: "Kore" },
  { id: "tr-TR-Chirp3-HD-Puck", label: "Puck" },
  { id: "tr-TR-Chirp3-HD-Charon", label: "Charon" },
] as const;

type VoiceStatus = {
  enabled?: boolean;
  plan_remaining?: number;
  plan_limit?: number;
  phase?: string;
};

type AudioResult = { audio_base64?: string; mime_type?: string; message?: string };

export default function VoiceCookingGuide({ recipeId, steps }: { recipeId: number; steps: string[] }) {
  const { user } = useAuth();
  const token = user?.token;
  const [status, setStatus] = useState<VoiceStatus | null>(null);
  const [statusError, setStatusError] = useState("");
  const [index, setIndex] = useState(0);
  const [voice, setVoice] = useState<string>(VOICES[0].id);
  const [playback, setPlayback] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const cacheKey = useRef("");
  const controllerRef = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const stop = useCallback(() => {
    ++generation.current;
    controllerRef.current?.abort();
    controllerRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    cacheKey.current = "";
    setPlayback("idle");
  }, []);

  useEffect(() => () => {
    ++generation.current;
    controllerRef.current?.abort();
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) { setStatus(null); setStatusError(""); return; }
    setStatusError("");
    fetch("/api/voice", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (r) => {
        const result = await r.json();
        if (!r.ok) throw new Error(result.message || "Ses hakkı sorgulanamadı.");
        return result as VoiceStatus;
      })
      .then((result) => { if (!cancelled) setStatus(result); })
      .catch((reason) => { if (!cancelled) setStatusError(reason instanceof Error ? reason.message : "Ses servisine erişilemiyor."); });
    return () => { cancelled = true; };
  }, [token]);

  const selectIndex = (next: number) => {
    if (next < 0 || next >= steps.length || next === index) return;
    stop();
    setIndex(next);
    setError("");
  };

  const selectVoice = (next: string) => {
    stop();
    setVoice(next);
    setError("");
  };

  const play = async () => {
    if (!token || !status?.enabled || !steps[index]) return;
    setError("");
    const key = `${recipeId}:${index}:${voice}`;
    if (audioRef.current && cacheKey.current === key) {
      if (playback === "playing") { audioRef.current.pause(); setPlayback("paused"); return; }
      try {
        if (playback !== "paused") audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setPlayback("playing");
      } catch { setError("Ses oynatılamadı. Tarayıcınızın ses izinlerini kontrol edin."); setPlayback("idle"); }
      return;
    }

    stop();
    const thisGeneration = generation.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    setPlayback("loading");
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ recipe_id: recipeId, step_index: index, voice }),
        signal: controller.signal,
        cache: "no-store",
      });
      const result = await response.json() as AudioResult;
      if (!response.ok) throw new Error(result.message || "Doğal seslendirmenin kotası dolmuş veya servis kapalı olabilir.");
      if (thisGeneration !== generation.current) return;
      if (!result.audio_base64 || result.mime_type !== "audio/mpeg") throw new Error("Ses yanıtı geçersiz.");
      const binary = atob(result.audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      if (thisGeneration !== generation.current) { URL.revokeObjectURL(objectUrl); return; }
      urlRef.current = objectUrl;
      cacheKey.current = key;
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => { if (thisGeneration === generation.current) setPlayback("idle"); };
      audio.onerror = () => { if (thisGeneration === generation.current) { setError("Ses dosyası oynatılamadı."); setPlayback("idle"); } };
      await audio.play();
      if (thisGeneration === generation.current) setPlayback("playing");
    } catch (reason) {
      if (thisGeneration !== generation.current || controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : "Ses başlatılamadı.");
      setPlayback("idle");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  if (steps.length === 0) return null;
  const hasAccess = Boolean(token && status?.enabled);
  return (
    <section aria-label="Sesli pişirme rehberi" className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 md:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tariften Mutfak Rehberi</span>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Doğal sesli pişirme</h3>
          <p className="mt-1 text-sm text-slate-600">Tarif adımlarını Google Chirp 3 HD ile dinle. Sesler sunucuda saklanmaz.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 border border-emerald-100">
          {index + 1} / {steps.length} adım
        </span>
      </div>
      <div className="my-4 rounded-xl bg-white border border-slate-100 p-4 text-slate-700 leading-relaxed">
        {steps[index]}
      </div>
      <label className="block text-xs font-semibold text-slate-600 mb-1" htmlFor="tariften-chirp-voice">Doğal Türkçe ses</label>
      <select id="tariften-chirp-voice" value={voice} onChange={(event) => selectVoice(event.target.value)}
        className="w-full md:w-auto max-w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800">
        {VOICES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => selectIndex(index - 1)} disabled={index === 0}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40">Önceki</button>
        <button type="button" onClick={() => void play()} disabled={!hasAccess || playback === "loading"}
          className="rounded-lg bg-emerald-800 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">
          {playback === "loading" ? "Hazırlanıyor…" : playback === "playing" ? "Duraklat" : playback === "paused" ? "Devam et" : "Adımı dinle"}
        </button>
        <button type="button" onClick={stop} disabled={playback === "idle"}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40">Durdur</button>
        <button type="button" onClick={() => selectIndex(index + 1)} disabled={index >= steps.length - 1}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40">Sonraki</button>
      </div>
      {!token && <p className="mt-3 text-sm text-amber-800">Doğal seslendirme için üye girişi gerekiyor.</p>}
      {token && status && !status.enabled && <p className="mt-3 text-sm text-slate-600">Doğal seslendirme betası henüz açılmadı. Özellik etkinleştirildiğinde burada kullanılabilecek.</p>}
      {status?.enabled && typeof status.plan_remaining === "number" && <p className="mt-3 text-xs text-slate-500">Tarif hakkı: {status.plan_remaining} / {status.plan_limit} · Aylık ortak kota web ve mobilde geçerlidir.</p>}
      {statusError && <p className="mt-3 text-sm text-amber-700" role="status">{statusError}</p>}
      {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    </section>
  );
}
