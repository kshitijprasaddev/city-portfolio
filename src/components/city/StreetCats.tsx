"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A procedural low-poly cat sitting on the sidewalk.
 * Built entirely from Three.js primitives — no GLTF needed.
 */
function SittingCat({
  position,
  bodyColor,
  accentColor,
  stripes,
  rotation = 0,
}: {
  position: [number, number, number];
  bodyColor: string;
  accentColor?: string;
  stripes?: boolean;
  rotation?: number;
}) {
  const tailRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Gentle tail sway
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 1.5 + position[0] * 3) * 0.3;
    }
    // Subtle head bob
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.8 + position[2] * 2) * 0.05;
      headRef.current.rotation.x = Math.sin(t * 0.6) * 0.03;
    }
  });

  const body = new THREE.Color(bodyColor);
  const accent = accentColor ? new THREE.Color(accentColor) : body;

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.08}>
      {/* Body — sitting oval */}
      <mesh position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.35, 0.5, 8, 12]} />
        <meshStandardMaterial color={body} roughness={0.8} />
      </mesh>

      {/* Chest/belly — lighter accent */}
      <mesh position={[0, 0.5, 0.18]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={accent} roughness={0.85} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 1.15, 0.15]}>
        <mesh>
          <sphereGeometry args={[0.28, 12, 12]} />
          <meshStandardMaterial color={body} roughness={0.8} />
        </mesh>

        {/* Snout */}
        <mesh position={[0, -0.06, 0.22]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={accent} roughness={0.85} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, 0, 0.28]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#f08080" roughness={0.6} />
        </mesh>

        {/* Eyes */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.12, 0.06, 0.2]}>
            <mesh>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.3} />
            </mesh>
            {/* Eye glint */}
            <mesh position={[side * 0.015, 0.015, 0.04]}>
              <sphereGeometry args={[0.015, 6, 6]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
          </group>
        ))}

        {/* Ears */}
        {[-1, 1].map((side) => (
          <mesh key={`ear-${side}`} position={[side * 0.18, 0.24, -0.02]} rotation={[0, 0, side * 0.3]}>
            <coneGeometry args={[0.1, 0.18, 4]} />
            <meshStandardMaterial color={body} roughness={0.8} />
          </mesh>
        ))}

        {/* Inner ears */}
        {[-1, 1].map((side) => (
          <mesh key={`inner-ear-${side}`} position={[side * 0.18, 0.24, 0.01]} rotation={[0, 0, side * 0.3]}>
            <coneGeometry args={[0.06, 0.12, 4]} />
            <meshStandardMaterial color="#f5a0a0" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Front paws */}
      {[-1, 1].map((side) => (
        <mesh key={`paw-${side}`} position={[side * 0.18, 0.08, 0.2]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={body} roughness={0.8} />
        </mesh>
      ))}

      {/* Back legs (sitting) */}
      {[-1, 1].map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.22, 0.15, -0.05]}>
          <capsuleGeometry args={[0.1, 0.15, 6, 8]} />
          <meshStandardMaterial color={body} roughness={0.8} />
        </mesh>
      ))}

      {/* Tail */}
      <group ref={tailRef} position={[0, 0.4, -0.35]}>
        <mesh position={[0, 0.3, -0.15]} rotation={[0.8, 0, 0]}>
          <capsuleGeometry args={[0.05, 0.5, 6, 8]} />
          <meshStandardMaterial color={body} roughness={0.8} />
        </mesh>
        {/* Tail tip */}
        <mesh position={[0, 0.6, -0.35]} rotation={[0.4, 0, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color={stripes ? bodyColor : accent.getStyle()} roughness={0.8} />
        </mesh>
      </group>

      {/* Stripe markings for Bengal cat */}
      {stripes && (
        <>
          {[0.3, 0.5, 0.7].map((y, i) => (
            <mesh key={`stripe-${i}`} position={[0, y + 0.15, -0.05]} rotation={[0, 0, 0.2 * (i % 2 === 0 ? 1 : -1)]}>
              <boxGeometry args={[0.6, 0.04, 0.3]} />
              <meshStandardMaterial color="#1a0e00" roughness={0.9} transparent opacity={0.4} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

/**
 * Three cats sitting on the sidewalk at various points along the roads.
 */
export default function StreetCats({ groundY }: { groundY: number }) {
  return (
    <>
      {/* Black & White cat — north side of horizontal road, near skills */}
      <SittingCat
        position={[1.5, groundY + 0.01, 1.5]}
        bodyColor="#1a1a1a"
        accentColor="#f5f5f5"
        rotation={Math.PI * 0.3}
      />

      {/* Bengal cat — south side of horizontal road, near experience */}
      <SittingCat
        position={[-2.5, groundY + 0.01, -0.2]}
        bodyColor="#c4782e"
        accentColor="#f5deb3"
        stripes
        rotation={-Math.PI * 0.2}
      />

      {/* Gray cat — east side of vertical road, between projects and achievements */}
      <SittingCat
        position={[-3.0, groundY + 0.01, -4.0]}
        bodyColor="#6b7280"
        accentColor="#d1d5db"
        rotation={Math.PI * 0.6}
      />
    </>
  );
}
