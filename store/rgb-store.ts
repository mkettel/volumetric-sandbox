import { create } from "zustand";
import * as THREE from "three";

export interface ChannelWindow {
  center: number;
  width: number;
}

interface RGBStoreState {
  sourceImage: HTMLImageElement | null;
  imageTexture: THREE.Texture | null;
  channelTextures: {
    r: THREE.DataTexture;
    g: THREE.DataTexture;
    b: THREE.DataTexture;
  } | null;
  separation: number;
  targetSeparation: number;
  isAnimating: boolean;
  opacity: number;
  channelVisibility: { r: boolean; g: boolean; b: boolean };
  channelWindows: { r: ChannelWindow; g: ChannelWindow; b: ChannelWindow };

  setSourceImage: (image: HTMLImageElement | null) => void;
  setTextures: (
    image: THREE.Texture,
    channels: { r: THREE.DataTexture; g: THREE.DataTexture; b: THREE.DataTexture }
  ) => void;
  setSeparation: (separation: number) => void;
  setTargetSeparation: (target: number) => void;
  setIsAnimating: (animating: boolean) => void;
  setOpacity: (opacity: number) => void;
  toggleMerge: () => void;
  setChannelVisibility: (channel: "r" | "g" | "b", visible: boolean) => void;
  setChannelWindow: (channel: "r" | "g" | "b", center: number, width: number) => void;
  reset: () => void;
}

export const useRGBStore = create<RGBStoreState>((set, get) => ({
  sourceImage: null,
  imageTexture: null,
  channelTextures: null,
  separation: 1,
  targetSeparation: 1,
  isAnimating: false,
  opacity: 0.85,
  channelVisibility: { r: true, g: true, b: true },
  channelWindows: {
    r: { center: 0.5, width: 1.0 },
    g: { center: 0.5, width: 1.0 },
    b: { center: 0.5, width: 1.0 },
  },

  setSourceImage: (sourceImage) => set({ sourceImage }),

  setTextures: (imageTexture, channelTextures) => {
    const state = get();
    // Dispose old textures
    state.imageTexture?.dispose();
    if (state.channelTextures) {
      state.channelTextures.r.dispose();
      state.channelTextures.g.dispose();
      state.channelTextures.b.dispose();
    }
    set({ imageTexture, channelTextures });
  },

  setSeparation: (separation) => set({ separation }),
  setTargetSeparation: (targetSeparation) => set({ targetSeparation }),
  setIsAnimating: (isAnimating) => set({ isAnimating }),
  setOpacity: (opacity) => set({ opacity }),

  toggleMerge: () => {
    const { separation } = get();
    const target = separation > 0.5 ? 0 : 1;
    set({ targetSeparation: target, isAnimating: true });
  },

  setChannelVisibility: (channel, visible) =>
    set((state) => ({
      channelVisibility: { ...state.channelVisibility, [channel]: visible },
    })),

  setChannelWindow: (channel, center, width) =>
    set((state) => ({
      channelWindows: {
        ...state.channelWindows,
        [channel]: { center, width },
      },
    })),

  reset: () => {
    const state = get();
    state.imageTexture?.dispose();
    if (state.channelTextures) {
      state.channelTextures.r.dispose();
      state.channelTextures.g.dispose();
      state.channelTextures.b.dispose();
    }
    set({
      sourceImage: null,
      imageTexture: null,
      channelTextures: null,
      separation: 1,
      targetSeparation: 1,
      isAnimating: false,
      opacity: 0.85,
      channelVisibility: { r: true, g: true, b: true },
      channelWindows: {
        r: { center: 0.5, width: 1.0 },
        g: { center: 0.5, width: 1.0 },
        b: { center: 0.5, width: 1.0 },
      },
    });
  },
}));
