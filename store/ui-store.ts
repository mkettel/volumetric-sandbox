import { create } from "zustand";
import type { EncoderProgress } from "@/lib/volume/types";

type SourceType = "noise" | "video";

interface UIStoreState {
  selectedSource: SourceType;
  isEncoding: boolean;
  encodingProgress: EncoderProgress | null;
  isPlaying: boolean;
  playbackSpeed: number;

  setSelectedSource: (source: SourceType) => void;
  setEncoding: (encoding: boolean) => void;
  setEncodingProgress: (progress: EncoderProgress | null) => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  selectedSource: "noise",
  isEncoding: false,
  encodingProgress: null,
  isPlaying: false,
  playbackSpeed: 1.0,

  setSelectedSource: (selectedSource) => set({ selectedSource }),
  setEncoding: (isEncoding) => set({ isEncoding }),
  setEncodingProgress: (encodingProgress) => set({ encodingProgress }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
