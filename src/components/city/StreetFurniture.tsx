"use client";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ROAD_H_Z, ROAD_V_X } from "@/data/cityLayout";

/** Single street lamp with glowing light */
function StreetLamp({
  position,
  rotation = 0,
  color = "#ffeebb",
}: {
  position: [number, number, number];
  rotation?: number;
  color?: string;
}) {
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker = 0.95 + Math.sin(t * 8 + position[0] * 3) * 0.05;
    if (lightRef.current) lightRef.current.intensity = 1.5 * flicker;
    if (glowRef.current) glowRef.current.emissiveIntensity = 2 * flicker;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Pole */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 1.4, 6]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Arm */}
      <mesh position={[0, 1.38, 0.12]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.3, 4]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Lamp head */}
      <mesh position={[0, 1.42, 0.22]}>
        <boxGeometry args={[0.1, 0.06, 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Glowing bulb */}
      <mesh position={[0, 1.38, 0.22]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial
          ref={glowRef}
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Light cone */}
      <pointLight
        ref={lightRef}
        position={[0, 1.35, 0.22]}
        color={color}
        intensity={1.5}
        distance={4}
        decay={2}
      />

      {/* Ground glow circle */}
      <mesh position={[0, 0.02, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.03}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/** Road bollard / post */
function Bollard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.3, 6]} />
        <meshStandardMaterial color="#444" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Reflective top band */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.04, 6]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff8800"
          emissiveIntensity={0.3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Bench sitting on the sidewalk */
function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.12}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.72, -0.17]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.04]} />
        <meshStandardMaterial color="#5c3a1e" roughness={0.85} />
      </mesh>
      {/* Legs */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.04, 0.44, 0.35]} />
          <meshStandardMaterial color="#333" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/** Road lane marking dashes */
function RoadMarkings({ groundY }: { groundY: number }) {
  const hDashes = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let x = -11.5; x <= 3.5; x += 0.8) {
      arr.push([x, groundY + 0.005, ROAD_H_Z]);
    }
    return arr;
  }, [groundY]);

  const vDashes = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let z = -6.8; z <= 3.5; z += 0.8) {
      arr.push([ROAD_V_X, groundY + 0.005, z]);
    }
    return arr;
  }, [groundY]);

  return (
    <group>
      {/* Horizontal road center dashes */}
      {hDashes.map((pos, i) => (
        <mesh key={`h-${i}`} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.35, 0.025]} />
          <meshBasicMaterial color="#ffdd44" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
      {/* Vertical road center dashes */}
      {vDashes.map((pos, i) => (
        <mesh key={`v-${i}`} position={pos} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[0.35, 0.025]} />
          <meshBasicMaterial color="#ffdd44" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function StreetFurniture({ groundY }: { groundY: number }) {
  // Street lamps along horizontal road
  const hLamps: [number, number, number][] = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let x = -10; x <= 3; x += 2.5) {
      arr.push([x, groundY, ROAD_H_Z + 1.1]); // north side
      arr.push([x + 1.25, groundY, ROAD_H_Z - 1.1]); // south side, staggered
    }
    return arr;
  }, [groundY]);

  // Street lamps along vertical road
  const vLamps: [number, number, number][] = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let z = -6.5; z <= 3; z += 2.5) {
      arr.push([ROAD_V_X + 1.1, groundY, z]); // east side
      arr.push([ROAD_V_X - 1.1, groundY, z + 1.25]); // west side, staggered
    }
    return arr;
  }, [groundY]);

  // Bollards at intersection corners
  const bollards: [number, number, number][] = [
    [ROAD_V_X + 0.8, groundY, ROAD_H_Z + 0.8],
    [ROAD_V_X - 0.8, groundY, ROAD_H_Z + 0.8],
    [ROAD_V_X + 0.8, groundY, ROAD_H_Z - 0.8],
    [ROAD_V_X - 0.8, groundY, ROAD_H_Z - 0.8],
  ];

  // Benches along sidewalks
  const benches: { pos: [number, number, number]; rot: number }[] = [
    { pos: [1.5, groundY, ROAD_H_Z + 1.3], rot: Math.PI },
    { pos: [-1, groundY, ROAD_H_Z - 1.3], rot: 0 },
    { pos: [ROAD_V_X + 1.3, groundY, -1.5], rot: -Math.PI / 2 },
    { pos: [ROAD_V_X - 1.3, groundY, -4.5], rot: Math.PI / 2 },
  ];

  return (
    <group>
      <RoadMarkings groundY={groundY} />

      {hLamps.map((pos, i) => (
        <StreetLamp
          key={`hl-${i}`}
          position={pos}
          rotation={pos[2] > ROAD_H_Z ? Math.PI : 0}
          color={i % 3 === 0 ? "#ffd4a0" : "#ffe8cc"}
        />
      ))}

      {vLamps.map((pos, i) => (
        <StreetLamp
          key={`vl-${i}`}
          position={pos}
          rotation={pos[0] > ROAD_V_X ? -Math.PI / 2 : Math.PI / 2}
          color={i % 3 === 0 ? "#ffd4a0" : "#ffe8cc"}
        />
      ))}

      {bollards.map((pos, i) => (
        <Bollard key={`b-${i}`} position={pos} />
      ))}

      {benches.map((b, i) => (
        <Bench key={`bench-${i}`} position={b.pos} rotation={b.rot} />
      ))}
    </group>
  );
}
