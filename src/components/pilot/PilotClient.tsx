"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PILOT_CHIRP_VOICES, usePilotNaturalVoice } from "@/hooks/usePilotNaturalVoice";

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

// --- YARDIMCI: SÖZEL SAYILARI RAKAMA ÇEVİRME ---
const textToNumber = (text: string): number | null => {
  const map: { [key: string]: number } = {
    "bir": 1, "iki": 2, "üç": 3, "dört": 4, "beş": 5,
    "altı": 6, "yedi": 7, "sekiz": 8, "dokuz": 9, "on": 10,
    "on bir": 11, "on iki": 12, "on beş": 15, "yirmi": 20,
    "yirmi beş": 25, "otuz": 30, "kırk": 40, "elli": 50, "altmış": 60,
    "yarım": 0.5, "buçuk": 0.5
  };
  
  // Önce metin içindeki rakamları ara (örn: "5")
  const digitMatch = text.match(/\d+/);
  if (digitMatch) return parseInt(digitMatch[0]);

  // Kelime eşleşmesi ara
  for (const [key, value] of Object.entries(map)) {
    if (text.includes(key)) return value;
  }
  return null;
};

// --- İKON TANIMLARI (FontAwesome 6 Original Paths) ---
const Icon = ({ path, className, viewBox = "0 0 512 512" }: { path: string, className?: string, viewBox?: string }) => (
  <svg className={className} fill="currentColor" viewBox={viewBox} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d={path}/></svg>
);

