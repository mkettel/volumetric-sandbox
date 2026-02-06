import { create } from "zustand";

export type ZMode = "flat" | "luminance" | "hue" | "saturation";

export interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  zMaps: Record<ZMode, Float32Array>;
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

  setParticleData: (data: ParticleData | null) => void;
  setSourceImage: (image: HTMLImageElement | null) => void;
  setZMode: (mode: ZMode) => void;
  setPointSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setZScale: (scale: number) => void;
  setExplode: (explode: number) => void;
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

  setParticleData: (particleData) => set({ particleData }),
  setSourceImage: (sourceImage) => set({ sourceImage }),
  setZMode: (zMode) => set({ zMode }),
  setPointSize: (pointSize) => set({ pointSize }),
  setOpacity: (opacity) => set({ opacity }),
  setZScale: (zScale) => set({ zScale }),
  setExplode: (explode) => set({ explode }),
  reset: () =>
    set({
      particleData: null,
      sourceImage: null,
      zMode: "luminance",
      pointSize: 2.0,
      opacity: 0.85,
      zScale: 1.0,
      explode: 0.0,
    }),
}));
