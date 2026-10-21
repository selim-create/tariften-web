"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, ChevronLeft, ChevronRight, CircleHelp, CookingPot, Droplets, Flame,
  LifeBuoy, Mic, MicOff, Pause, Play, Soup, Square, Timer, Volume2, X,
} from "lucide-react";
import { PILOT_CHIRP_VOICES, usePilotNaturalVoice } from "@/hooks/usePilotNaturalVoice";
import { normalizePilotCommand, parsePilotCommand } from "@/lib/pilotVoiceCommands";
import { durationsInStep, ingredientsInStep } from "@/lib/pilot-step-helpers";
import { parseIngredients } from "@/lib/recipeUtils";
import { capitalizeIngredientTr, formatIngredientAmount } from "@/lib/ingredient-display";
import { checkInteractionStatus, toggleInteraction } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import LokmaIngredientIcon from "@/components/lokma/LokmaIngredientIcon";

// --- TİP TANIMLARI ---
interface Recipe {
  id: number;
  title: string;
  [key: string]: any;
}

// --- TİP TANIMLARI (Ses API) ---
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PilotClientProps {
  recipe: Recipe;
  steps: string[];
  hasStoredSteps: boolean;
}

// Shared control styles. Class names deliberately avoid "bg-white" so the
// site-wide dark-theme overrides do not repaint the guide's translucent panels.
const ghost = "inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-4 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-40";
const iconBtn = "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-800 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const panel = "rounded-3xl border border-slate-800 bg-slate-900";
const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.16em]";

function Dialog({ labelledBy, onClose, children, wide = false }: { labelledBy: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div role="presentation" className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className={`w-full ${wide ? "max-w-md" : "max-w-sm"} overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]`}>
        {children}
      </section>
    </div>
  );
}

function DialogHeader({ id, kicker, title, onClose, closeLabel }: { id: string; kicker: string; title: string; onClose: () => void; closeLabel: string }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <p className={`${eyebrow} text-brand`}>{kicker}</p>
        <h2 id={id} className="mt-1 font-heading text-xl font-semibold text-slate-50">{title}</h2>
      </div>
      <button type="button" aria-label={closeLabel} onClick={onClose} className={iconBtn}><X className="h-5 w-5" /></button>
    </div>
  );
}

