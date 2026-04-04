"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { AnimatePresence, motion } from "framer-motion";
import { useDrivingStore } from "@/hooks/useDrivingStore";
import {
  BUILDINGS,
  CAR_SPAWN_XZ,
  CAR_SPAWN_ROT,
  BuildingZone,
} from "@/data/cityLayout";
import { PORTFOLIO_CONTENT } from "@/data/portfolioContent";
import { buildCollisionGrid } from "@/lib/cityCollision";
import Car from "@/components/car/Car";
import CarController from "@/components/car/CarController";
import CameraFollow, {
  CAMERA_MODE_LABELS,
} from "@/components/car/CameraFollow";
import NarrationSystem from "@/components/car/NarrationSystem";
import BackgroundMusic from "@/components/car/BackgroundMusic";
import StreetCats from "@/components/city/StreetCats";
import NightSky from "@/components/city/NightSky";
import StreetFurniture from "@/components/city/StreetFurniture";

// ── City model ──────────────────────────────────────────────────────────────
function CityModel({
  onLoaded,
}: {
  onLoaded: (bbox: THREE.Box3, scene: THREE.Object3D) => void;
}) {
  const { scene } = useGLTF("/models/city/scene.gltf");
  useEffect(() => {
    const bbox = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    console.log("=== City bbox ===", {
      min: `(${bbox.min.x.toFixed(2)}, ${bbox.min.y.toFixed(2)}, ${bbox.min.z.toFixed(2)})`,
      max: `(${bbox.max.x.toFixed(2)}, ${bbox.max.y.toFixed(2)}, ${bbox.max.z.toFixed(2)})`,
      size: `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`,
    });
    onLoaded(bbox.clone(), scene);
  }, [scene, onLoaded]);
  return <primitive object={scene} />;
}

// ── Animated building marker (clean, subtle) ───────────────────────────────
const PIN_H = 1.4;

function BuildingMarker({
  b,
  groundY,
  isActive,
}: {
  b: BuildingZone;
  groundY: number;
  isActive: boolean;
}) {
  const glowRef = useRef<THREE.PointLight>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 + b.position[0] * 0.7);
    if (glowRef.current) {
      glowRef.current.intensity = isActive ? 2 + pulse * 2 : 0.3 + pulse * 0.2;
    }
    if (matRef.current) {
      matRef.current.emissiveIntensity = isActive ? 3 + pulse * 2 : 0.8 + pulse * 0.3;
    }
  });

  return (
    <group position={[b.position[0], groundY, b.position[2]]}>
      {/* Vertical beam */}
      <mesh position={[0, PIN_H / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.025, PIN_H, 6]} />
        <meshStandardMaterial
          color={b.color}
          emissive={b.color}
          emissiveIntensity={isActive ? 2 : 0.5}
          transparent
          opacity={isActive ? 0.8 : 0.3}
        />
      </mesh>

      {/* Top orb */}
      <mesh position={[0, PIN_H + 0.06, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color={b.color}
          emissive={b.color}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Ground ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.32, 32]} />
        <meshStandardMaterial
          color={b.color}
          emissive={b.color}
          emissiveIntensity={isActive ? 2 : 0.4}
          transparent
          opacity={isActive ? 0.5 : 0.15}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point light */}
      <pointLight
        ref={glowRef}
        position={[0, PIN_H / 2, 0]}
        color={b.color}
        intensity={0.5}
        distance={3}
      />

      {/* Label — dark bg, readable */}
      <Html
        center
        position={[0, PIN_H + 0.35, 0]}
        style={{
          color: "#e2e8f0",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: isActive ? 13 : 10,
          fontWeight: 600,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          background: "rgba(8,8,20,0.92)",
          padding: "4px 12px",
          borderRadius: 6,
          border: `1px solid ${b.color}${isActive ? "88" : "33"}`,
          boxShadow: isActive
            ? `0 0 12px ${b.color}44, 0 2px 8px rgba(0,0,0,0.5)`
            : "0 2px 8px rgba(0,0,0,0.4)",
          transition: "all 0.3s ease",
          letterSpacing: "0.5px",
        }}
      >
        <span style={{ color: b.color, marginRight: 6 }}>{"\u25CF"}</span>
        {b.label}
      </Html>
    </group>
  );
}

// ── Road sign — premium 3D billboard on the ROADSIDE ────────────────────────
const SIGN_POLE_H = 1.0;
const SIGN_BOARD_W = 0.9;
const SIGN_BOARD_H = 0.32;

