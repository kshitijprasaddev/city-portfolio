"use client";
import { useEffect, useRef, useCallback } from "react";
import { useDrivingStore } from "@/hooks/useDrivingStore";
import { NARRATION_STEPS } from "@/data/narration";

// ── Voice selection for Web Speech API fallback ─────────────────────────────
const PREFERRED_VOICES = [
  "Microsoft Guy Online",
  "Microsoft Ryan Online",
  "Microsoft Mark Online",
  "Google UK English Male",
  "Microsoft David",
  "Microsoft Mark",
  "Daniel",
  "Alex",
];

function pickDeepVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  for (const name of PREFERRED_VOICES) {
    const v = voices.find(
      (v) => v.name.includes(name) && v.lang.startsWith("en")
    );
    if (v) return v;
  }
  const male = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("james"))
  );
  if (male) return male;
  return voices.find((v) => v.lang.startsWith("en"));
}

/**
 * Narration engine with ElevenLabs API support.
 * Tries the /api/tts route first (ElevenLabs); falls back to Web Speech API.
 * Each building narrates only once per session.
 */
export default function NarrationSystem({
  onSubtitle,
}: {
  onSubtitle: (text: string | null) => void;
}) {
  const visitedRef = useRef<Set<string>>(new Set());
  const speakingRef = useRef(false);
  const introPlayedRef = useRef(false);
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBuilding = useDrivingStore((s) => s.activeBuilding);
  const narrationOn = useDrivingStore((s) => s.narrationOn);

  // Load Web Speech API voices
  useEffect(() => {
    const loadVoices = () => {
      voiceRef.current = pickDeepVoice();
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () =>
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speakingRef.current = false;
  }, []);

  // Web Speech API fallback
  const fallbackSpeak = useCallback(
    (text: string, subtitle: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      speakingRef.current = true;
      onSubtitle(subtitle);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.82;
      utterance.pitch = 0.72;
      utterance.volume = 1.0;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      utterance.onend = () => {
        speakingRef.current = false;
        onSubtitle(null);
      };
      utterance.onerror = () => {
        speakingRef.current = false;
        onSubtitle(null);
      };
      window.speechSynthesis.speak(utterance);
    },
    [onSubtitle]
  );

  // Main speak function: ElevenLabs → Web Speech API
  const speak = useCallback(
    async (text: string, subtitle: string) => {
      stopAll();
      speakingRef.current = true;
      onSubtitle(subtitle);

      // Try ElevenLabs API route
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            speakingRef.current = false;
            onSubtitle(null);
            URL.revokeObjectURL(url);
            audioRef.current = null;
          };
          audio.onerror = () => {
            URL.revokeObjectURL(url);
            audioRef.current = null;
            fallbackSpeak(text, subtitle);
          };

          await audio.play();
          return;
        }
      } catch {
        // ElevenLabs not available — fall through to Web Speech API
      }

      fallbackSpeak(text, subtitle);
    },
    [onSubtitle, stopAll, fallbackSpeak]
  );

  // Play intro after a short delay
  useEffect(() => {
    if (introPlayedRef.current) return;
    if (!narrationOn) return;
    introPlayedRef.current = true;

    const introStep = NARRATION_STEPS.find((s) => s.id === "intro");
    if (!introStep) return;

    const timer = setTimeout(() => {
      speak(introStep.text, introStep.subtitle);
    }, 2500);

    return () => clearTimeout(timer);
  }, [speak, narrationOn]);

  // Play narration when entering a new building zone
  useEffect(() => {
    if (!narrationOn) return;
    if (!activeBuilding) return;
    if (visitedRef.current.has(activeBuilding)) return;
    if (speakingRef.current) return;

    const step = NARRATION_STEPS.find((s) => s.buildingId === activeBuilding);
    if (!step) return;

    visitedRef.current.add(activeBuilding);
    speak(step.text, step.subtitle);
  }, [activeBuilding, speak, narrationOn]);

  // Stop audio when narration is toggled off
  useEffect(() => {
    if (!narrationOn) {
      stopAll();
      onSubtitle(null);
    }
  }, [narrationOn, stopAll, onSubtitle]);

  return null;
}
