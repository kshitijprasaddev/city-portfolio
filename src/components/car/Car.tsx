"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useDrivingStore } from "@/hooks/useDrivingStore";

// Car GLTF is ~1.55 wide × 3.86 long (meters).
// City roads are 1.34 wide. Scale car to ~0.15 so it's ~0.23 wide on 1.34-wide roads.
const CAR_SCALE = 0.15;

export default function Car() {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/models/car/scene.gltf");
  const { carPosition, carRotation } = useDrivingStore();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.copy(carPosition);
    groupRef.current.rotation.y = carRotation;
  });

  return (
    <group ref={groupRef} scale={[CAR_SCALE, CAR_SCALE, CAR_SCALE]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/car/scene.gltf");
