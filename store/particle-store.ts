import { create } from "zustand";

export type BaseZMode = "flat" | "luminance" | "hue" | "saturation";
export type ZMode = BaseZMode | "depth";

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  zMaps: Record<BaseZMode, Float32Array>;
  count: number;
  imageWidth: number;
  imageHeight: number;
}

interface ParticleStoreState {
  particleData: ParticleData | null;
  sourceImage: HTMLImageElement | null;
  zMode: ZMode;
  pointSize: number;
  opacity: number;
  zScale: number;
  explode: number;
  depthMap: Float32Array | null;
  depthStatus: "idle" | "loading" | "ready" | "error";

  setParticleData: (data: ParticleData | null) => void;
  setSourceImage: (image: HTMLImageElement | null) => void;
  setZMode: (mode: ZMode) => void;
  setPointSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setZScale: (scale: number) => void;
  setExplode: (explode: number) => void;
  setDepthMap: (map: Float32Array) => void;
  setDepthStatus: (status: "idle" | "loading" | "ready" | "error") => void;
  reset: () => void;
}

export const useParticleStore = create<ParticleStoreState>((set) => ({
  particleData: null,
  sourceImage: null,
  zMode: "luminance",
  pointSize: 2.0,
  opacity: 0.85,
  zScale: 1.0,
  explode: 0.0,
  depthMap: null,
  depthStatus: "idle",

  setParticleData: (particleData) =>
    set({ particleData, depthMap: null, depthStatus: "idle" }),
  setSourceImage: (sourceImage) => set({ sourceImage }),
  setZMode: (zMode) => set({ zMode }),
  setPointSize: (pointSize) => set({ pointSize }),
  setOpacity: (opacity) => set({ opacity }),
  setZScale: (zScale) => set({ zScale }),
  setExplode: (explode) => set({ explode }),
  setDepthMap: (depthMap) => set({ depthMap, depthStatus: "ready" }),
  setDepthStatus: (depthStatus) => set({ depthStatus }),
  reset: () =>
    set({
      particleData: null,
      sourceImage: null,
      zMode: "luminance",
      pointSize: 2.0,
      opacity: 0.85,
      zScale: 1.0,
      explode: 0.0,
      depthMap: null,
      depthStatus: "idle",
    }),
}));
