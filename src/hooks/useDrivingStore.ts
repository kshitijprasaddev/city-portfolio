import { create } from "zustand";
import * as THREE from "three";

export type DrivingMode = "manual" | "autopilot";

export interface AutopilotTelemetry {
  waypointIndex: number;
  waypointCount: number;
  steerAngle: number;      // radians, current heading error
  targetSpeed: number;      // target speed in u/s
  distToTarget: number;     // distance to final destination
  crossTrackError: number;  // lateral error from planned path
}

interface DrivingStore {
  carPosition: THREE.Vector3;
  carRotation: number; // Y-axis radians
  speed: number;
  mode: DrivingMode;
  activeBuilding: string | null;
  cameraMode: number;
  showPanel: boolean;
  resetTrigger: number;
  musicOn: boolean;
  narrationOn: boolean;
  autoDriveTarget: string | null;
  autopilotTelemetry: AutopilotTelemetry | null;
  autopilotRoute: [number, number][];
  setCarPosition: (p: THREE.Vector3) => void;
  setCarRotation: (r: number) => void;
  setSpeed: (s: number) => void;
  setActiveBuilding: (id: string | null) => void;
  setCameraMode: (m: number) => void;
  setShowPanel: (show: boolean) => void;
  setMusicOn: (on: boolean) => void;
  setNarrationOn: (on: boolean) => void;
  setAutoDriveTarget: (id: string | null) => void;
  setAutopilotTelemetry: (t: AutopilotTelemetry | null) => void;
  setAutopilotRoute: (route: [number, number][]) => void;
  resetPosition: (p: THREE.Vector3) => void;
  resetPositionWithRotation: (p: THREE.Vector3, r: number) => void;
}

export const useDrivingStore = create<DrivingStore>((set) => ({
  carPosition: new THREE.Vector3(3.5, -0.49, 0.71),
  carRotation: -Math.PI / 2,
  speed: 0,
  mode: "manual",
  activeBuilding: null,
  cameraMode: 0,
  showPanel: false,
  resetTrigger: 0,
  musicOn: true,
  narrationOn: true,
  autoDriveTarget: null,
  autopilotTelemetry: null,
  autopilotRoute: [],
  setCarPosition: (p) => set({ carPosition: p.clone() }),
  setCarRotation: (r) => set({ carRotation: r }),
  setSpeed: (s) => set({ speed: s }),
  setActiveBuilding: (id) => set({ activeBuilding: id }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setShowPanel: (show) => set({ showPanel: show }),
  setMusicOn: (on) => set({ musicOn: on }),
  setNarrationOn: (on) => set({ narrationOn: on }),
  setAutoDriveTarget: (id) => set({
    autoDriveTarget: id,
    mode: id ? "autopilot" : "manual",
    autopilotTelemetry: id ? undefined : null,
  }),
  setAutopilotTelemetry: (t) => set({ autopilotTelemetry: t }),
  setAutopilotRoute: (route) => set({ autopilotRoute: route }),
  resetPosition: (p) =>
    set({ carPosition: p.clone(), speed: 0, resetTrigger: Date.now() }),
  resetPositionWithRotation: (p, r) =>
    set({ carPosition: p.clone(), carRotation: r, speed: 0, resetTrigger: Date.now() }),
}));
