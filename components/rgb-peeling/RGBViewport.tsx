"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useRGBStore } from "@/store/rgb-store";

const SPREAD = 1.5;

const channelVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const channelFragmentShader = /* glsl */ `
  uniform sampler2D u_map;
  uniform float u_opacity;
  uniform float u_windowCenter;
  uniform float u_windowWidth;

  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(u_map, vUv);

    // Get channel intensity (whichever channel has data)
    float intensity = max(texel.r, max(texel.g, texel.b));

    // Apply windowing: remap intensity through window
    float low = u_windowCenter - u_windowWidth * 0.5;
    float high = u_windowCenter + u_windowWidth * 0.5;
    float windowed = clamp((intensity - low) / max(high - low, 0.001), 0.0, 1.0);

    // Scale channel color by windowed/original ratio
    float scale = intensity > 0.001 ? windowed / intensity : 0.0;

    gl_FragColor = vec4(texel.rgb * scale, texel.a * u_opacity);
  }
`;

function ChannelPlane({
  texture,
  channel,
  zOffset,
  visible,
}: {
  texture: THREE.DataTexture;
  channel: "r" | "g" | "b";
  zOffset: number;
  visible: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      u_map: { value: texture },
      u_opacity: { value: 0.85 },
      u_windowCenter: { value: 0.5 },
      u_windowWidth: { value: 1.0 },
    }),
    [texture]
  );

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = zOffset;
    }
    if (materialRef.current) {
      const state = useRGBStore.getState();
      materialRef.current.uniforms.u_opacity.value = state.opacity;
      materialRef.current.uniforms.u_windowCenter.value =
        state.channelWindows[channel].center;
      materialRef.current.uniforms.u_windowWidth.value =
        state.channelWindows[channel].width;
    }
  });

  if (!visible) return null;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={channelVertexShader}
        fragmentShader={channelFragmentShader}
        uniforms={uniforms}
        transparent
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
  const visibility = useRGBStore((s) => s.channelVisibility);

  if (!channelTextures) return null;

  const offset = separation * SPREAD * 0.5;

  return (
    <group>
      <ChannelPlane
        texture={channelTextures.r}
        channel="r"
        zOffset={-offset}
        visible={visibility.r}
      />
      <ChannelPlane
        texture={channelTextures.g}
        channel="g"
        zOffset={0}
        visible={visibility.g}
      />
      <ChannelPlane
        texture={channelTextures.b}
        channel="b"
        zOffset={offset}
        visible={visibility.b}
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
