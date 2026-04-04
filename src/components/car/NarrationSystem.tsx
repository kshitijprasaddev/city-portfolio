"use client";
import { useEffect, useRef, useCallback } from "react";
import { useDrivingStore } from "@/hooks/useDrivingStore";
import { NARRATION_STEPS } from "@/data/narration";

/**
 * Narration engine using ElevenLabs API exclusively.
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBuilding = useDrivingStore((s) => s.activeBuilding);
  const narrationOn = useDrivingStore((s) => s.narrationOn);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speakingRef.current = false;
  }, []);

  // Main speak function: ElevenLabs only
  const speak = useCallback(
    async (text: string, subtitle: string) => {
      stopAll();
      speakingRef.current = true;
      onSubtitle(subtitle);

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
            speakingRef.current = false;
            onSubtitle(null);
          };

          await audio.play();
          return;
        }
      } catch {
        // ElevenLabs not available
      }

      // No fallback — just show subtitle briefly then clear
      setTimeout(() => {
        speakingRef.current = false;
        onSubtitle(null);
      }, 4000);
    },
    [onSubtitle, stopAll]
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
