import { create } from "zustand";

export type ColorMode = "frequency" | "amplitude";

export interface AudioData {
  positions: Float32Array;
  frequencyColors: Float32Array;
  amplitudeColors: Float32Array;
  count: number;
  duration: number;
  frequencyBins: number;
  timeSlices: number;
}

interface AudioStoreState {
  audioData: AudioData | null;
  sourceFile: File | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  pointSize: number;
  opacity: number;
  yScale: number;
  colorMode: ColorMode;

  setAudioData: (data: AudioData | null) => void;
  setSourceFile: (file: File | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setPointSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setYScale: (scale: number) => void;
  setColorMode: (mode: ColorMode) => void;
  reset: () => void;
}

export const useAudioStore = create<AudioStoreState>((set) => ({
  audioData: null,
  sourceFile: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  pointSize: 2.0,
  opacity: 0.85,
  yScale: 1.5,
  colorMode: "frequency",

  setAudioData: (audioData) => set({ audioData }),
  setSourceFile: (sourceFile) => set({ sourceFile }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setPointSize: (pointSize) => set({ pointSize }),
  setOpacity: (opacity) => set({ opacity }),
  setYScale: (yScale) => set({ yScale }),
  setColorMode: (colorMode) => set({ colorMode }),
  reset: () =>
    set({
      audioData: null,
      sourceFile: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      pointSize: 2.0,
      opacity: 0.85,
      yScale: 1.5,
      colorMode: "frequency",
    }),
}));
