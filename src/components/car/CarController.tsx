"use client";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDrivingStore } from "@/hooks/useDrivingStore";
import { BUILDINGS, ROAD_H_Z, ROAD_V_X } from "@/data/cityLayout";
import { isBlockedWithRadius, isGridReady } from "@/lib/cityCollision";
import { planRoute, dist2d, angleTo } from "@/lib/autopilot";

// 50 km/h forward = 50/40 = 1.25 u/s, 30 km/h reverse = 30/40 = 0.75 u/s
const SPEED_MAX = 1.25;
const SPEED_MIN = -0.75;
const ACCEL = 1.8;
const BRAKE_POWER = 3;
const FRICTION = 1.2;
const TURN_SPEED = 3.0;
const BUILDING_TRIGGER_DIST = 1.5;
const CAR_RADIUS = 0.14;

// Autopilot constants — MPC-style pursuit driving
const AP_SPEED_MAX = 0.8; // ~32 km/h cruising
const AP_SPEED_MIN = 0.25; // slow for tight turns
const AP_ARRIVE_DIST = 0.35;
const AP_TURN_SPEED = 5.0;
const AP_LOOKAHEAD = 2; // look ahead N waypoints for smoother pursuit

type Keys = {
  w: boolean; s: boolean; a: boolean; d: boolean;
  ArrowUp: boolean; ArrowDown: boolean; ArrowLeft: boolean; ArrowRight: boolean;
};

