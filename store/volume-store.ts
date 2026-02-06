import { create } from "zustand";
import type { VolumeData } from "@/lib/volume/types";

interface VolumeStoreState {
  currentVolume: VolumeData | null;
  setCurrentVolume: (volume: VolumeData | null) => void;
}

export const useVolumeStore = create<VolumeStoreState>((set, get) => ({
  currentVolume: null,
  setCurrentVolume: (volume) => {
    const prev = get().currentVolume;
    if (prev && prev.texture) {
      prev.texture.dispose();
    }
    set({ currentVolume: volume });
  },
}));
