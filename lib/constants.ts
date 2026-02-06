import { RenderMode, type RenderParams, type SlicePlane } from "./volume/types";

export const DEFAULT_SLICE_PLANE: SlicePlane = {
  enabled: false,
  axis: 2, // Z axis
  position: 0.5,
  thickness: 0.01,
};

export const DEFAULT_RENDER_PARAMS: RenderParams = {
  mode: RenderMode.DVR,
  windowCenter: 0.5,
  windowWidth: 1.0,
  thresholdMin: 0.0,
  thresholdMax: 1.0,
  opacity: 1.0,
  stepCount: 128,
  slicePlane: { ...DEFAULT_SLICE_PLANE },
  transferFunction: "grayscale",
};

export const VOLUME_LIMITS = {
  maxWidth: 512,
  maxHeight: 512,
  maxDepth: 256,
  defaultWidth: 256,
  defaultHeight: 256,
  defaultDepth: 128,
  /** Max GPU memory for volume in bytes */
  maxBytes: 64 * 1024 * 1024, // 64MB
};

export const STEP_COUNT_PRESETS = [
  { label: "Fast", value: 64 },
  { label: "Medium", value: 128 },
  { label: "High", value: 256 },
  { label: "Ultra", value: 512 },
];

export const TRANSFER_FUNCTION_NAMES = [
  "grayscale",
  "heat",
  "viridis",
  "cool",
  "bone",
] as const;
