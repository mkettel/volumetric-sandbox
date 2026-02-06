"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useParticleStore, type ZMode } from "@/store/particle-store";
import { particleVertexShader } from "@/lib/shaders/particle.vert";
import { particleFragmentShader } from "@/lib/shaders/particle.frag";

function ParticleCloud() {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const prevModeRef = useRef<ZMode>("luminance");
  const transitionRef = useRef(1.0);
  const zTargetAttrRef = useRef<THREE.BufferAttribute | null>(null);

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
    const { positions, colors, zMaps, count } = particleData;

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("a_color", new THREE.BufferAttribute(colors, 3));

    const zMode = useParticleStore.getState().zMode;
    const targetZ = zMaps[zMode];

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
    prevModeRef.current = zMode;
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

    // Detect Z-mode change
    if (state.zMode !== prevModeRef.current) {
      // Copy current interpolated positions → a_zCurrent
      const currentAttr = geo.getAttribute("a_zCurrent") as THREE.BufferAttribute;
      const targetAttr = zTargetAttrRef.current;
      if (currentAttr && targetAttr) {
        const currentArr = currentAttr.array as Float32Array;
        const targetArr = targetAttr.array as Float32Array;
        const t = transitionRef.current;
        // Bake the interpolated value into current
        for (let i = 0; i < currentArr.length; i++) {
          currentArr[i] = currentArr[i] + (targetArr[i] - currentArr[i]) * t;
        }
        currentAttr.needsUpdate = true;

        // Update target array in-place with new mode's values
        const newTarget = particleData.zMaps[state.zMode];
        targetArr.set(newTarget);
        targetAttr.needsUpdate = true;
      }

      prevModeRef.current = state.zMode;
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
