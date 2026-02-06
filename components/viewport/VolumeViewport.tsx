"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VolumeRenderer } from "./VolumeRenderer";
import { BoundingBox } from "./BoundingBox";
import { SlicePlaneHelper } from "./SlicePlaneHelper";
import { FPSCounter, FPSDisplay } from "./FPSOverlay";

export function VolumeViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <FPSDisplay />
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [1.5, 1, 1.5], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#111111"]} />
        <VolumeRenderer />
        <BoundingBox />
        <SlicePlaneHelper />
        <FPSCounter />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={0.5}
          maxDistance={5}
        />
      </Canvas>
    </div>
  );
}
