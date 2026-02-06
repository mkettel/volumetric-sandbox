"use client";

import { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useDepthStore, type SculptureData } from "@/store/depth-store";
import { particleVertexShader } from "@/lib/shaders/particle.vert";
import { particleFragmentShader } from "@/lib/shaders/particle.frag";
import { depthMeshVertexShader } from "@/lib/shaders/depth-mesh.vert";
import { depthMeshFragmentShader } from "@/lib/shaders/depth-mesh.frag";

function buildDepthColors(depthMap: Float32Array, count: number): Float32Array {
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = depthMap[i];
    // blue→red gradient
    colors[i * 3] = 0.1 + 0.9 * d;
    colors[i * 3 + 1] = 0.2 + 0.1 * d;
    colors[i * 3 + 2] = 0.8 - 0.7 * d;
  }
  return colors;
}

function DepthPointCloud({ data }: { data: SculptureData }) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

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

  useEffect(() => {
    if (!geometryRef.current) return;
    const geo = geometryRef.current;
    const { colors, depthMap, imageWidth, imageHeight } = data;
    const count = imageWidth * imageHeight;

    const positions = new Float32Array(count * 3);
    const aspect = imageWidth / imageHeight;
    const halfW = 0.5 * aspect;
    const halfH = 0.5;

    for (let i = 0; i < count; i++) {
      const px = i % imageWidth;
      const py = Math.floor(i / imageWidth);
      positions[i * 3] = (px / (imageWidth - 1)) * aspect - halfW;
      positions[i * 3 + 1] = (1 - py / (imageHeight - 1)) - halfH;
      positions[i * 3 + 2] = 0;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const state = useDepthStore.getState();
    const colorData =
      state.colorMode === "depth"
        ? buildDepthColors(depthMap, count)
        : new Float32Array(colors);
    geo.setAttribute("a_color", new THREE.BufferAttribute(colorData, 3));

    const zArr = new Float32Array(depthMap);
    geo.setAttribute("a_zCurrent", new THREE.BufferAttribute(zArr, 1));
    geo.setAttribute(
      "a_zTarget",
      new THREE.BufferAttribute(new Float32Array(depthMap), 1)
    );
    geo.setDrawRange(0, count);
  }, [data]);

  useFrame(() => {
    if (!materialRef.current || !geometryRef.current) return;
    const state = useDepthStore.getState();
    const mat = materialRef.current;

    mat.uniforms.u_pointSize.value = state.pointSize;
    mat.uniforms.u_zScale.value = state.depthScale;
    mat.uniforms.u_opacity.value = state.opacity;
    mat.depthWrite = true;

    // Update colors if colorMode changed
    const geo = geometryRef.current;
    const colorAttr = geo.getAttribute("a_color") as THREE.BufferAttribute;
    if (colorAttr) {
      const count = data.imageWidth * data.imageHeight;
      const expected =
        state.colorMode === "depth"
          ? buildDepthColors(data.depthMap, count)
          : data.colors;
      // Check first value to detect mode mismatch
      if (Math.abs((colorAttr.array as Float32Array)[0] - expected[0]) > 0.01) {
        const newColors =
          state.colorMode === "depth"
            ? buildDepthColors(data.depthMap, count)
            : new Float32Array(data.colors);
        geo.setAttribute("a_color", new THREE.BufferAttribute(newColors, 3));
      }
    }
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry ref={geometryRef} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={particleVertexShader}
        fragmentShader={particleFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite
      />
    </points>
  );
}

function DepthMesh({ data }: { data: SculptureData }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const prevColorModeRef = useRef<string | null>(null);

  const { imageWidth, imageHeight, colors, depthMap } = data;
  const aspect = imageWidth / imageHeight;

  const segments = useMemo(() => {
    const segW = Math.min(imageWidth, 512);
    const segH = Math.min(imageHeight, 512);
    return { w: segW, h: segH };
  }, [imageWidth, imageHeight]);

  const { colorTexture, depthTexture } = useMemo(() => {
    // Color texture: convert RGB to RGBA (WebGL2 doesn't support RGB+Float)
    const count = imageWidth * imageHeight;
    const rgba = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      rgba[i * 4] = colors[i * 3];
      rgba[i * 4 + 1] = colors[i * 3 + 1];
      rgba[i * 4 + 2] = colors[i * 3 + 2];
      rgba[i * 4 + 3] = 1.0;
    }
    const colorTex = new THREE.DataTexture(
      rgba,
      imageWidth,
      imageHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    colorTex.flipY = true;
    colorTex.needsUpdate = true;
    colorTex.minFilter = THREE.LinearFilter;
    colorTex.magFilter = THREE.LinearFilter;

    // Depth texture: single channel float
    const depthTex = new THREE.DataTexture(
      new Float32Array(depthMap),
      imageWidth,
      imageHeight,
      THREE.RedFormat,
      THREE.FloatType
    );
    depthTex.flipY = true;
    depthTex.needsUpdate = true;
    depthTex.minFilter = THREE.LinearFilter;
    depthTex.magFilter = THREE.LinearFilter;

    return { colorTexture: colorTex, depthTexture: depthTex };
  }, [colors, depthMap, imageWidth, imageHeight]);

  const uniforms = useMemo(
    () => ({
      u_colorMap: { value: colorTexture },
      u_depthMap: { value: depthTexture },
      u_depthScale: { value: 1.0 },
      u_opacity: { value: 0.85 },
      u_useDepthColor: { value: 0.0 },
    }),
    [colorTexture, depthTexture]
  );

  useFrame(() => {
    if (!materialRef.current) return;
    const state = useDepthStore.getState();
    const mat = materialRef.current;

    mat.uniforms.u_depthScale.value = state.depthScale;
    mat.uniforms.u_opacity.value = state.opacity;
    mat.uniforms.u_useDepthColor.value = state.colorMode === "depth" ? 1.0 : 0.0;
    mat.wireframe = state.wireframe;

    if (prevColorModeRef.current !== state.colorMode) {
      prevColorModeRef.current = state.colorMode;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[aspect, 1, segments.w, segments.h]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={depthMeshVertexShader}
        fragmentShader={depthMeshFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function DepthScene() {
  const sculptureData = useDepthStore((s) => s.sculptureData);
  const renderMode = useDepthStore((s) => s.renderMode);

  if (!sculptureData) return null;

  return renderMode === "points" ? (
    <DepthPointCloud data={sculptureData} />
  ) : (
    <DepthMesh data={sculptureData} />
  );
}

export function DepthViewport() {
  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.5, 2], fov: 50, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#111111"]} />
        <DepthScene />
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
