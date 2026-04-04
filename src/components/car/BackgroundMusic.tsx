"use client";
import { useEffect, useRef } from "react";
import { useDrivingStore } from "@/hooks/useDrivingStore";

/**
 * Ambient background music using Web Audio API (procedurally generated).
 * Creates a soft, warm pad that loops seamlessly — no audio file needed.
 * Responds to the musicOn toggle in the store.
 */
export default function BackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);
  const musicOn = useDrivingStore((s) => s.musicOn);

  useEffect(() => {
    if (!musicOn) {
      // Fade out
      if (gainRef.current && ctxRef.current?.state === "running") {
        gainRef.current.gain.linearRampToValueAtTime(
          0,
          ctxRef.current.currentTime + 0.8
        );
      }
      return;
    }

    // Start or resume
    if (startedRef.current && ctxRef.current) {
      ctxRef.current.resume();
      if (gainRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(
          0.12,
          ctxRef.current.currentTime + 0.8
        );
      }
      return;
    }

    // First-time init requires user interaction — attach a one-time listener
    const initAudio = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      gainRef.current = master;

      // Create a warm ambient pad with detuned oscillators
      const notes = [130.81, 164.81, 196.0, 261.63]; // C3, E3, G3, C4
      for (const freq of notes) {
        for (let d = -8; d <= 8; d += 8) {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq;
          osc.detune.value = d + Math.random() * 3;

          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.025;

          // Slow tremolo for movement
          const lfo = ctx.createOscillator();
          lfo.type = "sine";
          lfo.frequency.value = 0.1 + Math.random() * 0.15;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 0.008;
          lfo.connect(lfoGain);
          lfoGain.connect(oscGain.gain);
          lfo.start();

          osc.connect(oscGain);
          oscGain.connect(master);
          osc.start();
        }
      }

      // Fade in
      master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);

      // Remove the listener once started
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
    };

    window.addEventListener("click", initAudio, { once: false });
    window.addEventListener("keydown", initAudio, { once: false });

    return () => {
      window.removeEventListener("click", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
  }, [musicOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, []);

  return null;
}
