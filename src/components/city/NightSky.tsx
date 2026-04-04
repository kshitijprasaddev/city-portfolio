"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Procedural starfield scattered across a hemisphere */
function Stars({ count = 800 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Distribute on upper hemisphere with large radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.48; // ~0 to 86 degrees elevation
      const r = 60 + Math.random() * 20;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) + 10; // offset up
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sz[i] = 0.3 + Math.random() * 1.2;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.003;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color="#e8f0ff"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Glowing moon with subtle halo */
function Moon() {
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 0.3) * 0.02;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={[25, 38, -30]}>
      {/* Moon body */}
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshStandardMaterial
          color="#e8e4d8"
          emissive="#fffbe6"
          emissiveIntensity={0.6}
          roughness={0.9}
        />
      </mesh>

      {/* Inner glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial
          color="#fffde8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial
          color="#c8d8ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Moonlight */}
      <pointLight color="#d4e4ff" intensity={8} distance={80} decay={1.5} />
    </group>
  );
}

/** Soft volumetric cloud layers */
function Clouds() {
  const groupRef = useRef<THREE.Group>(null);

  const clouds = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: [number, number, number]; opacity: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const x = -30 + Math.random() * 60;
      const y = 20 + Math.random() * 15;
      const z = -30 + Math.random() * 40;
      const sx = 4 + Math.random() * 8;
      const sy = 0.6 + Math.random() * 1;
      const sz = 3 + Math.random() * 5;
      arr.push({
        pos: [x, y, z],
        scale: [sx, sy, sz],
        opacity: 0.02 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.01) * 2;
    }
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos} scale={c.scale}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial
            color="#8899bb"
            transparent
            opacity={c.opacity}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function NightSky() {
  return (
    <group>
      <Stars count={900} />
      <Moon />
      <Clouds />
    </group>
  );
}