const FaArrowLeft = (p: any) => <Icon {...p} path="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
const FaMicrophone = (p: any) => <Icon {...p} viewBox="0 0 384 512" path="M192 0C139 0 96 43 96 96V256c0 53 43 96 96 96s96-43 96-96V96c0-53-43-96-96-96zM64 216c0-13.3-10.7-24-24-24s-24 10.7-24 24C16 339.8 109.8 441.5 228 447.4V512h-8c-13.3 0-24 10.7-24 24s10.7 24 24 24h64c13.3 0 24-10.7 24-24s-10.7-24-24-24h-8V447.4c118.2-5.9 212-107.6 212-231.4c0-13.3-10.7-24-24-24s-24 10.7-24 24c0 106-86 192-192 192S64 322 64 216z"/>
const FaChevronLeft = (p: any) => <Icon {...p} viewBox="0 0 320 512" path="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
const FaChevronRight = (p: any) => <Icon {...p} viewBox="0 0 320 512" path="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>
const FaPlay = (p: any) => <Icon {...p} viewBox="0 0 384 512" path="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/>
const FaPause = (p: any) => <Icon {...p} viewBox="0 0 320 512" path="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/>
const FaStop = (p: any) => <Icon {...p} viewBox="0 0 384 512" path="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z"/>
const FaCheck = (p: any) => <Icon {...p} viewBox="0 0 448 512" path="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
const FaVolumeHigh = (p: any) => <Icon {...p} viewBox="0 0 640 512" path="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.2c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40.6 320 52.5 320 65.3V446.7c0 12.8-7.4 24.7-18.9 30.5s-24.9 4-34.9-4.6L129.7 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h65.7L266.1 39.5c10-8.6 23.5-10.4 34.9-4.6z"/>
const FaXmark = (p: any) => <Icon {...p} viewBox="0 0 384 512" path="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/>
const FaWandMagicSparkles = (p: any) => <Icon {...p} viewBox="0 0 576 512" path="M234.7 42.7L197 56.8c-3 1.1-5 4-5 7.2s2 6.1 5 7.2l37.7 14.1L248.8 123c1.1 3 4 5 7.2 5s6.1-2 7.2-5l14.1-37.7L315 71.2c3-1.1 5-4 5-7.2s-2-6.1-5-7.2L277.3 42.7 263.2 5c-1.1-3-4-5-7.2-5s-6.1 2-7.2 5L234.7 42.7zM46.1 395.4c-18.7 18.7-18.7 49.1 0 67.9l34.6 34.6c18.7 18.7 49.1 18.7 67.9 0L529.9 116.5c18.7-18.7 18.7-49.1 0-67.9L495.3 14.1c-18.7-18.7-49.1-18.7-67.9 0L46.1 395.4zM484.6 82.6l34.6 34.6L138.1 498.1 103.5 463.5 484.6 82.6zM435.2 256l-37.7-14.1L383.4 204.2c-1.1-3-4-5-7.2-5s-6.1 2-7.2 5l-14.1 37.7L317.2 256c-3 1.1-5 4-5 7.2s2 6.1 5 7.2l37.7 14.1 14.1 37.7c1.1 3 4 5 7.2 5s6.1-2 7.2-5l14.1-37.7 37.7-14.1c3-1.1 5-4 5-7.2s-2-6.1-5-7.2z"/>
const FaTriangleExclamation = (p: any) => <Icon {...p} viewBox="0 0 512 512" path="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480H40c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24V296c0 13.3 10.7 24 24 24s24-10.7 24-24V184c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
const FaFireBurner = (p: any) => <Icon {...p} viewBox="0 0 448 512" path="M112.1 454.3c0 6.2 1.8 11.9 4.9 16.6l0 0C128.5 490.9 152.9 512 181 512H331c28.1 0 52.5-21.1 63.9-41.2l0 0c3.1-4.7 4.9-10.4 4.9-16.6c0-16.1-13-29.2-29-29.2H366v-5.6c0-54.7-33-101.9-80.4-123.5l10.7-38.3c10-35.9 42.7-60.9 80-60.9h12.5c23.2 0 43.1-14.4 51.5-35.5s-1.8-44.5-19.2-57.8C402.7 89.2 388 72 378.7 52.8c-3.1-6.5-12.8-6.5-15.9 0c-13.8 28.5-38.9 52.3-71.3 64.9c-27.4 10.7-52.5 14.1-75.5 14.1s-48.1-3.4-75.5-14.1c-32.5-12.7-57.6-36.4-71.3-64.9c-3.1-6.5-12.8-6.5-15.9 0C44 72 29.3 89.2 10.8 103.2c-17.4 13.3-27.6 36.6-19.2 57.8s28.3 35.5 51.5 35.5H55.7c37.3 0 70 25 80 60.9l10.7 38.3C99 317.5 66 364.7 66 419.4v5.6H141.2c-16.1 0-29.1 13-29.1 29.2z"/>
const FaDroplet = (p: any) => <Icon {...p} viewBox="0 0 384 512" path="M192 512C86 512 0 426 0 320C0 228.8 130.2 57.7 166.6 11.7C172.6 4.2 181.5 0 191.1 0h1.8c9.6 0 18.5 4.2 24.5 11.7C253.8 57.7 384 228.8 384 320c0 106-86 192-192 192zM96 336c0-8.8-7.2-16-16-16s-16 7.2-16 16c0 61.9 50.1 112 112 112c8.8 0 16-7.2 16-16s-7.2-16-16-16c-44.2 0-80-35.8-80-80z"/>
const FaFlask = (p: any) => <Icon {...p} viewBox="0 0 448 512" path="M288 0H160C124.7 0 96 28.7 96 64V171.1L12.1 406C1.9 434.6 22.9 464 53.3 464H394.7c30.4 0 51.4-29.4 41.2-58L352 171.1V64c0-35.3-28.7-64-64-64zM240 160h-32V48h32V160z"/>
const FaQuestion = (p: any) => <Icon {...p} viewBox="0 0 320 512" path="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64c0 17-6.7 32.6-17.6 43.8L145.2 280.6c-9.2 9.4-14.4 22-14.4 35.2V336c0 13.3 10.7 24 24 24s24-10.7 24-24v-4.4c0-23.8 9.5-46.7 26.3-63.5L282.7 190.9c19.7-20.3 31.8-48.3 31.8-77.9c0-61.9-50.1-112-112-112H144C82.1 1 32 51.1 32 113v19.1c0 13.3 10.7 24 24 24s24-10.7 24-24V113zm96 320a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
const FaMedal = (p: any) => <Icon {...p} viewBox="0 0 512 512" path="M223.7 130.8L149.1 7 .2 30.5c-1.4 12.1-2.2 24.4-2.2 36.8 0 123.2 79.5 228.1 191.1 270.3L223.7 130.8zM413 256c0-123.2-79.5-228.1-191.1-270.3l35.4 206.8 74.6-123.9 148.9 23.5c1.4 12.1 2.2 24.4 2.2 36.8 0 123.2-79.5 228.1-191.1 270.3l35.4-206.8L413 256zM512 256c0 141.4-114.6 256-256 256S0 397.4 0 256C0 114.6 114.6 0 256 0s256 114.6 256 256z"/>

