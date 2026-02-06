"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useRGBStore } from "@/store/rgb-store";

const SPREAD = 1.5; // Max distance between outermost planes

function ChannelPlane({
  texture,
  zOffset,
  visible,
  opacity,
}: {
  texture: THREE.DataTexture;
  zOffset: number;
  visible: boolean;
  opacity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = zOffset;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function SeparationAnimator() {
  useFrame((_, delta) => {
    const state = useRGBStore.getState();
    if (!state.isAnimating) return;

    const { separation, targetSeparation } = state;
    const diff = targetSeparation - separation;

    if (Math.abs(diff) < 0.005) {
      useRGBStore.setState({
        separation: targetSeparation,
        isAnimating: false,
      });
    } else {
      // Smooth lerp — faster when far, slower when close
      const speed = 4;
      const next = separation + diff * Math.min(1, speed * delta);
      useRGBStore.setState({ separation: next });
    }
  });

  return null;
}

function ChannelPlanes() {
  const channelTextures = useRGBStore((s) => s.channelTextures);
  const separation = useRGBStore((s) => s.separation);
  const opacity = useRGBStore((s) => s.opacity);
  const visibility = useRGBStore((s) => s.channelVisibility);

  if (!channelTextures) return null;

  const offset = separation * SPREAD * 0.5;

  return (
    <group>
      <ChannelPlane
        texture={channelTextures.r}
        zOffset={-offset}
        visible={visibility.r}
        opacity={opacity}
      />
      <ChannelPlane
        texture={channelTextures.g}
        zOffset={0}
        visible={visibility.g}
        opacity={opacity}
      />
      <ChannelPlane
        texture={channelTextures.b}
        zOffset={offset}
        visible={visibility.b}
        opacity={opacity}
      />
    </group>
  );
}

export function RGBViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#111111"]} />
        <ChannelPlanes />
        <SeparationAnimator />
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
