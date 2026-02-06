"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useSegmentationStore } from "@/store/segmentation-store";

const SPREAD = 2.0;

const segmentVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const segmentFragmentShader = /* glsl */ `
  uniform sampler2D u_map;
  uniform float u_opacity;

  varying vec2 vUv;

  void main() {
    vec4 texel = texture2D(u_map, vUv);
    if (texel.a < 0.01) discard;
    gl_FragColor = vec4(texel.rgb, texel.a * u_opacity);
  }
`;

function SegmentPlane({
  texture,
  zOffset,
  aspect,
}: {
  texture: THREE.DataTexture;
  zOffset: number;
  aspect: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      u_map: { value: texture },
      u_opacity: { value: 0.85 },
    }),
    [texture]
  );

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.z = zOffset;
    }
    if (materialRef.current) {
      const state = useSegmentationStore.getState();
      materialRef.current.uniforms.u_opacity.value = state.opacity;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[aspect, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={segmentVertexShader}
        fragmentShader={segmentFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function SeparationAnimator() {
  useFrame((_, delta) => {
    const state = useSegmentationStore.getState();
    if (!state.isAnimating) return;

    const { separation, targetSeparation } = state;
    const diff = targetSeparation - separation;

    if (Math.abs(diff) < 0.005) {
      useSegmentationStore.setState({
        separation: targetSeparation,
        isAnimating: false,
      });
    } else {
      const speed = 4;
      const next = separation + diff * Math.min(1, speed * delta);
      useSegmentationStore.setState({ separation: next });
    }
  });

  return null;
}

function SegmentPlanes() {
  const layers = useSegmentationStore((s) => s.layers);
  const separation = useSegmentationStore((s) => s.separation);
  const visibility = useSegmentationStore((s) => s.layerVisibility);
  const sourceImage = useSegmentationStore((s) => s.sourceImage);

  if (!layers || !sourceImage) return null;

  const aspect = sourceImage.width / sourceImage.height;
  const count = layers.length;

  return (
    <group>
      {layers.map((layer, i) => {
        if (!visibility[layer.label]) return null;
        // Distribute Z offsets evenly
        const t = count > 1 ? i / (count - 1) - 0.5 : 0;
        const zOffset = t * separation * SPREAD;
        return (
          <SegmentPlane
            key={layer.label}
            texture={layer.texture}
            zOffset={zOffset}
            aspect={aspect}
          />
        );
      })}
    </group>
  );
}

export function LayersViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#111111"]} />
        <SegmentPlanes />
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