function RoadSign({
  b,
  groundY,
  isActive,
}: {
  b: BuildingZone;
  groundY: number;
  isActive: boolean;
}) {
  const boardRef = useRef<THREE.MeshStandardMaterial>(null);
  const edgeRef = useRef<THREE.MeshStandardMaterial>(null);
  const spotRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + b.signPosition[0] * 2);
    if (boardRef.current) {
      boardRef.current.emissiveIntensity = isActive ? 0.25 + pulse * 0.1 : 0.06;
    }
    if (edgeRef.current) {
      edgeRef.current.emissiveIntensity = isActive ? 1.2 + pulse * 0.5 : 0.3 + pulse * 0.1;
    }
    if (spotRef.current) {
      spotRef.current.intensity = isActive ? 1.2 + pulse * 0.4 : 0.15;
    }
  });

  const signRotY = b.road === "horizontal" ? 0 : Math.PI / 2;
  const boardTop = SIGN_POLE_H + SIGN_BOARD_H / 2;

  return (
    <group position={[b.signPosition[0], groundY, b.signPosition[2]]}>
      {/* Dual support poles */}
      {[-0.32, 0.32].map((offset, i) => (
        <mesh key={i} position={[0, SIGN_POLE_H / 2, 0]} rotation={[0, signRotY, 0]}>
          <group position={[offset, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.018, 0.022, SIGN_POLE_H, 8]} />
              <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        </mesh>
      ))}

      {/* Main sign board — dark matte with colored edge */}
      <group position={[0, boardTop, 0]} rotation={[0, signRotY, 0]}>
        {/* Back plate — slightly larger for depth */}
        <mesh position={[0, 0, -0.016]}>
          <boxGeometry args={[SIGN_BOARD_W + 0.04, SIGN_BOARD_H + 0.04, 0.008]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Main board */}
        <mesh>
          <boxGeometry args={[SIGN_BOARD_W, SIGN_BOARD_H, 0.02]} />
          <meshStandardMaterial
            ref={boardRef}
            color="#0a0f1a"
            emissive={b.color}
            emissiveIntensity={0.06}
            metalness={0.1}
            roughness={0.7}
          />
        </mesh>

        {/* Top accent bar */}
        <mesh position={[0, SIGN_BOARD_H / 2 + 0.01, 0.002]}>
          <boxGeometry args={[SIGN_BOARD_W, 0.02, 0.022]} />
          <meshStandardMaterial
            ref={edgeRef}
            color={b.color}
            emissive={b.color}
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>

        {/* Bottom accent bar */}
        <mesh position={[0, -SIGN_BOARD_H / 2 - 0.01, 0.002]}>
          <boxGeometry args={[SIGN_BOARD_W, 0.015, 0.022]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={isActive ? 0.6 : 0.15}
            toneMapped={false}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Side accent strips */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (SIGN_BOARD_W / 2 + 0.008), 0, 0.002]}>
            <boxGeometry args={[0.015, SIGN_BOARD_H + 0.04, 0.022]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={isActive ? 0.5 : 0.12}
              toneMapped={false}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}

        {/* Small indicator dot on board */}
        <mesh position={[-SIGN_BOARD_W / 2 + 0.08, 0, 0.012]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={isActive ? 2 : 0.5}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Overhead spotlight shining down on sign */}
      <pointLight
        ref={spotRef}
        position={[0, SIGN_POLE_H + SIGN_BOARD_H + 0.15, 0]}
        color={b.color}
        intensity={0.15}
        distance={2.5}
        decay={2}
      />

      {/* HTML label overlay */}
      <Html
        center
        position={[0, boardTop, 0]}
        style={{
          color: isActive ? "#fff" : "#c8d6e5",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: isActive ? 12 : 10,
          fontWeight: 700,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          letterSpacing: "2px",
          textTransform: "uppercase",
          textShadow: isActive ? `0 0 10px ${b.color}88` : `0 0 4px ${b.color}33`,
          transition: "all 0.4s ease",
          padding: "4px 16px",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {b.label}
          <span style={{
            fontSize: 8,
            color: isActive ? b.color : "#4a5568",
            transition: "color 0.3s",
          }}>
            {"\u25B6"}
          </span>
        </span>
      </Html>
    </group>
  );
}

// ── Building zones container ────────────────────────────────────────────────
function BuildingZones({ groundY }: { groundY: number }) {
  const activeBuilding = useDrivingStore((s) => s.activeBuilding);
  const showPanel = useDrivingStore((s) => s.showPanel);
  return (
    <>
      {BUILDINGS.map((b) => (
        <group key={b.id} visible={!showPanel}>
          <BuildingMarker
            b={b}
            groundY={groundY}
            isActive={activeBuilding === b.id}
          />
          <RoadSign
            b={b}
            groundY={groundY}
            isActive={activeBuilding === b.id}
          />
        </group>
      ))}
    </>
  );
}

