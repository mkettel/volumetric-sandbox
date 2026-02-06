import * as THREE from "three";

export interface VolumeMetadata {
  width: number;
  height: number;
  depth: number;
  sourceType: "video" | "noise" | "image" | "audio";
  sourceName: string;
  /** Duration in seconds for time-based sources */
  duration?: number;
}

export interface VolumeData {
  /** Raw scalar field, one byte per voxel */
  data: Uint8Array;
  /** GPU-ready 3D texture */
  texture: THREE.Data3DTexture;
  metadata: VolumeMetadata;
}

export enum RenderMode {
  DVR = 0,
  MIP = 1,
  Slice = 2,
}

export interface SlicePlane {
  enabled: boolean;
  /** Normal axis: 0=X, 1=Y, 2=Z */
  axis: number;
  /** Position along the axis, normalized 0..1 */
  position: number;
  /** Slice thickness in normalized coords */
  thickness: number;
}

export interface RenderParams {
  mode: RenderMode;
  windowCenter: number;
  windowWidth: number;
  thresholdMin: number;
  thresholdMax: number;
  opacity: number;
  stepCount: number;
  slicePlane: SlicePlane;
  transferFunction: string;
}

export interface EncoderProgress {
  current: number;
  total: number;
  message: string;
}

export interface Encoder {
  name: string;
  encode(
    source: unknown,
    onProgress?: (progress: EncoderProgress) => void
  ): Promise<VolumeData>;
}
