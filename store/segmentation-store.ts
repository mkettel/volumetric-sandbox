import { create } from "zustand";
import * as THREE from "three";

export interface SegmentLayer {
  label: string;
  texture: THREE.DataTexture;
  pixelCount: number;
}

interface SegmentationStoreState {
  layers: SegmentLayer[] | null;
  sourceImage: HTMLImageElement | null;
  segmentStatus: "idle" | "loading" | "ready" | "error";
  separation: number;
  targetSeparation: number;
  isAnimating: boolean;
  opacity: number;
  layerVisibility: Record<string, boolean>;

  setLayers: (layers: SegmentLayer[]) => void;
  setSourceImage: (image: HTMLImageElement | null) => void;
  setSegmentStatus: (status: "idle" | "loading" | "ready" | "error") => void;
  setSeparation: (separation: number) => void;
  setTargetSeparation: (target: number) => void;
  setIsAnimating: (animating: boolean) => void;
  setOpacity: (opacity: number) => void;
  toggleMerge: () => void;
  setLayerVisibility: (label: string, visible: boolean) => void;
  reset: () => void;
}

export const useSegmentationStore = create<SegmentationStoreState>(
  (set, get) => ({
    layers: null,
    sourceImage: null,
    segmentStatus: "idle",
    separation: 1,
    targetSeparation: 1,
    isAnimating: false,
    opacity: 0.85,
    layerVisibility: {},

    setLayers: (layers) => {
      const state = get();
      // Dispose old textures
      if (state.layers) {
        for (const layer of state.layers) {
          layer.texture.dispose();
        }
      }
      // Build visibility map (all visible initially)
      const layerVisibility: Record<string, boolean> = {};
      for (const layer of layers) {
        layerVisibility[layer.label] = true;
      }
      set({ layers, layerVisibility, segmentStatus: "ready" });
    },

    setSourceImage: (sourceImage) => set({ sourceImage }),
    setSegmentStatus: (segmentStatus) => set({ segmentStatus }),
    setSeparation: (separation) => set({ separation }),
    setTargetSeparation: (targetSeparation) => set({ targetSeparation }),
    setIsAnimating: (isAnimating) => set({ isAnimating }),
    setOpacity: (opacity) => set({ opacity }),

    toggleMerge: () => {
      const { separation } = get();
      const target = separation > 0.5 ? 0 : 1;
      set({ targetSeparation: target, isAnimating: true });
    },

    setLayerVisibility: (label, visible) =>
      set((state) => ({
        layerVisibility: { ...state.layerVisibility, [label]: visible },
      })),

    reset: () => {
      const state = get();
      if (state.layers) {
        for (const layer of state.layers) {
          layer.texture.dispose();
        }
      }
      set({
        layers: null,
        sourceImage: null,
        segmentStatus: "idle",
        separation: 1,
        targetSeparation: 1,
        isAnimating: false,
        opacity: 0.85,
        layerVisibility: {},
      });
    },
  })
);
