"use client";
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useDrivingStore } from "@/hooks/useDrivingStore";

// Camera presets: offset behind car, lookAhead distance, lerp speed
const CAMERA_MODES = [
  // 0: Close chase — see the car driving, slightly above and behind
  { offset: new THREE.Vector3(0, 0.5, -1.2), lookDist: 1.0, lerp: 0.14 },
  // 1: Medium chase — wider view
  { offset: new THREE.Vector3(0, 1.2, -2.5), lookDist: 2.0, lerp: 0.10 },
  // 2: Cinematic — far back and high
  { offset: new THREE.Vector3(0, 3.0, -5.0), lookDist: 3.5, lerp: 0.07 },
  // 3: Top-down
  { offset: new THREE.Vector3(0, 10, 0), lookDist: 0, lerp: 0.1 },
];

export const CAMERA_MODE_LABELS = ["CLOSE", "CHASE", "CINEMATIC", "TOP-DOWN"];

export default function CameraFollow() {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3());
  const cameraMode = useDrivingStore((s) => s.cameraMode);

  // C key toggles camera mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") {
        const next =
          (useDrivingStore.getState().cameraMode + 1) % CAMERA_MODES.length;
        useDrivingStore.getState().setCameraMode(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useFrame(() => {
    const { carPosition, carRotation } = useDrivingStore.getState();
    const mode = CAMERA_MODES[cameraMode] ?? CAMERA_MODES[0];

    if (cameraMode === 3) {
      // Top-down: hover above, look straight down
      const desiredPos = carPosition.clone().add(mode.offset);
      camera.position.lerp(desiredPos, mode.lerp);
      lookTarget.current.lerp(carPosition, mode.lerp);
    } else {
      // Chase modes: offset rotated behind the car
      const offset = mode.offset
        .clone()
        .applyEuler(new THREE.Euler(0, carRotation, 0));
      const desiredPos = carPosition.clone().add(offset);
      camera.position.lerp(desiredPos, mode.lerp);

      // Look ahead of the car
      const lookAhead = new THREE.Vector3(
        Math.sin(carRotation) * mode.lookDist,
        0.15,
        Math.cos(carRotation) * mode.lookDist
      ).add(carPosition);
      lookTarget.current.lerp(lookAhead, mode.lerp + 0.02);
    }

    camera.lookAt(lookTarget.current);
  });

  return null;
}