export default function CarController() {
  const keys = useRef<Keys>({
    w: false, s: false, a: false, d: false,
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
  });

  const { setCarPosition, setCarRotation, setSpeed, setActiveBuilding } =
    useDrivingStore.getState();
  const setTelemetry = useDrivingStore.getState().setAutopilotTelemetry;

  const resetTrigger = useDrivingStore((s) => s.resetTrigger);

  // CRITICAL: initialize refs from the current store state, NOT hardcoded 0.
  // useFrame runs before useEffect, so the very first frame would otherwise
  // overwrite the store's spawn rotation (PI/2) with 0.
  const posRef = useRef(useDrivingStore.getState().carPosition.clone());
  const rotRef = useRef(useDrivingStore.getState().carRotation);
  const speedRef = useRef(0);

  // Autopilot state
  const waypointsRef = useRef<[number, number][]>([]);
  const wpIndexRef = useRef(0);
  const autoDriveTarget = useDrivingStore((s) => s.autoDriveTarget);

  // Re-sync refs whenever resetTrigger fires (city load, respawn)
  useEffect(() => {
    const state = useDrivingStore.getState();
    posRef.current.copy(state.carPosition);
    rotRef.current = state.carRotation;
    speedRef.current = 0;
  }, [resetTrigger]);

  // Plan route when autoDriveTarget changes
  useEffect(() => {
    if (autoDriveTarget) {
      const pos = posRef.current;
      const route = planRoute(pos.x, pos.z, autoDriveTarget);
      waypointsRef.current = route;
      wpIndexRef.current = 0;
      useDrivingStore.getState().setAutopilotRoute(route);
    } else {
      waypointsRef.current = [];
      wpIndexRef.current = 0;
      useDrivingStore.getState().setAutopilotRoute([]);
    }
  }, [autoDriveTarget]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key as keyof Keys;
      if (k in keys.current) {
        (keys.current as Record<string, boolean>)[k] = true;
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key as keyof Keys;
      if (k in keys.current) (keys.current as Record<string, boolean>)[k] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const mode = useDrivingStore.getState().mode;

    if (mode === "autopilot") {
      // ── Autopilot ──────────────────────────────────────────────────────
      const wps = waypointsRef.current;
      const wpI = wpIndexRef.current;
      if (wps.length === 0) {
        // Route not yet planned (useEffect hasn't fired) — hold position
        speedRef.current = 0;
      } else if (wpI >= wps.length) {
        // Arrived at final waypoint — smoothly decelerate and stop
        speedRef.current *= 0.92;
        if (Math.abs(speedRef.current) < 0.01) speedRef.current = 0;

        if (speedRef.current === 0) {
          const store = useDrivingStore.getState();
          store.setAutoDriveTarget(null);
          store.setShowPanel(true);
        }
      } else {
        // Pursuit-style steering: look ahead for smoother curves
        const lookaheadIdx = Math.min(wpI + AP_LOOKAHEAD, wps.length - 1);
        const target = wps[lookaheadIdx];
        const current = wps[wpI];
        const cx = posRef.current.x;
        const cz = posRef.current.z;
        const d = dist2d(cx, cz, current[0], current[1]);

        if (d < AP_ARRIVE_DIST) {
          wpIndexRef.current++;
        }

        // Steer toward lookahead point
        const desired = angleTo(cx, cz, target[0], target[1]);
        let diff = desired - rotRef.current;
        // Normalize to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        // Smooth exponential steering (more realistic than linear clamp)
        const steerAmount = diff * AP_TURN_SPEED * dt;
        const maxSteer = AP_TURN_SPEED * dt;
        rotRef.current += Math.sign(steerAmount) * Math.min(Math.abs(steerAmount), maxSteer);

        // Adaptive speed: slow down for turns, speed up on straight stretches
        const absDiff = Math.abs(diff);
        const curveFactor = 1 - Math.min(absDiff / (Math.PI * 0.5), 1);
        const distToEnd = dist2d(cx, cz, wps[wps.length - 1][0], wps[wps.length - 1][1]);
        const approachFactor = Math.min(distToEnd / 2.0, 1); // slow down near end
        const targetSpeed = AP_SPEED_MIN + (AP_SPEED_MAX - AP_SPEED_MIN) * curveFactor * approachFactor;

        // Smooth acceleration/deceleration
        if (speedRef.current < targetSpeed) {
          speedRef.current = Math.min(speedRef.current + ACCEL * 0.8 * dt, targetSpeed);
        } else {
          speedRef.current = Math.max(speedRef.current - FRICTION * dt, targetSpeed);
        }

        // Emit MPC telemetry for the dashboard
        setTelemetry({
          waypointIndex: wpI,
          waypointCount: wps.length,
          steerAngle: diff,
          targetSpeed,
          distToTarget: distToEnd,
          crossTrackError: d,
        });
      }

      // Cancel autopilot if user presses any drive key
      const anyKey =
        keys.current.w || keys.current.s || keys.current.a || keys.current.d ||
        keys.current.ArrowUp || keys.current.ArrowDown || keys.current.ArrowLeft || keys.current.ArrowRight;
      if (anyKey) {
        useDrivingStore.getState().setAutoDriveTarget(null);
        setTelemetry(null);
      }
    } else {
      // ── Manual driving ─────────────────────────────────────────────────
      const fwd = keys.current.w || keys.current.ArrowUp;
      const rev = keys.current.s || keys.current.ArrowDown;
      const left = keys.current.a || keys.current.ArrowLeft;
      const right = keys.current.d || keys.current.ArrowRight;

      if (fwd) {
        speedRef.current = Math.min(speedRef.current + ACCEL * dt, SPEED_MAX);
      } else if (rev) {
        speedRef.current = Math.max(speedRef.current - BRAKE_POWER * dt, SPEED_MIN);
      } else {
        const dir = Math.sign(speedRef.current);
        speedRef.current -= dir * Math.min(FRICTION * dt, Math.abs(speedRef.current));
      }

      const absSpeed = Math.abs(speedRef.current);
      if (absSpeed > 0.05 && (left || right)) {
        const turnFactor = Math.min(1, absSpeed / 0.4);
        const steer = TURN_SPEED * turnFactor * dt;
        if (right) rotRef.current -= steer;
        if (left) rotRef.current += steer;
      }
    }

    // Movement in XZ plane
    const groundY = posRef.current.y;
    const newX = posRef.current.x + Math.sin(rotRef.current) * speedRef.current * dt;
    const newZ = posRef.current.z + Math.cos(rotRef.current) * speedRef.current * dt;

    // Collision with wall-sliding
    if (!isGridReady()) {
      posRef.current.x = newX;
      posRef.current.z = newZ;
    } else if (!isBlockedWithRadius(newX, newZ, CAR_RADIUS)) {
      posRef.current.x = newX;
      posRef.current.z = newZ;
    } else if (!isBlockedWithRadius(newX, posRef.current.z, CAR_RADIUS)) {
      posRef.current.x = newX;
      speedRef.current *= 0.5;
    } else if (!isBlockedWithRadius(posRef.current.x, newZ, CAR_RADIUS)) {
      posRef.current.z = newZ;
      speedRef.current *= 0.5;
    } else {
      speedRef.current = 0;
    }
    posRef.current.y = groundY;

    setCarPosition(posRef.current.clone());
    setCarRotation(rotRef.current);
    setSpeed(speedRef.current);

    // Building proximity check — project sign positions to road center for trigger distance
    let nearest: string | null = null;
    let nearestDist = BUILDING_TRIGGER_DIST;
    for (const b of BUILDINGS) {
      // Project sign position onto the road centerline for distance check
      const roadX = b.road === "horizontal" ? b.signPosition[0] : ROAD_V_X;
      const roadZ = b.road === "horizontal" ? ROAD_H_Z : b.signPosition[2];
      const dx = posRef.current.x - roadX;
      const dz = posRef.current.z - roadZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = b.id;
      }
    }
    setActiveBuilding(nearest);
  });

  return null;
}
