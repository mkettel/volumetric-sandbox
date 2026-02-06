"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRenderStore } from "@/store/render-store";

const ROTATIONS: Record<number, [number, number, number]> = {
  0: [0, Math.PI / 2, 0],   // X axis — rotate plane around Y
  1: [Math.PI / 2, 0, 0],   // Y axis — rotate plane around X
  2: [0, 0, 0],              // Z axis — no rotation
};

export function SlicePlaneHelper() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const { slicePlane } = useRenderStore.getState();
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.visible = slicePlane.enabled;
    if (!slicePlane.enabled) return;

    const rot = ROTATIONS[slicePlane.axis] ?? ROTATIONS[2];
    mesh.rotation.set(rot[0], rot[1], rot[2]);

    // Position: shift from center based on axis
    mesh.position.set(0, 0, 0);
    const offset = slicePlane.position - 0.5;
    if (slicePlane.axis === 0) mesh.position.x = offset;
    else if (slicePlane.axis === 1) mesh.position.y = offset;
    else mesh.position.z = offset;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1.1, 1.1]} />
      <meshBasicMaterial
        color="#00aaff"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
