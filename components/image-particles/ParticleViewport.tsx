"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  useParticleStore,
  type ZMode,
  type ParticleData,
} from "@/store/particle-store";
import { particleVertexShader } from "@/lib/shaders/particle.vert";
import { particleFragmentShader } from "@/lib/shaders/particle.frag";

function getZMapForMode(
  mode: ZMode,
  data: ParticleData,
  depthMap: Float32Array | null
): Float32Array {
  if (mode === "depth") {
    return depthMap ?? data.zMaps.flat;
  }
  return data.zMaps[mode];
}

function ParticleCloud() {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const transitionRef = useRef(1.0);
  const zTargetAttrRef = useRef<THREE.BufferAttribute | null>(null);
  const prevTargetRef = useRef<Float32Array | null>(null);

  const particleData = useParticleStore((s) => s.particleData);

  const uniforms = useMemo(
    () => ({
      u_pointSize: { value: 2.0 },
      u_zScale: { value: 1.0 },
      u_explode: { value: 0.0 },
      u_transition: { value: 1.0 },
      u_opacity: { value: 0.85 },
    }),
    []
  );

  // Set geometry attributes when particleData changes
  useEffect(() => {
    if (!particleData || !geometryRef.current) return;
    const geo = geometryRef.current;
    const { positions, colors, count } = particleData;

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("a_color", new THREE.BufferAttribute(colors, 3));

    const state = useParticleStore.getState();
    const targetZ = getZMapForMode(state.zMode, particleData, state.depthMap);

    // Current Z: own copy we can mutate for transitions
    const currentZ = new Float32Array(count);
    currentZ.set(targetZ);
    geo.setAttribute("a_zCurrent", new THREE.BufferAttribute(currentZ, 1));

    // Target Z: own copy so we can update in-place on mode switch
    const targetCopy = new Float32Array(count);
    targetCopy.set(targetZ);
    const targetAttr = new THREE.BufferAttribute(targetCopy, 1);
    geo.setAttribute("a_zTarget", targetAttr);
    zTargetAttrRef.current = targetAttr;

    geo.setDrawRange(0, count);
    prevTargetRef.current = targetZ;
    transitionRef.current = 1.0;
  }, [particleData]);

  useFrame((_, delta) => {
    if (!materialRef.current || !geometryRef.current || !particleData) return;

    const state = useParticleStore.getState();
    const mat = materialRef.current;
    const geo = geometryRef.current;

    // Push control values to uniforms
    mat.uniforms.u_pointSize.value = state.pointSize;
    mat.uniforms.u_zScale.value = state.zScale;
    mat.uniforms.u_explode.value = state.explode;
    mat.uniforms.u_opacity.value = state.opacity;

    // Only enable depth write in depth mode (other modes have particles
    // at similar z-values which causes z-fighting artifacts)
    mat.depthWrite = state.zMode === "depth" && state.depthMap !== null;

    // Resolve the current target z-map (handles depth mode + depthMap arrival)
    const currentTarget = getZMapForMode(
      state.zMode,
      particleData,
      state.depthMap
    );

    // Detect target change (mode switch OR depthMap arriving while in depth mode)
    if (currentTarget !== prevTargetRef.current) {
      const currentAttr = geo.getAttribute(
        "a_zCurrent"
      ) as THREE.BufferAttribute;
      const targetAttr = zTargetAttrRef.current;
      if (currentAttr && targetAttr) {
        const currentArr = currentAttr.array as Float32Array;
        const targetArr = targetAttr.array as Float32Array;
        const t = transitionRef.current;
        // Bake the interpolated value into a_zCurrent
        for (let i = 0; i < currentArr.length; i++) {
          currentArr[i] = currentArr[i] + (targetArr[i] - currentArr[i]) * t;
        }
        currentAttr.needsUpdate = true;

        // Update target array in-place with new values
        targetArr.set(currentTarget);
        targetAttr.needsUpdate = true;
      }

      prevTargetRef.current = currentTarget;
      transitionRef.current = 0;
    }

    // Animate transition via ref (no store updates per frame)
    if (transitionRef.current < 1) {
      transitionRef.current = Math.min(1, transitionRef.current + delta * 3.0);
    }
    mat.uniforms.u_transition.value = transitionRef.current;
  });

  if (!particleData) return null;

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export function ParticleViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 2], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#111111"]} />
        <ParticleCloud />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          minDistance={0.3}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
}
