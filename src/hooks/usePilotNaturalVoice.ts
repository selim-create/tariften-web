"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export const PILOT_CHIRP_VOICES = [
  { id: "tr-TR-Chirp3-HD-Enceladus", label: "Enceladus · Varsayılan" },
  { id: "tr-TR-Chirp3-HD-Zephyr", label: "Zephyr" },
  { id: "tr-TR-Chirp3-HD-Aoede", label: "Aoede" },
  { id: "tr-TR-Chirp3-HD-Kore", label: "Kore" },
  { id: "tr-TR-Chirp3-HD-Puck", label: "Puck" },
  { id: "tr-TR-Chirp3-HD-Charon", label: "Charon" },
] as const;

type CoreVoiceStatus = {
  enabled?: boolean;
  plan_remaining?: number;
  plan_limit?: number;
};

type AudioResult = { audio_base64?: string; mime_type?: string; message?: string };

export function usePilotNaturalVoice(recipeId: number, stepIndex: number, hasStoredSteps: boolean) {
  const { user } = useAuth();
  const token = user?.token;
  const [status, setStatus] = useState<CoreVoiceStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [voice, setVoice] = useState<string>(PILOT_CHIRP_VOICES[0].id);
  const [playback, setPlayback] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const cachedKeyRef = useRef("");
  const abortRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  const stop = useCallback(() => {
    generationRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = null;
    cachedKeyRef.current = "";
    setPlayback("idle");
  }, []);

  useEffect(() => () => {
    generationRef.current++;
    abortRef.current?.abort();
    audioRef.current?.pause();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
  }, []);

  useEffect(() => {
    stop();
    setError("");
  }, [recipeId, stepIndex, voice, stop]);

  useEffect(() => {
    let alive = true;
    if (!token || !hasStoredSteps) {
      setStatus(null);
      setChecking(false);
      return () => { alive = false; };
    }
    setChecking(true);
    fetch("/api/voice", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.message || "Ses servisine erişilemedi.");
        return body as CoreVoiceStatus;
      })
      .then((body) => {
        if (alive) setStatus(body);
      })
      .catch((reason) => {
        if (alive) {
          setStatus(null);
          setError(reason instanceof Error ? reason.message : "Ses durumu alınamadı.");
        }
      })
      .finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [token, hasStoredSteps]);

  const play = useCallback(async () => {
    if (!token) { setError("Doğal sesi dinlemek için üye girişi yapın."); return; }
    if (!hasStoredSteps) { setError("Bu tarifte kayıtlı seslendirilebilir adım bulunmuyor."); return; }
    if (!status?.enabled) { setError("Doğal seslendirme bu hesap için etkin değil."); return; }

    const key = `${recipeId}:${stepIndex}:${voice}`;
    setError("");
    if (audioRef.current && cachedKeyRef.current === key) {
      try {
        if (audioRef.current.ended) audioRef.current.currentTime = 0;
        await audioRef.current.play();
        setPlayback("playing");
      } catch {
        setPlayback("paused");
        setError("Ses hazır. Tarayıcı otomatik oynatmayı engellediyse Oku'ya tekrar basın.");
      }
      return;
    }

    stop();
    const generation = generationRef.current;
    const abort = new AbortController();
    abortRef.current = abort;
    setPlayback("loading");
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipe_id: recipeId, step_index: stepIndex, voice }),
        cache: "no-store",
        signal: abort.signal,
      });
      const body = await response.json() as AudioResult;
      if (!response.ok) throw new Error(body.message || "Doğal seslendirme isteği başarısız oldu.");
      if (generation !== generationRef.current) return;
      if (body.mime_type !== "audio/mpeg" || !body.audio_base64
          || body.audio_base64.length > 1_900_000 || !/^[A-Za-z0-9+/=]+$/.test(body.audio_base64)) {
        throw new Error("Ses yanıtı doğrulanamadı.");
      }
      const binary = atob(body.audio_base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const objectUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
      if (generation !== generationRef.current) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      blobUrlRef.current = objectUrl;
      cachedKeyRef.current = key;
      const audio = new Audio(objectUrl);
      audioRef.current = audio;
      audio.onended = () => { if (generation === generationRef.current) setPlayback("idle"); };
      audio.onerror = () => {
        if (generation === generationRef.current) {
          setPlayback("idle");
          setError("Ses dosyası oynatılamadı.");
        }
      };
      try {
        await audio.play();
        if (generation === generationRef.current) setPlayback("playing");
      } catch {
        if (generation === generationRef.current) {
          setPlayback("paused");
          setError("Ses hazır. Tarayıcı otomatik oynatmayı engellediyse Oku'ya tekrar basın.");
        }
      }
    } catch (reason) {
      if (generation !== generationRef.current || abort.signal.aborted) return;
      setPlayback("idle");
      setError(reason instanceof Error ? reason.message : "Doğal ses servisine ulaşılamadı.");
    } finally {
      if (abortRef.current === abort) abortRef.current = null;
    }
  }, [token, hasStoredSteps, status?.enabled, recipeId, stepIndex, voice, stop]);

  const pause = useCallback(() => {
    if (playback === "playing" && audioRef.current) {
      audioRef.current.pause();
      setPlayback("paused");
    }
  }, [playback]);

  return {
    token,
    enabled: Boolean(token && hasStoredSteps && status?.enabled),
    checking,
    voice,
    setVoice,
    playback,
    error,
    status,
    stop,
    play,
    pause,
  };
}
