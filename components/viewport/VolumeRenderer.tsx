"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useVolumeStore } from "@/store/volume-store";
import { useRenderStore } from "@/store/render-store";
import { buildTransferFunctionTexture } from "@/lib/volume/transfer-functions";
import { volumeVertexShader } from "@/lib/shaders/volume-ray-march.vert";
import { volumeFragmentShader } from "@/lib/shaders/volume-ray-march.frag";

const AXIS_NORMALS = [
  new THREE.Vector3(1, 0, 0), // X
  new THREE.Vector3(0, 1, 0), // Y
  new THREE.Vector3(0, 0, 1), // Z
];

export function VolumeRenderer() {
  const meshRef = useRef<THREE.Mesh>(null);
  const tfTextureRef = useRef<THREE.DataTexture | null>(null);
  const currentTfNameRef = useRef<string>("");

  const volume = useVolumeStore((s) => s.currentVolume);

  const uniforms = useMemo(() => {
    const tfTex = buildTransferFunctionTexture("grayscale");
    tfTextureRef.current = tfTex;
    currentTfNameRef.current = "grayscale";

    return {
      u_volumeData: { value: null as THREE.Data3DTexture | null },
      u_transferFunction: { value: tfTex },
      u_renderMode: { value: 0 },
      u_windowCenter: { value: 0.5 },
      u_windowWidth: { value: 1.0 },
      u_thresholdMin: { value: 0.0 },
      u_thresholdMax: { value: 1.0 },
      u_opacity: { value: 1.0 },
      u_stepCount: { value: 128 },
      u_sliceEnabled: { value: false },
      u_sliceNormal: { value: new THREE.Vector3(0, 0, 1) },
      u_slicePosition: { value: 0.5 },
      u_sliceThickness: { value: 0.01 },
    };
  }, []);

  // Update volume texture when volume changes
  useEffect(() => {
    if (volume) {
      uniforms.u_volumeData.value = volume.texture;
    }
  }, [volume, uniforms]);

  // Push render params to uniforms every frame (no React re-renders)
  useFrame(() => {
    const state = useRenderStore.getState();

    uniforms.u_renderMode.value = state.mode;
    uniforms.u_windowCenter.value = state.windowCenter;
    uniforms.u_windowWidth.value = state.windowWidth;
    uniforms.u_thresholdMin.value = state.thresholdMin;
    uniforms.u_thresholdMax.value = state.thresholdMax;
    uniforms.u_opacity.value = state.opacity;
    uniforms.u_stepCount.value = state.stepCount;
    uniforms.u_sliceEnabled.value = state.slicePlane.enabled;
    uniforms.u_slicePosition.value = state.slicePlane.position;
    uniforms.u_sliceThickness.value = state.slicePlane.thickness;

    const normal = AXIS_NORMALS[state.slicePlane.axis] ?? AXIS_NORMALS[2];
    uniforms.u_sliceNormal.value.copy(normal);

    // Swap TF texture if name changed
    if (state.transferFunction !== currentTfNameRef.current) {
      tfTextureRef.current?.dispose();
      const newTf = buildTransferFunctionTexture(state.transferFunction);
      tfTextureRef.current = newTf;
      currentTfNameRef.current = state.transferFunction;
      uniforms.u_transferFunction.value = newTf;
    }
  });

  if (!volume) return null;

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <shaderMaterial
        vertexShader={volumeVertexShader}
        fragmentShader={volumeFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        glslVersion={THREE.GLSL3}
        depthWrite={false}
      />
    </mesh>
  );
}
