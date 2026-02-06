import { create } from "zustand";

export interface SculptureData {
  colors: Float32Array;
  depthMap: Float32Array;
  imageWidth: number;
  imageHeight: number;
}

interface DepthStoreState {
  sculptureData: SculptureData | null;
  sourceImage: HTMLImageElement | null;
  depthStatus: "idle" | "loading" | "ready" | "error";
  renderMode: "points" | "mesh";
  depthScale: number;
  pointSize: number;
  opacity: number;
  wireframe: boolean;
  colorMode: "photo" | "depth";

  setSculptureData: (data: SculptureData | null) => void;
  setSourceImage: (image: HTMLImageElement | null) => void;
  setDepthStatus: (status: "idle" | "loading" | "ready" | "error") => void;
  setRenderMode: (mode: "points" | "mesh") => void;
  setDepthScale: (scale: number) => void;
  setPointSize: (size: number) => void;
  setOpacity: (opacity: number) => void;
  setWireframe: (wireframe: boolean) => void;
  setColorMode: (mode: "photo" | "depth") => void;
  reset: () => void;
}

export const useDepthStore = create<DepthStoreState>((set) => ({
  sculptureData: null,
  sourceImage: null,
  depthStatus: "idle",
  renderMode: "mesh",
  depthScale: 1.0,
  pointSize: 2.0,
  opacity: 0.85,
  wireframe: false,
  colorMode: "photo",

  setSculptureData: (sculptureData) => set({ sculptureData }),
  setSourceImage: (sourceImage) => set({ sourceImage }),
  setDepthStatus: (depthStatus) => set({ depthStatus }),
  setRenderMode: (renderMode) => set({ renderMode }),
  setDepthScale: (depthScale) => set({ depthScale }),
  setPointSize: (pointSize) => set({ pointSize }),
  setOpacity: (opacity) => set({ opacity }),
  setWireframe: (wireframe) => set({ wireframe }),
  setColorMode: (colorMode) => set({ colorMode }),
  reset: () =>
    set({
      sculptureData: null,
      sourceImage: null,
      depthStatus: "idle",
      renderMode: "mesh",
      depthScale: 1.0,
      pointSize: 2.0,
      opacity: 0.85,
      wireframe: false,
      colorMode: "photo",
    }),
}));