export default function PilotClient({ recipe, steps, hasStoredSteps }: PilotClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const naturalVoice = usePilotNaturalVoice(recipe.id, currentStep, hasStoredSteps);
  const [useDeviceVoice, setUseDeviceVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const wantListeningRef = useRef(false);
  const retryMicRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommandAtRef = useRef(0);
  const lastCommandTextRef = useRef("");
  const recognitionRetryMsRef = useRef(350);
  const [lastCommand, setLastCommand] = useState("");
  
  // Zamanlayıcı State'i
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false); // YENİ: Duraklatma state'i
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);

  // Modallar
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFinishedOpen, setIsFinishedOpen] = useState(false); // YENİ: Bitiş modalı
  const [sosMessage, setSosMessage] = useState<string | null>(null);

  // Ses API Referansları
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // İlerleme yüzdesi
  const progress = ((currentStep + 1) / steps.length) * 100;

  // --- TTS: SES AYARLARI (DAHA İNSANSI) ---
  const getBestVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    
    // 1. Öncelik: Google Türkçe (Daha doğal)
    let selectedVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("tr"));
    
    // 2. Öncelik: Herhangi bir Türkçe ses
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes("tr"));

    return selectedVoice || null;
  }, []);

  // Sesleri yükle
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => {
             // Sesler yüklendiğinde tetiklenir
        };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!useDeviceVoice) {
      if (text === steps[currentStep]) {
        void naturalVoice.play();
      } else {
        // Core authorizes recorded recipe steps only, never dynamic command text.
        setVoiceFeedback(text);
      }
      return;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voice = getBestVoice();
      if (voice) utterance.voice = voice;

      utterance.lang = 'tr-TR';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [getBestVoice, useDeviceVoice, naturalVoice.play, steps, currentStep]);

  useEffect(() => {
    window.speechSynthesis?.cancel();
  }, [currentStep, useDeviceVoice, naturalVoice.voice]);

  // --- ALARM SESİ (WEB AUDIO API - SOFT CHIME) ---
  const playAlarm = useCallback(() => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Osilatör oluştur
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Frekans ayarları
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(261.63, ctx.currentTime + 1.5);

    // Ses seviyesi
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.start();
    osc.stop(ctx.currentTime + 1.6);
  }, []);

  // Alarm Döngüsü
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAlarmPlaying) {
        playAlarm(); // İlk çalma
        interval = setInterval(playAlarm, 2000); // 2 saniyede bir tekrar et
    }
    return () => clearInterval(interval);
  }, [isAlarmPlaying, playAlarm]);


  // --- ZAMANLAYICI MANTIĞI ---
  const startTimer = useCallback((minutes: number) => {
    // Two light metronome ticks; only a user action can unlock Web Audio.
    try {
      const ctx = audioContextRef.current || new window.AudioContext();
      audioContextRef.current = ctx;
      void ctx.resume();
      for (const offset of [0, 0.16]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine"; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.065, ctx.currentTime + offset + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.09);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.095);
      }
    } catch { /* sound is optional; timer always starts */ }
    setTimeLeft(minutes * 60);
    setTimerActive(true);
    setIsTimerPaused(false);
    setIsAlarmPlaying(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !isTimerPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setIsTimerPaused(false);
      setIsAlarmPlaying(true);
    }
    return () => clearInterval(interval);
  }, [timerActive, isTimerPaused, timeLeft]);


  // Recognition and dispatch are separate: a displayed transcript must
  // correspond to an executed command, not merely matching random words.
  const handleCommand = useCallback((spoken: string) => {
    const command = parsePilotCommand(spoken);
    if (!command) return;
    const normalized = normalizePilotCommand(spoken);
    setLastCommand(normalized);
    switch (command.type) {
      case "next":
        if (currentStep < steps.length - 1) {
          naturalVoice.stop();
          setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
          setVoiceFeedback("Sonraki adıma geçildi.");
        } else {
          setIsFinishedOpen(true);
          setVoiceFeedback("Tarif tamamlandı.");
        }
        return;
      case "previous":
        if (currentStep > 0) {
          naturalVoice.stop();
          setCurrentStep((prev) => Math.max(0, prev - 1));
          setVoiceFeedback("Önceki adıma geçildi.");
        } else {
          setVoiceFeedback("Zaten ilk adımdasın.");
        }
        return;
      case "read":
        speak(steps[currentStep]);
        return;
      case "pause_audio":
        naturalVoice.pause();
        if (useDeviceVoice) window.speechSynthesis?.pause();
        setVoiceFeedback("Okuma duraklatıldı.");
        return;
      case "pause_context":
        if (timerActive) {
          setIsTimerPaused(true);
          setVoiceFeedback("Sayaç duraklatıldı.");
        } else {
          naturalVoice.pause();
          if (useDeviceVoice) window.speechSynthesis?.pause();
          setVoiceFeedback("Okuma duraklatıldı.");
        }
        return;
      case "resume_audio":
        // Explicit "Okumayı sürdür" should never change a kitchen timer.
        if (useDeviceVoice) window.speechSynthesis?.resume();
        else void naturalVoice.play();
        setVoiceFeedback("Sesli okumaya devam ediliyor.");
        return;
      case "resume_context":
        // Bare "Sürdür / Devam / Kaldığın yerden devam et" belongs
        // to the currently active timer before any audio/navigation.
        if (timerActive) {
          if (isTimerPaused) {
            setIsTimerPaused(false);
            setVoiceFeedback("Sayaç kaldığı yerden devam ediyor.");
          } else setVoiceFeedback("Sayaç zaten çalışıyor.");
        } else if ((useDeviceVoice && window.speechSynthesis?.paused)
                    || (!useDeviceVoice && naturalVoice.playback === "paused")) {
          if (useDeviceVoice) window.speechSynthesis?.resume();
          else void naturalVoice.play();
          setVoiceFeedback("Sesli okumaya devam ediliyor.");
        } else if (currentStep < steps.length - 1) {
          naturalVoice.stop();
          setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
          setVoiceFeedback("Sonraki adıma geçildi.");
        } else {
          setIsFinishedOpen(true);
        }
        return;
      case "stop_audio":
        naturalVoice.stop();
        window.speechSynthesis?.cancel();
        setVoiceFeedback("Ses durduruldu.");
        return;
      case "pause_timer":
        if (!timerActive) setVoiceFeedback("Şu anda çalışan sayaç bulunmuyor.");
        else if (!isTimerPaused) {
          setIsTimerPaused(true);
          setVoiceFeedback("Sayaç duraklatıldı.");
        } else setVoiceFeedback("Sayaç zaten duraklatıldı.");
        return;
      case "resume_timer":
        if (timerActive && isTimerPaused) {
          setIsTimerPaused(false);
          setVoiceFeedback("Sayaç devam ediyor.");
        } else {
          setVoiceFeedback(timerActive ? "Sayaç zaten çalışıyor." : "Devam ettirilecek sayaç bulunmuyor.");
        }
        return;
      case "cancel_context":
        if (!timerActive) {
          naturalVoice.stop();
          window.speechSynthesis?.cancel();
          setVoiceFeedback("Okuma durduruldu.");
          return;
        }
        // A timer is in progress; a generic "iptal" targets the timer.
      case "cancel_timer":
        setTimerActive(false);
        setTimeLeft(0);
        setIsTimerPaused(false);
        setIsAlarmPlaying(false);
        setVoiceFeedback("Sayaç iptal edildi.");
        return;
      case "step_status":
        setVoiceFeedback("Şu anda " + (currentStep + 1) + ". adımdasın · Toplam " + steps.length + " adım.");
        return;
      case "mute_mic":
        wantListeningRef.current = false;
        if (retryMicRef.current) clearTimeout(retryMicRef.current);
        try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
        setIsListening(false);
        setVoiceFeedback("Mikrofon kapatıldı. Yeniden açmak için simgeye dokun.");
        return;
      case "start_timer":
        startTimer(command.minutes);
        setVoiceFeedback(command.minutes + " dakikalık sayaç başlatıldı.");
        return;
      case "stop_alarm":
        if (isAlarmPlaying) {
          setIsAlarmPlaying(false);
          setVoiceFeedback("Alarm susturuldu.");
        }
        return;
      case "help":
        setIsVoiceModalOpen(false);
        setIsSOSOpen(false);
        setIsHelpOpen(true);
        setVoiceFeedback("Sesli komut yardımı açıldı.");
        return;
      case "close_modal":
        setIsHelpOpen(false);
        setIsSOSOpen(false);
        setIsVoiceModalOpen(false);
        setVoiceFeedback("Pencere kapatıldı.");
        return;
    }
  }, [currentStep, steps, naturalVoice, speak, timerActive, isTimerPaused, isAlarmPlaying,
      useDeviceVoice, startTimer]);

  // Browsers must still enforce their own microphone/recognition permission.
  // Start hands-free recognition on entering the pilot, with a visible recovery
  // button if the browser requires a direct user gesture. No audio is saved.
  const handleCommandRef = useRef(handleCommand);
  useEffect(() => { handleCommandRef.current = handleCommand; }, [handleCommand]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMicSupported(false);
      setMicError("Tarayıcın Türkçe sesli komutları desteklemiyor. Chrome kullanabilir veya düğmelerle devam edebilirsin.");
      return;
    }
    const recognizer = new Recognition();
    recognizer.lang = "tr-TR";
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognitionRef.current = recognizer;
    wantListeningRef.current = true;
    let active = false;
    const attempt = () => {
      if (!wantListeningRef.current || document.visibilityState !== "visible" || active) return;
      try { recognizer.start(); } catch {
        setMicError("Mikrofon otomatik başlatılamadı. Mikrofon düğmesine dokunarak açabilirsin.");
      }
    };
    recognizer.onstart = () => {
      active = true;
      recognitionRetryMsRef.current = 350;
      setIsListening(true);
      setMicError("");
    };
    recognizer.onresult = (event: any) => {
      if (!wantListeningRef.current || !event.results) return;
      const results = event.results;
      const first = typeof event.resultIndex === "number"
        ? Math.max(0, event.resultIndex) : Math.max(0, results.length - 1);
      for (let index = first; index < results.length; index++) {
        const entry = results[index];
        if (entry?.isFinal === false) continue;
        const raw = entry?.[0]?.transcript;
        if (typeof raw !== "string" || !parsePilotCommand(raw)) continue;
        const normalized = normalizePilotCommand(raw);
        const now = Date.now();
        // Deduplicate only the *same* final transcript; do not ignore distinct
        // commands delivered close together.
        if (normalized === lastCommandTextRef.current && now - lastCommandAtRef.current < 650) continue;
        lastCommandTextRef.current = normalized;
        lastCommandAtRef.current = now;
        handleCommandRef.current(normalized);
      }
    };
    recognizer.onerror = (event: any) => {
      const code = event.error || "unknown";
      if (code === "no-speech" || code === "aborted") return;
      if (code === "network") recognitionRetryMsRef.current = 2400;
      const messages: Record<string, string> = {
        "not-allowed": "Mikrofon izni gerekli. Site izinlerinden mikrofonu aç, sonra tekrar dene.",
        "service-not-allowed": "Tarayıcının konuşma tanıma servisine izin vermesi gerekiyor.",
        "audio-capture": "Mikrofon bulunamadı veya başka bir uygulamada kullanılıyor.",
        "network": "Ses tanıma ağına erişilemiyor.",
        "language-not-supported": "Bu tarayıcı Türkçe komut tanımayı desteklemiyor.",
      };
      setMicError(messages[code] || "Sesli komut servisi yanıt vermedi. Mikrofonu yeniden başlatabilirsin.");
      if (["not-allowed","service-not-allowed","audio-capture","language-not-supported"].includes(code)) {
        wantListeningRef.current = false;
        setIsListening(false);
      }
    };
    recognizer.onend = () => {
      active = false;
      setIsListening(false);
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      if (wantListeningRef.current && document.visibilityState === "visible") {
        retryMicRef.current = setTimeout(attempt, recognitionRetryMsRef.current);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        try { recognizer.stop(); } catch { /* already stopped */ }
      } else if (wantListeningRef.current) {
        retryMicRef.current = setTimeout(attempt, 350);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const initial = setTimeout(attempt, 350);
    return () => {
      clearTimeout(initial);
      document.removeEventListener("visibilitychange", onVisibility);
      wantListeningRef.current = false;
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      recognizer.onend = null;
      recognizer.onresult = null;
      recognizer.onerror = null;
      try { recognizer.abort(); } catch { /* no running session */ }
      recognitionRef.current = null;
    };
  }, []);

  const toggleListening = () => {
    if (!micSupported || !recognitionRef.current) {
      setMicError("Bu tarayıcıda sesli komut kullanılamıyor. Düğmelerle devam edebilirsin.");
      return;
    }
    if (wantListeningRef.current) {
      wantListeningRef.current = false;
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      setIsListening(false);
      setMicError("");
    } else {
      wantListeningRef.current = true;
      setMicError("");
      try { recognitionRef.current.start(); } catch {
        setMicError("Mikrofon yeniden başlatılamadı. Tarayıcı izinlerini kontrol et.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSOSAction = (problem: string) => {
    // Static safety guidance, not a simulated AI service.
    const responses: Record<string, string> = {
      burnt: "Önce ocağı kapat. Yanmamış kısmı dibi kazımadan temiz bir kaba aktar; yanık kokusu veya tadı belirginse servis etme.",
      salty: "Tarif uygunsa tuzsuz malzeme veya sıvıyla seyrelterek tadı tekrar kontrol et. Patates, tuzu seçici biçimde emmez.",
      watery: "Yemeğe uygunsa kapağı açık ve kontrollü şekilde bir süre daha pişir; her yemek için yüksek ateş uygun değildir.",
      other: "Eksik malzeme alternatiflerinde alerjenleri ve tarifin yapısını kontrol et. Her tarifte aynı değişim işe yaramaz.",
    };
    setSosMessage(responses[problem] || "Bu durum için hazır bir mutfak önerisi bulunmuyor.");
  };

  // --- Malzemeler ve adım yardımcıları (yalnızca tarifin kendi metni) ---
  const { user } = useAuth();
  const recipeHref = `/recipe/${recipe.slug || recipe.id}`;
  const ingredients = useMemo(() => parseIngredients(recipe.ingredients), [recipe.ingredients]);
  const stepText = steps[currentStep] || "";
  const stepIngredients = useMemo(
    () => new Set(ingredientsInStep(ingredients.map(item => item.name), stepText)),
    [ingredients, stepText],
  );
  const stepDurations = useMemo(() => durationsInStep(stepText).slice(0, 2), [stepText]);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);
  const toggleIngredient = (index: number) =>
    setCheckedIngredients(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  const ingredientLabel = (index: number) => {
    const item = ingredients[index];
    const raw = capitalizeIngredientTr(String(item.name || ""));
    const match = raw.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
    return {
      amount: formatIngredientAmount(item.amount, item.unit, 1, 1),
      name: match ? match[1] : raw,
      qualifier: match ? match[2] : "",
    };
  };

  const [cookedState, setCookedState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const markCooked = async () => {
    if (!user?.token || cookedState === "saving" || cookedState === "saved") return;
    setCookedState("saving");
    try {
      // The endpoint toggles; never un-mark a recipe that was already cooked.
      const status = await checkInteractionStatus(user.token, recipe.id);
      if (!status.cooked) await toggleInteraction(user.token, recipe.id, "cooked");
      setCookedState("saved");
    } catch {
      setCookedState("error");
    }
  };

  const startTimerFromButton = (event: React.MouseEvent<HTMLButtonElement>) => {
    const minutes = Number(event.currentTarget.dataset.minutes);
    if (Number.isFinite(minutes) && minutes > 0) startTimer(minutes);
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else setIsFinishedOpen(true);
  };
  const voiceName = useDeviceVoice
    ? "Cihaz sesi"
    : PILOT_CHIRP_VOICES.find(v => v.id === naturalVoice.voice)?.label.split(" · ")[0] || "Doğal ses";

  return (
    <div className="fixed inset-0 z-[100] isolate flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-950 font-sans text-slate-100">
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-slate-800 px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={recipeHref} aria-label="Tarife dön" className={iconBtn}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className={`${eyebrow} text-brand`}>Pişirme rehberi</p>
            <h1 className="truncate font-heading text-[15px] font-semibold text-slate-50 sm:text-base">{recipe.title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setIsVoiceModalOpen(true)} aria-label="Ses seçimini değiştir" className={iconBtn}>
            <Volume2 className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => setIsHelpOpen(true)} aria-label="Sesli komutlar ve yardım" className={iconBtn}>
            <CircleHelp className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6 lg:py-6">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6">
          <section aria-label="Geçerli tarif adımı" className={`${panel} flex flex-col self-start p-5 sm:p-8`}>
            <p className="text-sm text-slate-400 tabular-nums">
              <span className="font-semibold text-slate-100">Adım {currentStep + 1}</span> / {steps.length}
            </p>

            {/* Top-aligned so the voice and timer controls stay above the dock on laptop screens. */}
            <div className="mb-7 mt-5 flex flex-col">
              {timerActive ? (
                <div role="timer" aria-live="off" className="flex flex-col items-start gap-3">
                  <p className={`${eyebrow} text-slate-400`}>{isTimerPaused ? "Sayaç duraklatıldı" : "Sayaç çalışıyor"}</p>
                  <div className="font-heading text-[clamp(3.5rem,9vw,6.5rem)] font-semibold leading-none tracking-[-0.04em] text-slate-50 tabular-nums">{formatTime(timeLeft)}</div>
                  <p className="max-w-xl text-[15px] leading-relaxed text-slate-400">{steps[currentStep]}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setIsTimerPaused(!isTimerPaused)} className={ghost}>
                      {isTimerPaused ? <><Play className="h-4 w-4" /> Sayacı sürdür</> : <><Pause className="h-4 w-4" /> Sayacı duraklat</>}
                    </button>
                    <button type="button" onClick={() => { setTimerActive(false); setIsTimerPaused(false); setTimeLeft(0); }} className={ghost}>
                      <X className="h-4 w-4" /> İptal et
                    </button>
                  </div>
                </div>
              ) : (
                <h2 key={currentStep} aria-live="polite"
                  className="max-w-3xl text-pretty font-heading text-[clamp(1.35rem,2.4vw,2.2rem)] font-medium leading-[1.45] tracking-[-0.015em] text-slate-50">
                  {steps[currentStep]}
                </h2>
              )}

              {!timerActive && stepIngredients.size > 0 && (
                <div className="mt-7">
                  <p className={`${eyebrow} mb-2.5 text-slate-500`}>Bu adımda</p>
                  <ul className="flex flex-wrap gap-2">
                    {[...stepIngredients].map(index => {
                      const { amount, name } = ingredientLabel(index);
                      return (
                        <li key={index} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 py-1 pl-1 pr-3.5 text-sm text-slate-200">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f6efe8]"><LokmaIngredientIcon name={ingredients[index].name} size="sm" /></span>
                          <span>{amount && <span className="font-semibold text-slate-50 tabular-nums">{amount} </span>}{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {naturalVoice.error && !useDeviceVoice && (
                <p role="alert" className="mt-6 max-w-lg rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{naturalVoice.error}</p>
              )}
              {voiceFeedback && !useDeviceVoice && (
                <p role="status" className="mt-5 text-sm text-slate-400">{voiceFeedback}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => speak(steps[currentStep])}
                disabled={!useDeviceVoice && (!naturalVoice.enabled || naturalVoice.playback === "loading")}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50">
                <Volume2 className="h-4 w-4" /> {naturalVoice.playback === "loading" && !useDeviceVoice ? "Ses hazırlanıyor…" : "Adımı seslendir"}
              </button>
              {!useDeviceVoice && naturalVoice.playback === "playing" && (
                <button type="button" onClick={naturalVoice.pause} className={ghost}><Pause className="h-4 w-4" /> Duraklat</button>
              )}
              {!useDeviceVoice && naturalVoice.playback === "paused" && (
                <button type="button" onClick={() => void naturalVoice.play()} className={ghost}><Play className="h-4 w-4" /> Devam et</button>
              )}
              {!useDeviceVoice && naturalVoice.playback !== "idle" && (
                <button type="button" onClick={naturalVoice.stop} className={ghost}><Square className="h-3.5 w-3.5" /> Durdur</button>
              )}
              {!timerActive && stepDurations.map(minutes => (
                <button key={minutes} type="button" data-minutes={minutes} onClick={startTimerFromButton} className={ghost}>
                  <Timer className="h-4 w-4" /> {minutes} dk sayaç
                </button>
              ))}
            </div>
          </section>

          <aside className="grid content-start gap-4">
            {ingredients.length > 0 && (
              <section aria-labelledby="pilot-ingredients" className={`${panel} p-5`}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 id="pilot-ingredients" className="font-heading text-base font-semibold text-slate-50">Malzemeler</h2>
                  <span className="text-xs text-slate-500 tabular-nums">{checkedIngredients.length}/{ingredients.length} hazır</span>
                </div>
                <ul className="divide-y divide-slate-800">
                  {ingredients.map((item, index) => {
                    const { amount, name, qualifier } = ingredientLabel(index);
                    const done = checkedIngredients.includes(index);
                    const now = stepIngredients.has(index);
                    return (
                      <li key={index}>
                        <button type="button" role="checkbox" aria-checked={done} onClick={() => toggleIngredient(index)}
                          className="flex w-full items-center gap-3 py-2.5 text-left">
                          <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${done ? "border-brand bg-brand text-white" : "border-slate-600"}`}>
                            {done && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className={`min-w-0 flex-1 text-sm leading-snug ${done ? "text-slate-500 line-through decoration-slate-600" : now ? "text-slate-50" : "text-slate-300"}`}>
                            {amount && <span className={`font-semibold tabular-nums ${done ? "" : "text-[#f08a7f]"}`}>{amount} </span>}{name}
                            {qualifier && <span className="mt-0.5 block text-xs text-slate-500">{qualifier}</span>}
                          </span>
                          {now && !done && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" title="Bu adımda"><span className="sr-only">Bu adımda</span></span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section aria-labelledby="pilot-hands-free" className={`${panel} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="pilot-hands-free" className="font-heading text-base font-semibold text-slate-50">Eller serbest</h2>
                  <p className="mt-0.5 text-xs text-slate-400">{isListening ? "Mikrofon dinliyor" : "Mikrofon kapalı"} · {voiceName}</p>
                </div>
                <button type="button" onClick={toggleListening} disabled={!micSupported} aria-pressed={isListening}
                  aria-label={isListening ? "Mikrofonu kapat" : "Mikrofonu aç"}
                  className={`grid h-10 w-10 place-items-center rounded-xl transition disabled:opacity-40 ${isListening ? "bg-emerald-500/15 text-emerald-300" : "border border-slate-700 text-slate-300"}`}>
                  {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">“Sonraki”, “Önceki”, “Oku”, “10 dakika başlat” deyebilirsin.</p>
              {lastCommand && <p className="mt-1 break-words text-xs text-emerald-300">Algılandı: {lastCommand}</p>}
              {micError && <p role="alert" className="mt-1 text-xs leading-5 text-red-200">{micError}</p>}
            </section>

            <section className={`${panel} flex flex-wrap items-center gap-2 p-3`}>
              {timerActive ? (
                <button type="button" onClick={() => setIsTimerPaused(!isTimerPaused)} className={`${ghost} flex-1 justify-center tabular-nums`}>
                  <Timer className="h-4 w-4" /> {formatTime(timeLeft)}
                </button>
              ) : (
                [5, 10, 15].map(minutes => (
                  <button key={minutes} type="button" data-minutes={minutes} onClick={startTimerFromButton} aria-label={`${minutes} dakikalık sayaç başlat`}
                    className={`${ghost} flex-1 justify-center px-2`}>
                    {minutes} dk
                  </button>
                ))
              )}
              <button type="button" aria-label="Mutfak ipuçları" title="Mutfak ipuçları" onClick={() => setIsSOSOpen(true)} className={`${iconBtn} h-11 w-11`}>
                <LifeBuoy className="h-5 w-5" />
              </button>
            </section>
          </aside>
        </div>
      </main>

      <footer className="relative z-20 shrink-0 border-t border-slate-800 bg-slate-950 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div role="progressbar" aria-label="Tarif ilerlemesi" aria-valuenow={currentStep + 1} aria-valuemin={0} aria-valuemax={steps.length}
            className="mb-3 h-1 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <button type="button" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0} className={`${ghost} justify-center`}>
              <ChevronLeft className="h-4 w-4" /> Önceki
            </button>
            <button type="button" onClick={toggleListening} disabled={!micSupported}
              aria-label={isListening ? "Mikrofonu kapat" : "Sesli komutlar için mikrofonu aç"} aria-pressed={isListening}
              className={`relative grid h-11 w-11 place-items-center rounded-xl transition disabled:opacity-40 ${isListening ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40" : "border border-slate-700 text-slate-300"}`}>
              {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button type="button" onClick={goNext}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              {currentStep === steps.length - 1 ? <>Bitir <Check className="h-4 w-4" /></> : <>Sonraki <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </footer>

      {isVoiceModalOpen && (
        <Dialog labelledBy="pilot-voice-heading" onClose={() => setIsVoiceModalOpen(false)} wide>
          <DialogHeader id="pilot-voice-heading" kicker="Seslendirme" title="Ses seç" onClose={() => setIsVoiceModalOpen(false)} closeLabel="Ses seçimini kapat" />
          <p className="mb-3 text-xs leading-5 text-slate-400">Doğal ses, bir adımı seslendirdiğinde oluşturulur. Cihaz sesi çevrimdışı çalışır.</p>
          <div className="max-h-[min(58dvh,430px)] space-y-2 overflow-y-auto pr-1">
            {PILOT_CHIRP_VOICES.map((item) => {
              const selected = !useDeviceVoice && naturalVoice.voice === item.id;
              return (
                <button key={item.id} type="button" aria-pressed={selected} onClick={() => {
                  naturalVoice.stop();
                  window.speechSynthesis?.cancel();
                  setUseDeviceVoice(false);
                  naturalVoice.setVoice(item.id);
                  setVoiceFeedback("");
                  setIsVoiceModalOpen(false);
                }} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm transition ${selected ? "border-brand bg-brand/15 text-slate-50" : "border-slate-800 text-slate-200 hover:bg-slate-800"}`}>
                  <span>{item.label}</span>
                  {selected ? <Check className="h-4 w-4 text-brand" /> : <span className="text-[11px] text-slate-500">Doğal ses</span>}
                </button>
              );
            })}
            <button type="button" aria-pressed={useDeviceVoice} onClick={() => {
              naturalVoice.stop();
              setUseDeviceVoice(true);
              setVoiceFeedback("");
              setIsVoiceModalOpen(false);
            }} className={`flex min-h-12 w-full items-center justify-between rounded-xl border px-4 text-left text-sm transition ${useDeviceVoice ? "border-brand bg-brand/15 text-slate-50" : "border-slate-800 text-slate-200 hover:bg-slate-800"}`}>
              <span>Cihaz sesi</span>
              {useDeviceVoice ? <Check className="h-4 w-4 text-brand" /> : <span className="text-[11px] text-slate-500">Çevrimdışı</span>}
            </button>
          </div>
        </Dialog>
      )}

      {isSOSOpen && (
        <Dialog labelledBy="pilot-sos-heading" onClose={() => { setIsSOSOpen(false); setSosMessage(null); }} wide>
          <DialogHeader id="pilot-sos-heading" kicker="Bir şey ters mi gitti?" title="Mutfak ipuçları"
            onClose={() => { setIsSOSOpen(false); setSosMessage(null); }} closeLabel="Mutfak ipuçlarını kapat" />
          {!sosMessage ? (
            <div className="grid grid-cols-2 gap-2">
              {([
                ["burnt", "Yemek yandı", Flame],
                ["watery", "Çok sulandı", Droplets],
                ["salty", "Tuz / baharat fazla", Soup],
                ["other", "Eksik malzeme", CircleHelp],
              ] as const).map(([key, label, Icon]) => (
                <button key={key} type="button" onClick={() => handleSOSAction(key)}
                  className="flex min-h-[84px] flex-col items-start justify-between rounded-2xl border border-slate-800 p-4 text-left transition hover:border-slate-700 hover:bg-slate-800">
                  <Icon className="h-5 w-5 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-100">{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-[15px] leading-relaxed text-slate-200">{sosMessage}</p>
              <p className="mt-3 text-xs text-slate-500">Genel mutfak önerisidir; bu tarife özel değildir.</p>
              <button type="button" onClick={() => setSosMessage(null)} className={`${ghost} mt-5`}><ArrowLeft className="h-4 w-4" /> Diğer durumlar</button>
            </div>
          )}
        </Dialog>
      )}

      {isHelpOpen && (
        <Dialog labelledBy="pilot-help-heading" onClose={() => setIsHelpOpen(false)} wide>
          <DialogHeader id="pilot-help-heading" kicker="Eller serbest" title="Sesli komutlar" onClose={() => setIsHelpOpen(false)} closeLabel="Yardımı kapat" />
          <div className="max-h-[min(62dvh,480px)] space-y-5 overflow-y-auto pr-1">
            {([
              ["Adımlar", [["“Sonraki” · “İleri”", "Sonraki adım"], ["“Önceki” · “Geri”", "Önceki adım"], ["“Oku” · “Anlat”", "Adımı seslendir"], ["“Kaçıncı adımdayım?”", "Adım durumu"]]],
              ["Sayaç", [["“5 dakika başlat”", "Sayaç kur"], ["“Sayacı duraklat”", "Duraklat"], ["“Sürdür” · “Devam et”", "Sayacı ya da okumayı sürdür"], ["“İptal et”", "Sayacı sıfırla"], ["“Tamam” · “Sus”", "Alarmı sustur"]]],
              ["Genel", [["“Kapat”", "Pencereyi kapat"], ["“Mikrofonu kapat”", "Dinlemeyi durdur"]]],
            ] as const).map(([group, rows]) => (
              <div key={group}>
                <p className={`${eyebrow} mb-2 text-slate-500`}>{group}</p>
                <dl className="divide-y divide-slate-800 rounded-2xl border border-slate-800">
                  {rows.map(([phrase, action]) => (
                    <div key={phrase} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                      <dt className="text-slate-300">{phrase}</dt>
                      <dd className="text-right font-medium text-slate-50">{action}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Dialog>
      )}

      {isAlarmPlaying && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="pilot-alarm-heading"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/95 p-4">
          <div className="text-center">
            <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-brand text-white">
              <Timer className="h-9 w-9" />
            </div>
            <h2 id="pilot-alarm-heading" className="font-heading text-4xl font-semibold text-slate-50">Süre doldu</h2>
            <p className="mt-2 text-slate-400">Ocağı kontrol et.</p>
            <button type="button" onClick={() => setIsAlarmPlaying(false)}
              className="mx-auto mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand px-6 font-semibold text-white transition hover:bg-brand-dark">
              Alarmı sustur
            </button>
            <p className="mt-4 text-sm text-slate-500">“Tamam” ya da “Sus” diyerek de susturabilirsin.</p>
          </div>
        </div>
      )}

      {isFinishedOpen && (
        <Dialog labelledBy="pilot-finish-heading" onClose={() => setIsFinishedOpen(false)}>
          <div className="text-center">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-brand/15 text-brand">
              <CookingPot className="h-7 w-7" />
            </div>
            <h2 id="pilot-finish-heading" className="font-heading text-2xl font-semibold text-slate-50">Tarif tamamlandı</h2>
            <p className="mt-2 text-sm text-slate-400">Ellerine sağlık. İstersen pişirdiğin tarifler arasına ekle.</p>
            <div className="mt-7 flex flex-col gap-2">
              <button type="button" onClick={markCooked} disabled={cookedState === "saving" || cookedState === "saved"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-dark disabled:cursor-default disabled:opacity-90">
                {cookedState === "saved" ? <><Check className="h-4 w-4" /> Pişirdiklerine eklendi</>
                  : cookedState === "saving" ? "Kaydediliyor…" : "Pişirdim olarak işaretle"}
              </button>
              {cookedState === "error" && <p role="alert" className="text-xs text-red-200">Kaydedilemedi, tekrar dene.</p>}
              <button type="button" onClick={() => router.push(recipeHref)} className={`${ghost} justify-center`}>Tarife dön</button>
              <button type="button" onClick={() => setIsFinishedOpen(false)} className="min-h-11 text-sm text-slate-400 transition hover:text-slate-200">Rehberde kal</button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