const FaListUl = (p: any) => <Icon {...p} viewBox="0 0 512 512" path="M64 144a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H192zM64 464a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm48-208a48 48 0 1 0 -96 0 48 48 0 1 0 96 0z"/>
const FaBellSlash = (p: any) => <Icon {...p} viewBox="0 0 640 512" path="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L512.9 376.7C552.2 340.2 576 292.3 576 240C576 125.1 482.9 32 368 32c-6.5 0-12.9 .3-19.3 .9L38.8 5.1zM288 480c0 17.7 14.3 32 32 32s32-14.3 32-32H288zm-64-32H416c0 12.8-7.4 24.7-18.9 30.5s-24.9 4-34.9-4.6L129.7 352H64c-35.3 0-64-28.7-64-64V224c0-11.2 2.9-21.7 8-30.9L224 448z"/>

interface PilotClientProps {
  recipe: Recipe;
  steps: string[];
  hasStoredSteps: boolean;
}

export default function PilotClient({ recipe, steps, hasStoredSteps }: PilotClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const naturalVoice = usePilotNaturalVoice(recipe.id, currentStep, hasStoredSteps);
  const [useDeviceVoice, setUseDeviceVoice] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState("");
  const [micSupported, setMicSupported] = useState(true);
  const wantListeningRef = useRef(false);
  const cloudSpeakingRef = useRef(false);
  const retryMicRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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


  // --- KOMUT İŞLEME MERKEZİ ---
  const handleCommand = useCallback((command: string) => {
    const lowerCmd = command.toLocaleLowerCase("tr-TR").trim();
    setLastCommand(lowerCmd);
    
    // 1. YARDIM & MODAL KONTROLLERİ
    if (lowerCmd.includes("kapat") || lowerCmd.includes("gizle")) {
        if (isHelpOpen) { setIsHelpOpen(false); speak("Yardım kapatıldı."); return; }
        if (isSOSOpen) { setIsSOSOpen(false); speak("Acil durum kapatıldı."); return; }
        if (isAlarmPlaying) { setIsAlarmPlaying(false); speak("Alarm susturuldu."); return; }
    }

    // 2. NAVİGASYON KOMUTLARI
    if (lowerCmd.includes("ileri") || lowerCmd.includes("sonraki") || lowerCmd.includes("geç")) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        speak("Sonraki adım."); // "Sıradaki" yerine "Sonraki"
      } else {
        speak("Tebrikler şefim! Tarif tamamlandı.");
        setIsFinishedOpen(true); // Modal aç
      }
    } 
    else if (lowerCmd.includes("geri") || lowerCmd.includes("önceki")) {
      if (currentStep > 0) {
        setCurrentStep(prev => prev - 1);
        speak("Önceki adıma dönüldü.");
      }
    } 
    else if (lowerCmd.includes("oku") || lowerCmd.includes("tekrar")) {
      speak(steps[currentStep]);
    }

    // 3. SÜRE / ZAMANLAYICI KOMUTLARI
    else if (lowerCmd.includes("süre") || lowerCmd.includes("başlat") || lowerCmd.includes("alarm") || lowerCmd.includes("dakika")) {
       if (lowerCmd.includes("iptal")) {
           // TAMAMEN İPTAL ET
           setTimerActive(false);
           setIsTimerPaused(false);
           setTimeLeft(0);
           setIsAlarmPlaying(false);
           speak("Süre iptal edildi.");
       } else if (lowerCmd.includes("durdur")) {
           // SADECE DURAKLAT (PAUSE)
           if (timerActive && timeLeft > 0) {
               setTimerActive(true); // Hala aktif ama pause modunda
               setIsTimerPaused(true);
               speak("Süre duraklatıldı.");
           }
       } else if (lowerCmd.includes("devam")) {
           // DEVAM ET (RESUME)
           if (timerActive && isTimerPaused) {
               setIsTimerPaused(false);
               speak("Süre devam ediyor.");
           }
       } else {
           // YENİ SÜRE BAŞLAT
           const minutes = textToNumber(lowerCmd);
           if (minutes) {
               startTimer(minutes);
               speak(`${minutes} dakika süre başlatıldı.`);
           } else if (lowerCmd.includes("başlat") && !timerActive) {
               speak("Kaç dakika ayarlayayım?");
           }
       }
    }
    
    // 4. ALARM SUSTURMA
    else if (isAlarmPlaying && (lowerCmd.includes("dur") || lowerCmd.includes("tamam") || lowerCmd.includes("sus") || lowerCmd.includes("kapat"))) {
        setIsAlarmPlaying(false);
        speak("Alarm kapatıldı.");
    }

    // 5. YARDIM / SOS
    else if (lowerCmd.includes("yardım") || lowerCmd.includes("ne diyebilirim")) {
        setIsHelpOpen(true);
        speak("Yardım menüsü açıldı.");
    }
    else if (lowerCmd.includes("acil") || lowerCmd.includes("sos") || lowerCmd.includes("sorun")) {
      setIsSOSOpen(true);
      speak("Acil durum menüsü açıldı.");
    }

  }, [currentStep, steps, speak, timerActive, isTimerPaused, timeLeft, isAlarmPlaying, isHelpOpen, isSOSOpen, startTimer]);


  // Voice commands are browser-native recognition, separate from Google Chirp MP3.
  // Initialize exactly once: the old effect recreated its recognizer whenever
  // isListening changed, leaving inactive instances and silently missing commands.
  const handleCommandRef = useRef(handleCommand);
  useEffect(() => { handleCommandRef.current = handleCommand; }, [handleCommand]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMicSupported(false);
      setMicError("Bu tarayıcı Türkçe sesli komutları desteklemiyor. Güncel Chrome ile deneyebilir veya düğmeleri kullanabilirsin.");
      return;
    }
    const recognizer = new Recognition();
    recognizer.lang = "tr-TR";
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognitionRef.current = recognizer;

    recognizer.onstart = () => {
      setMicError("");
      setIsListening(true);
    };
    recognizer.onresult = (event: any) => {
      if (!wantListeningRef.current || cloudSpeakingRef.current) return;
      const last = event.results?.[event.results.length - 1];
      const phrase = last?.[0]?.transcript;
      if (typeof phrase === "string" && phrase.trim()) {
        handleCommandRef.current(phrase);
      }
    };
    recognizer.onerror = (event: any) => {
      const code = event.error || "unknown";
      if (code === "no-speech" || code === "aborted") return;
      const messages: Record<string, string> = {
        "not-allowed": "Mikrofon izni reddedildi. Tarayıcının site izinlerinden mikrofonu aç.",
        "service-not-allowed": "Tarayıcının ses tanıma servisi engellendi. Mikrofon ve tarayıcı izinlerini kontrol et.",
        "audio-capture": "Mikrofona erişilemiyor. Başka bir uygulamanın mikrofonu kullanmadığını kontrol et.",
        "network": "Ses tanıma servisine erişilemiyor. Bağlantını kontrol et.",
        "language-not-supported": "Bu tarayıcıda Türkçe ses tanıma desteklenmiyor.",
      };
      setMicError(messages[code] || "Sesli komut algılanamadı. Lütfen yeniden dene.");
      if (["not-allowed", "service-not-allowed", "audio-capture", "language-not-supported"].includes(code)) {
        wantListeningRef.current = false;
        setIsListening(false);
      }
    };
    recognizer.onend = () => {
      setIsListening(false);
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      if (wantListeningRef.current && !cloudSpeakingRef.current) {
        retryMicRef.current = setTimeout(() => {
          if (!wantListeningRef.current || cloudSpeakingRef.current) return;
          try { recognizer.start(); } catch { /* not started; user can toggle again */ }
        }, 400);
      }
    };
    return () => {
      wantListeningRef.current = false;
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      recognizer.onend = null;
      recognizer.onresult = null;
      recognizer.onerror = null;
      try { recognizer.abort(); } catch { /* no running session */ }
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const playing = naturalVoice.playback === "playing" || naturalVoice.playback === "loading";
    cloudSpeakingRef.current = playing;
    if (!wantListeningRef.current || !recognitionRef.current) return;
    if (playing) {
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
    } else if (!isListening) {
      if (retryMicRef.current) clearTimeout(retryMicRef.current);
      retryMicRef.current = setTimeout(() => {
        if (!wantListeningRef.current || cloudSpeakingRef.current) return;
        try { recognitionRef.current?.start(); } catch { /* already started */ }
      }, 500);
    }
  }, [naturalVoice.playback, isListening]);

  const toggleListening = () => {
    if (!micSupported || !recognitionRef.current) {
      setMicError("Bu tarayıcıda sesli komutlar kullanılamıyor. Güncel Chrome ile deneyebilirsin.");
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
      if (cloudSpeakingRef.current) {
        setMicError("Tarif okunurken mikrofon bekletiliyor. Okuma bitince dinleme başlayacak.");
        return;
      }
      try {
        recognitionRef.current.start();
      } catch {
        wantListeningRef.current = false;
        setMicError("Mikrofon başlatılamadı. İzinleri kontrol edip yeniden dene.");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSOSAction = (problem: string) => {
    setSosMessage("Yapay Zeka Şef düşünüyor...");
    setTimeout(() => {
      const responses: {[key:string]: string} = {
          "burnt": "Tencereyi hemen ocaktan al ve dibi tutmayan kısımları başka bir kaba aktar. İçine yarım dilim ekmek koyup kapağı kapat, yanık kokusunu alacaktır.",
          "salty": "Yemeğe bir adet soyulmuş bütün patates at ve biraz daha pişir. Patates fazla tuzu emecektir.",
          "watery": "Kapağı aç ve yüksek ateşte suyunu çektir. Veya ayrı bir yerde biraz nişastayı suyla açıp yemeğe ekle.",
          "other": "Eksik malzeme için alternatifler: Krema yerine yoğurt+un, yumurta yerine muz veya keten tohumu jeli kullanabilirsiniz."
      };
      const msg = responses[problem] || "Çözüm bulunamadı.";
      setSosMessage(msg);
      speak(msg);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] isolate flex h-full flex-col overflow-hidden bg-[#090d16] font-sans text-[#f7f3ed]">
      {/* Atmospheric background — entirely CSS, no remote image downloads. */}
      <div className="pointer-events-none absolute -top-40 left-[8%] h-[450px] w-[450px] rounded-full bg-[#d5523d]/[0.09] blur-[125px]" />
      <div className="pointer-events-none absolute bottom-[-230px] right-[-130px] h-[560px] w-[560px] rounded-full bg-[#bd875f]/[0.08] blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.07)_0.5px,transparent_0.5px)] [background-size:22px_22px]" />

      {/* Minimal chrome / editorial header */}
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0d121d]/90 px-4 py-4 backdrop-blur-2xl sm:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <button type="button" aria-label="Tarife geri dön" onClick={() => router.back()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-[#f6f1eb] transition hover:border-[#ee795d]/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee795d]">
            <FaArrowLeft />
          </button>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f07860]" />
              <span className="text-[9px] font-extrabold tracking-[0.27em] text-[#dd9786] sm:text-[10px]">TARİFTEN / PİŞİRME REHBERİ</span>
            </div>
            <h1 className="max-w-[180px] truncate text-base font-semibold tracking-[-0.025em] text-white sm:max-w-sm sm:text-lg xl:max-w-xl">{recipe.title}</h1>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-[#c8c3ba] sm:inline-flex">Adım {currentStep + 1} / {steps.length}</span>
          <button type="button" aria-label="Komutlar ve yardım" onClick={() => setIsHelpOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.045] text-[#d8d0c9] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ee795d]"><FaQuestion /></button>
        </div>
      </header>

      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7">
          {/* Main reading stage */}
          <section aria-label="Geçerli tarif adımı"
            className="relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[26px] border border-white/[0.10] bg-gradient-to-br from-[#1c2330] via-[#141c29] to-[#111721] p-6 shadow-[0_28px_75px_rgba(0,0,0,.20)] sm:min-h-[450px] sm:rounded-[34px] sm:p-10 lg:min-h-[520px]">
            <div className="pointer-events-none absolute -right-2 -top-20 select-none text-[200px] font-extrabold leading-none tracking-tighter text-white/[0.025] sm:text-[280px]" aria-hidden="true">{String(currentStep + 1).padStart(2, "0")}</div>
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#ed795d]/15 text-sm font-extrabold text-[#ff9277]">{String(currentStep + 1).padStart(2, "0")}</span>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.28em] text-[#e9a38e]">ŞİMDİ SIRADA</div>
                  <div className="mt-0.5 text-xs text-[#9fa8b8]">Toplam {steps.length} adım</div>
                </div>
              </div>
              <span className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[11px] text-[#b5bbca]">
                {useDeviceVoice ? "Cihaz sesi" : "Google Chirp 3 HD"}
              </span>
            </div>

            <div className="relative z-10 my-10 flex flex-1 flex-col justify-center">
              <div className="mb-6 h-[2px] w-12 rounded-full bg-[#ec735a]" />
              <h2 key={currentStep} aria-live="polite"
                className="max-w-3xl text-pretty text-[clamp(1.5rem,3vw,3.15rem)] font-semibold leading-[1.35] tracking-[-0.035em] text-[#fffaf4]">
                {steps[currentStep]}
              </h2>
              {naturalVoice.error && !useDeviceVoice && (
                <p role="alert" className="mt-6 max-w-lg rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{naturalVoice.error}</p>
              )}
              {voiceFeedback && !useDeviceVoice && (
                <p role="status" className="mt-5 text-sm text-[#b9c2cf]">{voiceFeedback}</p>
              )}
            </div>

            <div className="relative z-10 flex flex-wrap items-center gap-2.5 border-t border-white/[0.08] pt-5">
              <button type="button" onClick={() => speak(steps[currentStep])}
                disabled={!useDeviceVoice && (!naturalVoice.enabled || naturalVoice.playback === "loading")}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-2xl bg-[#ed7459] px-5 text-sm font-bold text-[#11141c] transition hover:bg-[#ffa188] disabled:cursor-not-allowed disabled:opacity-50">
                <FaVolumeHigh /> {naturalVoice.playback === "loading" && !useDeviceVoice ? "Ses hazırlanıyor…" : "Adımı seslendir"}
              </button>
              {!useDeviceVoice && naturalVoice.playback === "playing" && (
                <button type="button" onClick={naturalVoice.pause} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-4 text-sm font-semibold text-[#eee9e4]"><FaPause /> Duraklat</button>
              )}
              {!useDeviceVoice && naturalVoice.playback === "paused" && (
                <button type="button" onClick={() => void naturalVoice.play()} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-4 text-sm font-semibold text-[#eee9e4]"><FaPlay /> Devam et</button>
              )}
              {!useDeviceVoice && naturalVoice.playback !== "idle" && (
                <button type="button" onClick={naturalVoice.stop} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-4 text-sm font-semibold text-[#eee9e4]"><FaStop /> Durdur</button>
              )}
            </div>
          </section>

          {/* Secondary tools: calm, intentionally de-emphasised */}
          <aside className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <section className="rounded-[26px] border border-white/[0.09] bg-[#151d29]/90 p-5 sm:p-6">
              <div className="mb-4 text-[10px] font-bold tracking-[0.24em] text-[#f08a70]">SES STÜDYOSU</div>
              <label htmlFor="pilot-voice" className="mb-2 block text-xs font-semibold text-[#c5cbd3]">Türkçe ses profili</label>
              <select id="pilot-voice" value={useDeviceVoice ? "device" : naturalVoice.voice}
                onChange={(event) => {
                  naturalVoice.stop();
                  window.speechSynthesis?.cancel();
                  if (event.target.value === "device") setUseDeviceVoice(true);
                  else { setUseDeviceVoice(false); naturalVoice.setVoice(event.target.value); }
                  setVoiceFeedback("");
                }}
                className="w-full rounded-xl border border-white/15 bg-[#0d141e] px-3 py-3 text-sm font-semibold text-[#faf5f0] focus-visible:outline-2 focus-visible:outline-[#ee795d]">
                {PILOT_CHIRP_VOICES.map((item) => (
                  <option value={item.id} key={item.id}>{item.label} · Chirp 3 HD</option>
                ))}
                <option value="device">Cihaz sesi · Ücretsiz</option>
              </select>
              <div className="mt-3 text-xs leading-5 text-[#aeb7c4]">
                {!useDeviceVoice && (!naturalVoice.token ? "Doğal ses için hesabına giriş yap." :
                  !hasStoredSteps ? "Bu tarifte kayıtlı seslendirilebilir adım bulunmuyor." :
                  naturalVoice.checking ? "Ses erişimin kontrol ediliyor…" :
                  !naturalVoice.enabled ? "Doğal ses hesabında kullanılamıyor. Cihaz sesini seçebilirsin." :
                  "Enceladus varsayılan. Yeni adım ve sesler kullanım kotasına dahil olabilir.")}
                {useDeviceVoice && "Cihaz sesi internetsiz çalışır; Google karakter kotası kullanmaz."}
              </div>
            </section>

            <section className="rounded-[26px] border border-white/[0.09] bg-[#151d29]/90 p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.24em] text-[#f08a70]">ELLER SERBEST</span>
                <span className={`h-2 w-2 rounded-full ${isListening ? "bg-[#94e0ae] shadow-[0_0_12px_#94e0ae]" : "bg-[#778294]"}`} />
              </div>
              <p className="text-sm font-semibold text-[#f4efe8]">{isListening ? "Mikrofon komutları dinliyor" : "Sesli komutlar"}</p>
              <p className="mt-2 text-xs leading-5 text-[#aeb7c4]">Mikrofonu aç, sonra “sonraki”, “önceki” veya “tekrar oku” de.</p>
              <button type="button" onClick={toggleListening} aria-pressed={isListening} disabled={!micSupported}
                className={`mt-4 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-[#ee795d] disabled:opacity-40 ${isListening ? "border-[#8ed6ad]/40 bg-[#83d3a0]/15 text-[#aef0be]" : "border-white/15 bg-white/[0.07] text-white hover:bg-white/[0.12]"}`}>
                <FaMicrophone /> {isListening ? "Dinlemeyi kapat" : "Sesli komutları aç"}
              </button>
              {lastCommand && <p className="mt-3 break-words text-xs text-[#a0e2bc]">Algılandı: “{lastCommand}”</p>}
              {micError && <p role="alert" className="mt-3 text-xs leading-5 text-[#ffb2a3]">{micError}</p>}
            </section>

            <section className="rounded-[26px] border border-white/[0.09] bg-[#151d29]/90 p-5 sm:p-6">
              <span className="text-[10px] font-bold tracking-[0.24em] text-[#f08a70]">MUTFAK ARAÇLARI</span>
              <div className="mt-4 flex items-center gap-3">
                {timerActive ? (
                  <button type="button" onClick={() => setIsTimerPaused(!isTimerPaused)}
                    className="flex min-h-14 flex-1 items-center justify-between gap-4 rounded-2xl border border-[#d6a16d]/30 bg-[#d6a16d]/10 px-4 text-[#ffe4c9]">
                    <span className="font-mono text-2xl font-bold tracking-wider">{formatTime(timeLeft)}</span>
                    {isTimerPaused ? <FaPlay /> : <FaPause />}
                  </button>
                ) : (
                  <button type="button" onClick={() => startTimer(10)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-sm font-semibold text-[#f5e6d4]">
                    <FaPlay /> 10 dk sayaç
                  </button>
                )}
                <button type="button" onClick={() => setIsSOSOpen(true)} aria-label="Mutfak ipuçları"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-[#e9a18d]">
                  <FaTriangleExclamation />
                </button>
              </div>
              {timerActive && <p className="mt-2 text-xs text-[#bdb9af]">{isTimerPaused ? "Sayaç duraklatıldı" : "Sayaç çalışıyor"} · Dokunarak değiştir</p>}
            </section>
          </aside>
        </div>
      </main>

      {/* Always visible navigational dock */}
      <footer className="relative z-20 shrink-0 border-t border-white/[0.08] bg-[#0d121c]/95 px-4 pb-5 pt-4 backdrop-blur-xl sm:px-8 sm:pb-6 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold tracking-wider text-[#a3acb9]">
            <span>PİŞİRME İLERLEMESİ</span><span>{currentStep + 1} / {steps.length}</span>
          </div>
          <div role="progressbar" aria-label="Tarif ilerlemesi" aria-valuenow={currentStep + 1} aria-valuemin={0} aria-valuemax={steps.length}
            className="mb-4 h-[5px] overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[#ee765b] to-[#f8a782] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
            <button type="button" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.07] px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-30">
              <FaChevronLeft /><span>Önceki</span>
            </button>
            <button type="button" onClick={toggleListening} disabled={!micSupported}
              aria-label={isListening ? "Mikrofonu kapat" : "Sesli komutlar için mikrofonu aç"} aria-pressed={isListening}
              className={`relative flex h-14 w-14 items-center justify-center rounded-[20px] border text-xl transition sm:h-16 sm:w-16 ${isListening ? "border-[#91e5b0]/60 bg-[#214534] text-[#bff6ce]" : "border-[#faab96]/50 bg-[#db604b] text-[#fff9f4]"} disabled:opacity-40`}>
              {isListening && <span className="pointer-events-none absolute inset-[-5px] animate-pulse rounded-[24px] border border-[#91e5b0]/25" />}
              <FaMicrophone />
            </button>
            <button type="button" onClick={() => {
              if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
              else setIsFinishedOpen(true);
            }} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#f3ebe1] px-3 text-sm font-extrabold text-[#121824] transition hover:bg-white">
              <span>{currentStep === steps.length - 1 ? "Bitir" : "Sonraki"}</span>
              {currentStep === steps.length - 1 ? <FaCheck /> : <FaChevronRight />}
            </button>
          </div>
        </div>
      </footer>

      {/* 1. SOS MODAL */}
      {isSOSOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all scale-100">
            <div className="bg-red-500/10 p-6 border-b border-red-500/20 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FaTriangleExclamation className="text-red-500" /> Mutfak Acil Servis
              </h3>
              <button onClick={() => {setIsSOSOpen(false); setSosMessage(null);}} className="text-gray-400 hover:text-white transition"><FaXmark className="text-xl" /></button>
            </div>
            <div className="p-6">
              {!sosMessage ? (
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleSOSAction('burnt')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#db4c3f] rounded-2xl text-left transition group">
                      <FaFireBurner className="text-[#db4c3f] mb-2 text-xl" /> <div className="font-bold text-white">Yemek Yandı</div>
                    </button>
                    <button onClick={() => handleSOSAction('watery')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500 rounded-2xl text-left transition group">
                      <FaDroplet className="text-blue-400 mb-2 text-xl" /> <div className="font-bold text-white">Çok Sulandı</div>
                    </button>
                    <button onClick={() => handleSOSAction('salty')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-green-500 rounded-2xl text-left transition group">
                      <FaFlask className="text-green-400 mb-2 text-xl" /> <div className="font-bold text-white">Tuz/Baharat</div>
                    </button>
                    <button onClick={() => handleSOSAction('other')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500 rounded-2xl text-left transition group">
                      <FaQuestion className="text-purple-400 mb-2 text-xl" /> <div className="font-bold text-white">Diğer Sorun</div>
                    </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[#db4c3f]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaWandMagicSparkles className="text-[#db4c3f] text-2xl animate-pulse" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Çözüm Önerisi</h4>
                  <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{sosMessage}</p>
                  <button onClick={() => setSosMessage(null)} className="mt-6 text-sm text-gray-500 hover:text-white underline">Geri Dön</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. YARDIM MODALI (Sesli Komutlar) */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="bg-blue-500/10 p-6 border-b border-blue-500/20 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2"><FaListUl className="text-blue-400" /> Sesli Komutlar</h3>
                  <button onClick={() => setIsHelpOpen(false)} className="text-gray-400 hover:text-white transition"><FaXmark className="text-xl" /></button>
              </div>
              <div className="p-6 space-y-4">
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Navigasyon</div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"İleri / Sonraki"</span> <span className="text-white font-bold">Sonraki Adım</span></div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"Geri / Önceki"</span> <span className="text-white font-bold">Önceki Adım</span></div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"Oku / Tekrar Et"</span> <span className="text-white font-bold">Adımı Oku</span></div>
                  </div>
                  <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Araçlar</div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"5 Dakika Başlat"</span> <span className="text-white font-bold">Sayaç Kur</span></div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"Süreyi Durdur"</span> <span className="text-white font-bold">Sayacı Duraklat</span></div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"Süreyi İptal Et"</span> <span className="text-white font-bold">Sayacı Sıfırla</span></div>
                      <div className="bg-white/5 p-3 rounded-xl text-sm text-gray-300 flex justify-between"><span>"Kapat / Gizle"</span> <span className="text-white font-bold">Menüleri Kapat</span></div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* 3. ALARM MODALI */}
      {isAlarmPlaying && (
          <div className="fixed inset-0 z-[210] bg-black/90 flex items-center justify-center p-4 animate-pulse">
              <div className="text-center">
                  <div className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-bounce">
                      <FaVolumeHigh className="text-6xl text-white" />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">Süre Doldu!</h2>
                  <p className="text-gray-400 text-lg mb-8">Yemeğinizi kontrol edin şefim.</p>
                  <button 
                    onClick={() => setIsAlarmPlaying(false)}
                    className="bg-white text-black px-8 py-4 rounded-full font-bold text-xl hover:scale-105 transition shadow-xl flex items-center gap-3 mx-auto"
                  >
                      <FaBellSlash /> Alarmı Sustur
                  </button>
                  <p className="mt-6 text-sm text-gray-500">"Tamam" veya "Sus" diyerek de kapatabilirsiniz.</p>
              </div>
          </div>
      )}

      {/* 4. FINISH MODAL */}
      {isFinishedOpen && (
          <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#1e293b] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-center p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FaMedal className="text-4xl text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Tebrikler Şefim!</h2>
                  <p className="text-gray-400 text-sm mb-8">Bu tarifi başarıyla tamamladın. Eline sağlık, harika görünüyor!</p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => router.push('/')}
                        className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Ana Sayfaya Dön
                    </button>
                    <button 
                        onClick={() => setIsFinishedOpen(false)}
                        className="w-full bg-white/5 text-gray-400 py-3 rounded-xl font-medium hover:bg-white/10 transition"
                    >
                        Pencereyi Kapat
                    </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}