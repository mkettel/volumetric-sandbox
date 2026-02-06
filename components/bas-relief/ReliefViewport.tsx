"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useReliefStore } from "@/store/relief-store";

const reliefVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const reliefFragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D u_map;
  uniform float u_depth;
  uniform vec3 u_lightDir;
  uniform float u_roughness;
  uniform float u_invert;
  uniform vec2 u_resolution;

  varying vec2 vUv;

  float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec2 texel = 1.0 / u_resolution;

    float sL = luma(texture2D(u_map, vUv + vec2(-texel.x, 0.0)).rgb);
    float sR = luma(texture2D(u_map, vUv + vec2( texel.x, 0.0)).rgb);
    float sT = luma(texture2D(u_map, vUv + vec2(0.0,  texel.y)).rgb);
    float sB = luma(texture2D(u_map, vUv + vec2(0.0, -texel.y)).rgb);

    sL = mix(sL, 1.0 - sL, u_invert);
    sR = mix(sR, 1.0 - sR, u_invert);
    sT = mix(sT, 1.0 - sT, u_invert);
    sB = mix(sB, 1.0 - sB, u_invert);

    float dx = (sR - sL) * u_depth;
    float dy = (sT - sB) * u_depth;
    vec3 norm = normalize(vec3(-dx, -dy, 1.0));

    vec3 ld = normalize(u_lightDir);
    float diff = max(dot(norm, ld), 0.0);

    vec3 baseColor = vec3(0.92, 0.91, 0.89);
    float ambient = 0.3;
    vec3 col = baseColor * (ambient + (1.0 - ambient) * diff);

    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfDir = normalize(ld + viewDir);
    float shininess = mix(4.0, 80.0, 1.0 - u_roughness);
    float spec = pow(max(dot(norm, halfDir), 0.0), shininess);
    col += vec3(0.12) * spec * (1.0 - u_roughness * 0.7);

    float center = luma(texture2D(u_map, vUv).rgb);
    center = mix(center, 1.0 - center, u_invert);
    float ao = mix(0.85, 1.0, center);
    col *= ao;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function ReliefPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const imageTexture = useReliefStore((s) => s.imageTexture);
  const sourceImage = useReliefStore((s) => s.sourceImage);

  const uniforms = useMemo(
    () => ({
      u_map: { value: imageTexture },
      u_depth: { value: 3.0 },
      u_lightDir: { value: new THREE.Vector3(0.5, 0.5, 1.0) },
      u_roughness: { value: 0.8 },
      u_invert: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(512, 512) },
    }),
    [imageTexture]
  );

  useFrame(() => {
    if (!materialRef.current) return;
    const state = useReliefStore.getState();
    const mat = materialRef.current;

    mat.uniforms.u_depth.value = state.displacementScale;
    mat.uniforms.u_roughness.value = state.roughness;
    mat.uniforms.u_invert.value = state.invert ? 1.0 : 0.0;

    // Convert azimuth/elevation to light direction
    const azRad = (state.lightAzimuth * Math.PI) / 180;
    const elRad = (state.lightElevation * Math.PI) / 180;
    const cosEl = Math.cos(elRad);
    mat.uniforms.u_lightDir.value.set(
      Math.cos(azRad) * cosEl,
      Math.sin(elRad),
      Math.sin(azRad) * cosEl
    );

    if (state.sourceImage) {
      mat.uniforms.u_resolution.value.set(
        state.sourceImage.width,
        state.sourceImage.height
      );
    }
  });

  if (!imageTexture || !sourceImage) return null;

  const aspect = sourceImage.width / sourceImage.height;

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[aspect, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={reliefVertexShader}
        fragmentShader={reliefFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function ReliefViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1.5], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#d4d2cf"]} />
        <ReliefPlane />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={0.3}
          maxDistance={5}
        />
      </Canvas>
    </div>
  );
}
