import { create } from "zustand";
import * as THREE from "three";

interface ReliefStoreState {
  sourceImage: HTMLImageElement | null;
  imageTexture: THREE.Texture | null;
  displacementScale: number;
  lightAzimuth: number;
  lightElevation: number;
  roughness: number;
  invert: boolean;
  subdivision: number;

  setSourceImage: (image: HTMLImageElement | null) => void;
  setImageTexture: (texture: THREE.Texture | null) => void;
  setDisplacementScale: (scale: number) => void;
  setLightAzimuth: (azimuth: number) => void;
  setLightElevation: (elevation: number) => void;
  setRoughness: (roughness: number) => void;
  setInvert: (invert: boolean) => void;
  setSubdivision: (subdivision: number) => void;
  reset: () => void;
}

export const useReliefStore = create<ReliefStoreState>((set, get) => ({
  sourceImage: null,
  imageTexture: null,
  displacementScale: 3.0,
  lightAzimuth: 135,
  lightElevation: 45,
  roughness: 0.8,
  invert: false,
  subdivision: 512,

  setSourceImage: (sourceImage) => set({ sourceImage }),

  setImageTexture: (imageTexture) => {
    const state = get();
    state.imageTexture?.dispose();
    set({ imageTexture });
  },

  setDisplacementScale: (displacementScale) => set({ displacementScale }),
  setLightAzimuth: (lightAzimuth) => set({ lightAzimuth }),
  setLightElevation: (lightElevation) => set({ lightElevation }),
  setRoughness: (roughness) => set({ roughness }),
  setInvert: (invert) => set({ invert }),
  setSubdivision: (subdivision) => set({ subdivision }),

  reset: () => {
    const state = get();
    state.imageTexture?.dispose();
    set({
      sourceImage: null,
      imageTexture: null,
      displacementScale: 3.0,
      lightAzimuth: 135,
      lightElevation: 45,
      roughness: 0.8,
      invert: false,
      subdivision: 512,
    });
  },
}));