// ── Portfolio panel — full-image layout matching original portfolio ───────────
function PortfolioPanel() {
  const activeBuilding = useDrivingStore((s) => s.activeBuilding);
  const showPanel = useDrivingStore((s) => s.showPanel);
  const setShowPanel = useDrivingStore((s) => s.setShowPanel);
  const building = BUILDINGS.find((b) => b.id === activeBuilding);
  const entry = activeBuilding ? PORTFOLIO_CONTENT[activeBuilding] : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const state = useDrivingStore.getState();
        if (state.showPanel) {
          state.setShowPanel(false);
        } else if (state.activeBuilding) {
          state.setShowPanel(true);
        }
        e.preventDefault();
      }
      if (e.key === "Escape" && useDrivingStore.getState().showPanel) {
        useDrivingStore.getState().setShowPanel(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!activeBuilding && showPanel) {
      setShowPanel(false);
    }
  }, [activeBuilding, showPanel, setShowPanel]);

  const color = building?.color ?? "#00ffff";
  const media = entry?.media ?? [];

  return (
    <AnimatePresence>
      {showPanel && building && entry && (
        <motion.div
          key="portfolio-overlay"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: "circle(150% at 50% 50%)" }}
          exit={{ clipPath: "circle(0% at 50% 50%)", opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            background: "#020208",
            overflowY: "auto",
            paddingTop: 40,
            paddingBottom: 60,
            perspective: "1200px",
          }}
          onClick={() => setShowPanel(false)}
        >
          {/* Dimensional radial background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: `radial-gradient(ellipse at 50% 30%, ${color}06 0%, transparent 60%)`,
              zIndex: 0,
            }}
          />
          {/* Horizontal grid lines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 }}
            transition={{ delay: 0.3, duration: 1 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, ${color}22 39px, ${color}22 40px),
                                repeating-linear-gradient(90deg, transparent, transparent 39px, ${color}11 39px, ${color}11 40px)`,
              zIndex: 0,
            }}
          />
          {/* Scan line sweeping down */}
          <motion.div
            initial={{ top: "-5%" }}
            animate={{ top: "105%" }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            style={{
              position: "absolute", left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent 10%, ${color}88 50%, transparent 90%)`,
              boxShadow: `0 0 20px ${color}44, 0 0 60px ${color}22`,
              zIndex: 10, pointerEvents: "none",
            }}
          />
          {/* Edge glow flare on open */}
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              boxShadow: `inset 0 0 120px ${color}15, inset 0 0 40px ${color}08`,
              zIndex: 1,
            }}
          />
          <motion.div
            initial={{ rotateX: 12, y: 120, opacity: 0, scale: 0.8 }}
            animate={{ rotateX: 0, y: 0, opacity: 1, scale: 1 }}
            exit={{ rotateX: -8, y: -60, opacity: 0, scale: 0.92 }}
            transition={{ delay: 0.15, type: "spring", damping: 24, stiffness: 140, mass: 0.9 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            style={{
              background: "linear-gradient(180deg, rgba(8,10,24,0.98), rgba(4,6,16,0.99))",
              border: `1px solid ${color}18`,
              borderRadius: 20,
              maxWidth: 760,
              width: "92%",
              position: "relative",
              overflow: "hidden",
              boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 60px ${color}08`,
              transformStyle: "preserve-3d",
              zIndex: 5,
            }}
          >
            {/* Top color accent bar - animated */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                opacity: 0.6,
                transformOrigin: "center",
              }}
            />

            {/* Close button */}
            <button
              onClick={() => setShowPanel(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                width: 36,
                height: 36,
                color: "#64748b",
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                backdropFilter: "blur(4px)",
              }}
            >
              {"\u2715"}
            </button>

            {/* Header */}
            <div style={{ padding: "32px 36px 0" }}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  fontSize: 10,
                  color: color,
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              >
                {building.content}
              </motion.div>
              <h2 style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#f1f5f9",
                fontFamily: "'Inter', sans-serif",
                margin: 0,
                lineHeight: 1.25,
                letterSpacing: -0.5,
              }}>
                {entry.title}
              </h2>
              {entry.subtitle && (
                <div style={{
                  fontSize: 13,
                  color: "#94a3b8",
                  fontFamily: "'Inter', sans-serif",
                  marginTop: 6,
                  fontWeight: 500,
                }}>
                  {entry.subtitle}
                </div>
              )}
              {entry.period && (
                <div style={{
                  display: "inline-block",
                  fontSize: 11,
                  color: "#64748b",
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 8,
                  letterSpacing: 1,
                  background: "rgba(255,255,255,0.03)",
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {entry.period}
                </div>
              )}
              {/* Accent line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                  height: 2,
                  background: `linear-gradient(90deg, ${color}, transparent)`,
                  borderRadius: 1,
                  marginTop: 18,
                }}
              />
            </div>

            {/* Description */}
            <div style={{ padding: "18px 36px 0" }}>
              <p style={{
                fontSize: 14,
                color: "#cbd5e1",
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1.85,
                margin: 0,
                fontWeight: 400,
              }}>
                {entry.description}
              </p>
            </div>

            {/* Bullet points */}
            {entry.bullets && entry.bullets.length > 0 && (
              <ul style={{ padding: "14px 36px 0 36px", margin: 0, listStyle: "none" }}>
                {entry.bullets.map((bullet, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    style={{
                      fontSize: 13,
                      color: "#94a3b8",
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.8,
                      marginBottom: 4,
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                    }}
                  >
                    <span style={{
                      color,
                      fontSize: 6,
                      marginTop: 8,
                      flexShrink: 0,
                    }}>{"\u25CF"}</span>
                    <span>{bullet}</span>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Technologies tags */}
            {entry.technologies && entry.technologies.length > 0 && (
              <div style={{ padding: "16px 36px 0" }}>
                <div style={{
                  fontSize: 9, color: "#475569", letterSpacing: 3, fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  marginBottom: 8,
                }}>TECHNOLOGIES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {entry.technologies.map((tech, idx) => (
                    <motion.span
                      key={tech}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.03 }}
                      style={{
                        fontSize: 11,
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                        color: "#e2e8f0",
                        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                        border: `1px solid ${color}28`,
                        borderRadius: 8,
                        padding: "6px 14px",
                        letterSpacing: 0.3,
                        position: "relative" as const,
                        overflow: "hidden" as const,
                        boxShadow: `0 2px 8px ${color}0a`,
                      }}
                    >
                      <span style={{
                        position: "absolute" as const,
                        top: 0, left: 0,
                        width: 3, height: "100%",
                        background: color,
                        borderRadius: "8px 0 0 8px",
                        opacity: 0.7,
                      }} />
                      {tech}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}

            {/* Media gallery */}
            {media.length > 0 && (
              <div style={{ padding: "22px 36px 0" }}>
                <div style={{
                  fontSize: 9,
                  color: "#475569",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: 3,
                  marginBottom: 12,
                  fontWeight: 600,
                }}>
                  MEDIA
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {media.map((m, i) => (
                    <motion.div
                      key={`${activeBuilding}-${i}`}
                      initial={{ opacity: 0, y: 30, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: 0.2 + i * 0.08,
                        duration: 0.5,
                        type: "spring",
                        damping: 20,
                      }}
                      style={{
                        borderRadius: 12,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.3)",
                        position: "relative",
                      }}
                    >
                      {m.type === "video" ? (
                        <video
                          src={m.src}
                          autoPlay
                          muted
                          loop
                          playsInline
                          style={{ width: "100%", display: "block" }}
                        />
                      ) : (
                        <img
                          src={m.src}
                          alt={m.alt}
                          style={{
                            width: "100%",
                            display: "block",
                          }}
                        />
                      )}
                      <div style={{
                        padding: "8px 14px",
                        fontSize: 11,
                        color: "#64748b",
                        fontFamily: "'Inter', sans-serif",
                        background: "rgba(0,0,0,0.5)",
                        fontWeight: 500,
                      }}>
                        {m.alt}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {entry.links && entry.links.length > 0 && (
              <div style={{ padding: "18px 36px 0", display: "flex", flexWrap: "wrap", gap: 10 }}>
                {entry.links.map((l) => (
                  <motion.a
                    key={l.url}
                    whileHover={{ scale: 1.03 }}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 12,
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      color: "#e2e8f0",
                      background: `${color}10`,
                      border: `1px solid ${color}25`,
                      borderRadius: 10,
                      padding: "8px 18px",
                      textDecoration: "none",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${color}28`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${color}10`)}
                  >
                    {l.label} <span style={{ fontSize: 14 }}>{"\u2197"}</span>
                  </motion.a>
                ))}
              </div>
            )}

            {/* Footer hint */}
            <div style={{
              padding: "22px 36px 28px",
              fontSize: 10,
              color: "#334155",
              fontFamily: "'Inter', sans-serif",
              textAlign: "center",
              letterSpacing: 2,
              fontWeight: 600,
            }}>
              ENTER or ESC to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── HUD ─────────────────────────────────────────────────────────────────────
function HUD({ ready, subtitle }: { ready: boolean; subtitle: string | null }) {
  const speed = useDrivingStore((s) => s.speed);
  const activeBuilding = useDrivingStore((s) => s.activeBuilding);
  const cameraMode = useDrivingStore((s) => s.cameraMode);
  const showPanel = useDrivingStore((s) => s.showPanel);
  const musicOn = useDrivingStore((s) => s.musicOn);
  const narrationOn = useDrivingStore((s) => s.narrationOn);
  const mode = useDrivingStore((s) => s.mode);
  const active = BUILDINGS.find((b) => b.id === activeBuilding);
  const kmh = Math.round(Math.abs(speed) * 40);

  return (
    <>
      {/* Speedometer */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          right: 40,
          zIndex: 20,
          textAlign: "right",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          color: "#00ffff",
          textShadow: "0 0 20px rgba(0,255,255,0.4)",
          userSelect: "none",
        }}
      >
        <div style={{
          fontSize: 56, fontWeight: 900, lineHeight: 1,
          letterSpacing: -2,
          background: "linear-gradient(180deg, #00ffff, #0088aa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          {kmh}
        </div>
        <div style={{
          fontSize: 11, color: "#64748b", letterSpacing: 4,
          fontWeight: 600,
        }}>
          KM/H
        </div>
      </div>

      {/* Audio toggles (top-right) */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 30,
          display: "flex",
          gap: 8,
          userSelect: "none",
        }}
      >
        <button
          onClick={() => useDrivingStore.getState().setMusicOn(!musicOn)}
          style={{
            background: musicOn ? "rgba(0,200,255,0.12)" : "rgba(0,0,0,0.6)",
            border: `1px solid ${musicOn ? "rgba(0,200,255,0.25)" : "#333"}`,
            borderRadius: 10,
            padding: "8px 14px",
            color: musicOn ? "#00ffff" : "#555",
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: 6,
            backdropFilter: "blur(8px)",
          }}
          title={musicOn ? "Mute music" : "Play music"}
        >
          {musicOn ? "\uD83C\uDFB5" : "\uD83D\uDD07"} Music
        </button>
        <button
          onClick={() => useDrivingStore.getState().setNarrationOn(!narrationOn)}
          style={{
            background: narrationOn ? "rgba(0,200,255,0.12)" : "rgba(0,0,0,0.6)",
            border: `1px solid ${narrationOn ? "rgba(0,200,255,0.25)" : "#333"}`,
            borderRadius: 10,
            padding: "8px 14px",
            color: narrationOn ? "#00ffff" : "#555",
            fontFamily: "'Inter', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s",
            display: "flex",
            alignItems: "center",
            gap: 6,
            backdropFilter: "blur(8px)",
          }}
          title={narrationOn ? "Mute narration" : "Enable narration"}
        >
          {narrationOn ? "\uD83D\uDD0A" : "\uD83D\uDD08"} Voice
        </button>
      </div>

      {/* Autopilot indicator */}
      {mode === "autopilot" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
            background: "linear-gradient(135deg, rgba(0,200,255,0.15), rgba(0,200,255,0.05))",
            border: "1px solid rgba(0,200,255,0.3)",
            borderRadius: 12,
            padding: "8px 24px",
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: "#00ffff",
            letterSpacing: 4,
            textShadow: "0 0 12px rgba(0,255,255,0.4)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,200,255,0.15)",
          }}
        >
          AUTOPILOT ACTIVE
        </motion.div>
      )}

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 40,
          zIndex: 20,
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          color: "#475569",
          lineHeight: 2,
          userSelect: "none",
          background: "rgba(4,4,12,0.5)",
          backdropFilter: "blur(6px)",
          borderRadius: 10,
          padding: "10px 14px",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        {[
          ["W / \u2191", "Accelerate"],
          ["S / \u2193", "Reverse"],
          ["A / \u2190", "Steer left"],
          ["D / \u2192", "Steer right"],
          ["C", `Camera (${CAMERA_MODE_LABELS[cameraMode] ?? "?"})`],
          ["ENTER", "Portfolio details"],
          ["M", "Toggle map"],
        ].map(([key, desc]) => (
          <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              color: "#64748b",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 10,
              minWidth: 44,
            }}>{key}</span>
            <span>{desc}</span>
          </div>
        ))}
      </div>

      {/* Narration subtitle */}
      {subtitle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute",
            bottom: 110,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
            background: "rgba(0,0,0,0.88)",
            borderRadius: 12,
            padding: "12px 28px",
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: "#e2e8f0",
            textAlign: "center",
            maxWidth: 520,
            border: "1px solid rgba(100,200,255,0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(0,200,255,0.08)",
            letterSpacing: "0.3px",
            lineHeight: 1.6,
            backdropFilter: "blur(12px)",
          }}
        >
          {subtitle}
        </motion.div>
      )}

      {/* Building approach panel */}
      {active && !showPanel && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            background: "linear-gradient(135deg, rgba(0,0,0,0.88), rgba(0,0,0,0.82))",
            border: `1px solid ${active.color}44`,
            borderRadius: 16,
            padding: "20px 32px",
            textAlign: "center",
            fontFamily: "'Inter', sans-serif",
            boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 30px ${active.color}22`,
            minWidth: 240,
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: 4,
              marginBottom: 6,
              fontWeight: 600,
            }}
          >
            APPROACHING
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: active.color,
              textShadow: `0 0 20px ${active.color}44`,
              letterSpacing: 0.5,
            }}
          >
            {active.label}
          </div>
          <div style={{
            fontSize: 12, color: "#94a3b8", marginTop: 6,
            fontWeight: 500,
          }}>
            {active.content}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#334155",
              marginTop: 10,
              letterSpacing: 3,
              fontWeight: 600,
            }}
          >
            PRESS ENTER FOR DETAILS
          </div>
        </motion.div>
      )}

      {/* Loading screen */}
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            background: "#040408",
            gap: 20,
          }}
        >
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "#00ffff",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 6,
            }}
          >
            LOADING CITY
          </motion.div>
          <div style={{
            width: 120, height: 3, borderRadius: 2,
            background: "rgba(0,200,255,0.15)",
            overflow: "hidden",
          }}>
            <motion.div
              animate={{ x: [-120, 120] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              style={{
                width: 60, height: "100%",
                background: "linear-gradient(90deg, transparent, #00ffff, transparent)",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ── Mini-map (expandable) + MPC Dashboard ───────────────────────────────────
// City bounds: X: -13.05 to 4.05, Z: -7.07 to 4.79
const MAP_SM_W = 240;
const MAP_SM_H = 170;
const MAP_LG_W = 520;
const MAP_LG_H = 380;
const CITY_X_MIN = -13.05;
const CITY_X_MAX = 4.05;
const CITY_Z_MIN = -7.07;
const CITY_Z_MAX = 4.79;

function toMapCoord(worldX: number, worldZ: number, w: number, h: number) {
  return {
    x: ((worldX - CITY_X_MIN) / (CITY_X_MAX - CITY_X_MIN)) * w,
    y: ((CITY_Z_MAX - worldZ) / (CITY_Z_MAX - CITY_Z_MIN)) * h,
  };
}

/** Inverse: map pixel → world coord */
function toWorldCoord(mapX: number, mapY: number, w: number, h: number) {
  return {
    worldX: CITY_X_MIN + (mapX / w) * (CITY_X_MAX - CITY_X_MIN),
    worldZ: CITY_Z_MAX - (mapY / h) * (CITY_Z_MAX - CITY_Z_MIN),
  };
}

/** Snap world position to nearest road centerline */
function snapToRoad(wx: number, wz: number): [number, number] {
  const distH = Math.abs(wz - 0.71);
  const distV = Math.abs(wx - (-4.18));
  if (distH < distV) return [wx, 0.71];
  return [-4.18, wz];
}

/** MPC telemetry dashboard overlay - large, animated, impressive */
function MPCDashboard() {
  const telemetry = useDrivingStore((s) => s.autopilotTelemetry);
  const speed = useDrivingStore((s) => s.speed);
  const mode = useDrivingStore((s) => s.mode);
  const target = useDrivingStore((s) => s.autoDriveTarget);

  if (mode !== "autopilot" || !target) return null;

  const building = BUILDINGS.find((b) => b.id === target);
  const kmh = Math.round(Math.abs(speed) * 40);
  const t = telemetry;
  const targetKmh = t ? Math.round(t.targetSpeed * 40) : 0;
  const progress = t && t.waypointCount > 0
    ? Math.round((t.waypointIndex / t.waypointCount) * 100)
    : 0;
  const steerDeg = t ? Math.round(t.steerAngle * (180 / Math.PI)) : 0;
  const cte = t ? t.crossTrackError.toFixed(2) : "0.00";
  const distM = t ? t.distToTarget.toFixed(1) : "0.0";

  return (
    <motion.div
      key="mpc-dashboard"
      initial={{ opacity: 0, x: -60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.9 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      style={{
        position: "absolute",
        top: 100,
        left: 16,
        zIndex: 40,
        background: "linear-gradient(135deg, rgba(4,8,20,0.95), rgba(0,20,40,0.92))",
        border: "1px solid rgba(0,200,255,0.25)",
        borderRadius: 16,
        padding: "20px 24px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        minWidth: 280,
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(0,200,255,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Animated top border glow */}
      <div style={{
        position: "absolute", top: -1, left: 20, right: 20, height: 2,
        background: "linear-gradient(90deg, transparent, #00ffff, #00ff88, transparent)",
        borderRadius: 2,
        opacity: 0.7,
      }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
        borderBottom: "1px solid rgba(0,200,255,0.12)", paddingBottom: 12,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "radial-gradient(circle, #00ff88, #00cc66)",
          boxShadow: "0 0 12px #00ff88, 0 0 24px rgba(0,255,136,0.3)",
          animation: "pulse-glow 1.5s ease-in-out infinite",
        }} />
        <div>
          <div style={{ color: "#00ffff", fontSize: 13, fontWeight: 700, letterSpacing: 3 }}>
            MPC AUTOPILOT
          </div>
          <div style={{ color: "#475569", fontSize: 9, letterSpacing: 2, marginTop: 1 }}>
            AUTONOMOUS NAVIGATION ACTIVE
          </div>
        </div>
      </div>

      {/* Target */}
      <div style={{
        background: "rgba(0,200,255,0.06)",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 14,
        border: "1px solid rgba(0,200,255,0.08)",
      }}>
        <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, marginBottom: 3, fontWeight: 600 }}>
          NAVIGATING TO
        </div>
        <div style={{
          fontSize: 18, fontWeight: 800,
          color: building?.color ?? "#00ffff",
          letterSpacing: 0.5,
          textShadow: `0 0 20px ${building?.color ?? "#00ffff"}44`,
        }}>
          {building?.label ?? target}
        </div>
      </div>

      {/* Main speed display */}
      <div style={{
        display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16,
      }}>
        <span style={{
          fontSize: 42, fontWeight: 900, color: "#00ffff",
          lineHeight: 1, fontFamily: "'Inter', sans-serif",
          textShadow: "0 0 30px rgba(0,255,255,0.3)",
        }}>
          {kmh}
        </span>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>km/h</span>
        <span style={{ fontSize: 11, color: "#334155", marginLeft: "auto" }}>
          Target: {targetKmh} km/h
        </span>
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 8px", marginBottom: 14 }}>
        {[
          { label: "STEER", value: `${steerDeg}\u00B0`, color: Math.abs(steerDeg) > 15 ? "#f59e0b" : "#94a3b8" },
          { label: "CTE", value: `${cte}m`, color: parseFloat(cte) > 0.5 ? "#ef4444" : "#22c55e" },
          { label: "DIST", value: `${distM}u`, color: "#a78bfa" },
        ].map((m) => (
          <div key={m.label} style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 8,
            padding: "8px 10px",
            border: "1px solid rgba(255,255,255,0.04)",
          }}>
            <div style={{ fontSize: 8, color: "#475569", letterSpacing: 2, fontWeight: 600 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1.3 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* Progress section */}
      <div style={{ marginBottom: 4 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", marginBottom: 6,
        }}>
          <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2, fontWeight: 600 }}>ROUTE PROGRESS</span>
          <span style={{ fontSize: 13, color: "#00ff88", fontWeight: 800 }}>{progress}%</span>
        </div>
        <div style={{
          height: 6, borderRadius: 3,
          background: "rgba(255,255,255,0.06)", overflow: "hidden",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
        }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #00ffff, #00ff88)",
              borderRadius: 3,
              boxShadow: "0 0 8px rgba(0,255,170,0.4)",
            }}
          />
        </div>
      </div>

      {/* Waypoint counter */}
      <div style={{
        marginTop: 8, fontSize: 9, color: "#334155",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>WP {t?.waypointIndex ?? 0}/{t?.waypointCount ?? 0}</span>
        <span>Press any key to cancel</span>
      </div>
    </motion.div>
  );
}

function MiniMap({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const carPosition = useDrivingStore((s) => s.carPosition);
  const carRotation = useDrivingStore((s) => s.carRotation);
  const activeBuilding = useDrivingStore((s) => s.activeBuilding);
  const autoDriveTarget = useDrivingStore((s) => s.autoDriveTarget);
  const autopilotRoute = useDrivingStore((s) => s.autopilotRoute);
  const mode = useDrivingStore((s) => s.mode);

  const mapW = expanded ? MAP_LG_W : MAP_SM_W;
  const mapH = expanded ? MAP_LG_H : MAP_SM_H;

  /** Click on the expanded map to set a drive target */
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { worldX, worldZ } = toWorldCoord(mx, my, mapW, mapH);
    const [snapX, snapZ] = snapToRoad(worldX, worldZ);

    // Find nearest building to this road point
    let nearestId: string | null = null;
    let nearestDist = Infinity;
    for (const b of BUILDINGS) {
      const bRoadX = b.road === "horizontal" ? b.signPosition[0] : -4.18;
      const bRoadZ = b.road === "horizontal" ? 0.71 : b.signPosition[2];
      const d = Math.sqrt((snapX - bRoadX) ** 2 + (snapZ - bRoadZ) ** 2);
      if (d < nearestDist) {
        nearestDist = d;
        nearestId = b.id;
      }
    }
    if (nearestId) {
      useDrivingStore.getState().setAutoDriveTarget(nearestId);
    }
  };

  // Map toggle button (always visible)
  const toggleBtn = (
    <button
      onClick={onToggle}
      style={{
        position: "absolute",
        bottom: 120,
        right: 16,
        zIndex: 26,
        background: visible ? "rgba(0,200,255,0.15)" : "rgba(8,8,20,0.85)",
        border: `1px solid ${visible ? "#00ffff55" : "rgba(100,150,200,0.25)"}`,
        borderRadius: 10,
        width: 42,
        height: 42,
        color: visible ? "#00ffff" : "#6b7280",
        fontSize: 20,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.3s",
        boxShadow: visible ? "0 0 12px rgba(0,200,255,0.2)" : "none",
        userSelect: "none",
      }}
      title={visible ? "Close map (M)" : "Open map (M)"}
    >
      {"\uD83D\uDDFA"}
    </button>
  );

  if (!visible) return toggleBtn;

  const car = toMapCoord(carPosition.x, carPosition.z, mapW, mapH);
  const hRoadY = toMapCoord(0, 0.71, mapW, mapH).y;
  const vRoadX = toMapCoord(-4.18, 0, mapW, mapH).x;

  return (
    <>
      {toggleBtn}
      <AnimatePresence mode="wait">
        <motion.div
          key={expanded ? "expanded" : "small"}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          onClick={handleMapClick}
          style={{
            position: "absolute",
            bottom: expanded ? "50%" : 170,
            right: expanded ? "50%" : 16,
            transform: expanded ? "translate(50%, 50%)" : "none",
            zIndex: expanded ? 90 : 25,
            width: mapW,
            height: mapH,
            background: expanded ? "rgba(4,6,14,0.95)" : "rgba(8,8,20,0.88)",
            border: `1px solid rgba(0,200,255,${expanded ? "0.35" : "0.25"})`,
            borderRadius: expanded ? 16 : 10,
            overflow: "hidden",
            boxShadow: expanded
              ? "0 0 60px rgba(0,0,0,0.8), 0 0 80px rgba(0,200,255,0.12)"
              : "0 0 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,200,255,0.08)",
            userSelect: "none",
            cursor: expanded ? "crosshair" : "pointer",
          }}
        >
          {/* Title bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: expanded ? "8px 16px" : "4px 8px",
            zIndex: 5,
            background: "rgba(0,0,0,0.4)",
            borderBottom: "1px solid rgba(0,200,255,0.1)",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: expanded ? 11 : 9,
              color: "#00ffff88",
              letterSpacing: 3,
            }}>
              {expanded ? "NAVIGATION MAP - Click to set destination" : "CITY MAP"}
            </div>
            {expanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "2px 10px",
                  color: "#94a3b8",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                {"\u2715"} Close
              </button>
            )}
          </div>

          {/* Road grid (SVG) */}
          <svg
            width={mapW}
            height={mapH}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            {/* Roads */}
            <line
              x1={toMapCoord(-12, 0, mapW, mapH).x}
              y1={hRoadY}
              x2={toMapCoord(3.7, 0, mapW, mapH).x}
              y2={hRoadY}
              stroke="rgba(100,150,200,0.3)"
              strokeWidth={expanded ? 10 : 6}
              strokeLinecap="round"
            />
            <line
              x1={vRoadX}
              y1={toMapCoord(0, -7.1, mapW, mapH).y}
              x2={vRoadX}
              y2={toMapCoord(0, 3.8, mapW, mapH).y}
              stroke="rgba(100,150,200,0.3)"
              strokeWidth={expanded ? 10 : 6}
              strokeLinecap="round"
            />
            {/* Road center dashes */}
            {expanded && (
              <>
                <line
                  x1={toMapCoord(-12, 0, mapW, mapH).x}
                  y1={hRoadY}
                  x2={toMapCoord(3.7, 0, mapW, mapH).x}
                  y2={hRoadY}
                  stroke="rgba(255,200,50,0.2)"
                  strokeWidth={1}
                  strokeDasharray="8,6"
                />
                <line
                  x1={vRoadX}
                  y1={toMapCoord(0, -7.1, mapW, mapH).y}
                  x2={vRoadX}
                  y2={toMapCoord(0, 3.8, mapW, mapH).y}
                  stroke="rgba(255,200,50,0.2)"
                  strokeWidth={1}
                  strokeDasharray="8,6"
                />
              </>
            )}
            {/* Intersection highlight */}
            <circle
              cx={vRoadX}
              cy={hRoadY}
              r={expanded ? 8 : 5}
              fill="rgba(100,200,255,0.12)"
              stroke="rgba(100,200,255,0.2)"
              strokeWidth={1}
            />

            {/* Autopilot planned route polyline */}
            {mode === "autopilot" && autopilotRoute.length > 1 && (() => {
              const points = autopilotRoute.map(([x, z]) => {
                const p = toMapCoord(x, z, mapW, mapH);
                return `${p.x},${p.y}`;
              }).join(" ");
              return (
                <g>
                  {/* Route glow */}
                  <polyline
                    points={points}
                    stroke="#00ffff"
                    strokeWidth={expanded ? 4 : 2}
                    fill="none"
                    opacity={0.15}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Route line */}
                  <polyline
                    points={points}
                    stroke="#00ffff"
                    strokeWidth={expanded ? 2.5 : 1.5}
                    fill="none"
                    opacity={0.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="6,4"
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="0.6s" repeatCount="indefinite" />
                  </polyline>
                  {/* Destination pulse */}
                  {autopilotRoute.length > 0 && (() => {
                    const last = autopilotRoute[autopilotRoute.length - 1];
                    const dp = toMapCoord(last[0], last[1], mapW, mapH);
                    return (
                      <circle
                        cx={dp.x}
                        cy={dp.y}
                        r={expanded ? 6 : 4}
                        fill="none"
                        stroke="#00ff88"
                        strokeWidth={1.5}
                        opacity={0.8}
                      >
                        <animate attributeName="r" values={expanded ? "4;8;4" : "3;6;3"} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    );
                  })()}
                </g>
              );
            })()}
          </svg>

          {/* Building zone markers */}
          {BUILDINGS.map((b) => {
            const bRoadX = b.road === "horizontal" ? b.signPosition[0] : -4.18;
            const bRoadZ = b.road === "horizontal" ? 0.71 : b.signPosition[2];
            const pos = toMapCoord(bRoadX, bRoadZ, mapW, mapH);
            const isActive = activeBuilding === b.id;
            const isTarget = autoDriveTarget === b.id;
            const dotSize = expanded ? 16 : 12;
            return (
              <button
                key={b.id}
                onClick={(e) => {
                  e.stopPropagation();
                  useDrivingStore.getState().setAutoDriveTarget(b.id);
                }}
                title={`${b.label} - Click to navigate`}
                style={{
                  position: "absolute",
                  left: pos.x - dotSize / 2,
                  top: pos.y - dotSize / 2,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: "50%",
                  background: isTarget ? b.color : isActive ? `${b.color}cc` : `${b.color}44`,
                  border: isTarget ? "2px solid #fff" : isActive ? `2px solid ${b.color}` : `1px solid ${b.color}55`,
                  cursor: "pointer",
                  padding: 0,
                  zIndex: 3,
                  boxShadow: isTarget
                    ? `0 0 12px ${b.color}, 0 0 24px ${b.color}55`
                    : isActive ? `0 0 8px ${b.color}66` : "none",
                  transition: "all 0.25s",
                }}
              />
            );
          })}

          {/* Building labels */}
          {BUILDINGS.map((b) => {
            const bRoadX = b.road === "horizontal" ? b.signPosition[0] : -4.18;
            const bRoadZ = b.road === "horizontal" ? 0.71 : b.signPosition[2];
            const pos = toMapCoord(bRoadX, bRoadZ, mapW, mapH);
            return (
              <div
                key={`label-${b.id}`}
                style={{
                  position: "absolute",
                  left: pos.x + (expanded ? 12 : 8),
                  top: pos.y - (expanded ? 7 : 5),
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: expanded ? 10 : 7,
                  color: `${b.color}aa`,
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  zIndex: 2,
                  textShadow: expanded ? "0 1px 4px rgba(0,0,0,0.8)" : "none",
                }}
              >
                {b.label}
              </div>
            );
          })}

          {/* Car indicator */}
          <div
            style={{
              position: "absolute",
              left: car.x - (expanded ? 7 : 5),
              top: car.y - (expanded ? 7 : 5),
              width: expanded ? 14 : 10,
              height: expanded ? 14 : 10,
              zIndex: 5,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#fff",
                borderRadius: "50%",
                boxShadow: "0 0 8px #fff, 0 0 16px #00ffff",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 0,
                  height: 0,
                  transform: `translate(-50%, -50%) rotate(${-carRotation * (180 / Math.PI) + 180}deg)`,
                  borderLeft: `${expanded ? 4 : 3}px solid transparent`,
                  borderRight: `${expanded ? 4 : 3}px solid transparent`,
                  borderBottom: `${expanded ? 10 : 8}px solid #00ffff`,
                  marginTop: expanded ? -5 : -4,
                }}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Expanded map backdrop */}
      {expanded && (
        <div
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 89,
            background: "rgba(0,0,0,0.5)",
          }}
        />
      )}
    </>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CityViewer() {
  const [groundY, setGroundY] = useState<number | null>(null);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const resetPositionWithRotation = useDrivingStore(
    (s) => s.resetPositionWithRotation
  );
  const didSpawn = useRef(false);

  // M key to toggle minimap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        if (!useDrivingStore.getState().showPanel) {
          setMapVisible((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLoaded = useCallback(
    (bbox: THREE.Box3, scene: THREE.Object3D) => {
      if (didSpawn.current) return;
      didSpawn.current = true;

      const gY = bbox.min.y + 0.01;
      setGroundY(gY);

      // Build collision grid from city geometry
      buildCollisionGrid(scene, gY);

      resetPositionWithRotation(
        new THREE.Vector3(CAR_SPAWN_XZ[0], gY, CAR_SPAWN_XZ[1]),
        CAR_SPAWN_ROT
      );
    },
    [resetPositionWithRotation]
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#080810",
        position: "relative",
      }}
    >
      <HUD ready={groundY !== null} subtitle={subtitle} />
      <PortfolioPanel />
      <NarrationSystem onSubtitle={setSubtitle} />
      <BackgroundMusic />
      <MiniMap visible={mapVisible && groundY !== null} onToggle={() => setMapVisible((v) => !v)} />
      <AnimatePresence>
        <MPCDashboard />
      </AnimatePresence>
      <Canvas
        camera={{
          position: [CAR_SPAWN_XZ[0] + 1.2, 0.8, CAR_SPAWN_XZ[1]],
          fov: 55,
          near: 0.01,
          far: 120,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Ambient: cool moonlit fill */}
        <ambientLight intensity={0.25} color="#8899cc" />
        {/* Main moonlight */}
        <directionalLight
          position={[15, 25, -10]}
          intensity={1.8}
          color="#c8d8ff"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={60}
          shadow-camera-near={0.5}
        />
        {/* Warm accent (street light bounce) */}
        <directionalLight position={[-5, 8, -3]} intensity={0.5} color="#ffd4a0" />
        {/* Ground bounce */}
        <hemisphereLight args={["#1a2040", "#0a0808", 0.4]} />
        {/* Deep atmospheric fog */}
        <fog attach="fog" args={["#080a14", 10, 55]} />

        <Suspense fallback={null}>
          <CityModel onLoaded={handleLoaded} />
          <NightSky />
          {groundY !== null && (
            <>
              <BuildingZones groundY={groundY} />
              <StreetFurniture groundY={groundY} />
              <StreetCats groundY={groundY} />
              <Car />
              <CameraFollow />
              <CarController />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/city/scene.gltf");
useGLTF.preload("/models/car/scene.gltf");
