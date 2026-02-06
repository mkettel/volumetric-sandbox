import { create } from "zustand";
import { DEFAULT_RENDER_PARAMS } from "@/lib/constants";
import { RenderMode, type RenderParams, type SlicePlane } from "@/lib/volume/types";

interface RenderStoreState extends RenderParams {
  setMode: (mode: RenderMode) => void;
  setWindow: (center: number, width: number) => void;
  setThreshold: (min: number, max: number) => void;
  setOpacity: (opacity: number) => void;
  setStepCount: (stepCount: number) => void;
  setSlicePlane: (slice: Partial<SlicePlane>) => void;
  setTransferFunction: (name: string) => void;
  reset: () => void;
}

export const useRenderStore = create<RenderStoreState>((set, get) => ({
  ...DEFAULT_RENDER_PARAMS,

  setMode: (mode) => set({ mode }),

  setWindow: (windowCenter, windowWidth) =>
    set({ windowCenter, windowWidth }),

  setThreshold: (thresholdMin, thresholdMax) =>
    set({ thresholdMin, thresholdMax }),

  setOpacity: (opacity) => set({ opacity }),

  setStepCount: (stepCount) => set({ stepCount }),

  setSlicePlane: (partial) =>
    set({ slicePlane: { ...get().slicePlane, ...partial } }),

  setTransferFunction: (transferFunction) => set({ transferFunction }),

  reset: () => set({ ...DEFAULT_RENDER_PARAMS }),
}));
