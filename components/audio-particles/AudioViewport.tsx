"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useAudioStore } from "@/store/audio-store";
import { audioParticleVertexShader } from "@/lib/shaders/audio-particle.vert";
import { particleFragmentShader } from "@/lib/shaders/particle.frag";

function AudioCloud() {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const audioData = useAudioStore((s) => s.audioData);
  const colorMode = useAudioStore((s) => s.colorMode);

  const uniforms = useMemo(
    () => ({
      u_pointSize: { value: 2.0 },
      u_yScale: { value: 1.5 },
      u_opacity: { value: 0.85 },
    }),
    []
  );

  // Set geometry attributes when audioData changes
  useEffect(() => {
    if (!audioData || !geometryRef.current) return;
    const geo = geometryRef.current;

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(audioData.positions, 3)
    );

    const colors =
      colorMode === "frequency"
        ? audioData.frequencyColors
        : audioData.amplitudeColors;
    geo.setAttribute("a_color", new THREE.BufferAttribute(colors, 3));
    geo.setDrawRange(0, audioData.count);
  }, [audioData, colorMode]);

  // Push control values to uniforms every frame
  useFrame(() => {
    if (!materialRef.current) return;
    const state = useAudioStore.getState();
    materialRef.current.uniforms.u_pointSize.value = state.pointSize;
    materialRef.current.uniforms.u_yScale.value = state.yScale;
    materialRef.current.uniforms.u_opacity.value = state.opacity;
  });

  if (!audioData) return null;

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={audioParticleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function PlayheadPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const audioData = useAudioStore((s) => s.audioData);

  useFrame(() => {
    if (!meshRef.current) return;
    const state = useAudioStore.getState();
    if (!state.audioData || state.duration <= 0) return;

    // Map currentTime to z range [-1.5, 1.5]
    const t = state.currentTime / state.duration;
    meshRef.current.position.z = t * 3 - 1.5;
  });

  if (!audioData) return null;

  return (
    <mesh ref={meshRef} rotation={[0, 0, 0]}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function AudioViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.5, 4], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#111111"]} />
        <AudioCloud />
        <PlayheadPlane />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={0.3}
          maxDistance={10}
        />
      </Canvas>
    </div>
  );
}
