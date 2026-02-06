import type { Encoder, VolumeData, EncoderProgress } from "@/lib/volume/types";
import { buildData3DTexture } from "@/lib/volume/texture-builder";
import { VOLUME_LIMITS } from "@/lib/constants";

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Video seek failed"));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

function extractLuminanceFrame(
  video: HTMLVideoElement,
  canvas: OffscreenCanvas,
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
): Uint8Array {
  ctx.drawImage(video, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const luminance = new Uint8Array(width * height);

  // Flip Y: canvas origin is top-left, Data3DTexture expects bottom-left
  for (let row = 0; row < height; row++) {
    const srcRow = (height - 1 - row) * width;
    const dstRow = row * width;
    for (let col = 0; col < width; col++) {
      const srcIdx = (srcRow + col) * 4;
      const r = pixels[srcIdx];
      const g = pixels[srcIdx + 1];
      const b = pixels[srcIdx + 2];
      luminance[dstRow + col] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    }
  }

  return luminance;
}

export const videoEncoder: Encoder = {
  name: "video",

  async encode(
    source: unknown,
    onProgress?: (progress: EncoderProgress) => void
  ): Promise<VolumeData> {
    const file = source as File;
    if (!file || !(file instanceof File)) {
      throw new Error("Video encoder requires a File source");
    }

    const blobUrl = URL.createObjectURL(file);

    try {
      // Load video metadata
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = blobUrl;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () =>
          reject(new Error("Failed to load video. Check codec support."));
      });

      // Wait for video to be fully seekable
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }
        video.oncanplay = () => resolve();
      });

      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) {
        throw new Error("Invalid video duration");
      }

      // Calculate output dimensions
      const aspectRatio = video.videoWidth / video.videoHeight;
      let width = VOLUME_LIMITS.defaultWidth;
      let height = Math.round(width / aspectRatio);
      if (height > VOLUME_LIMITS.defaultHeight) {
        height = VOLUME_LIMITS.defaultHeight;
        width = Math.round(height * aspectRatio);
      }
      // Ensure even dimensions
      width = Math.min(width, VOLUME_LIMITS.maxWidth) & ~1;
      height = Math.min(height, VOLUME_LIMITS.maxHeight) & ~1;
      const depth = VOLUME_LIMITS.defaultDepth;

      const totalVoxels = width * height * depth;
      const data = new Uint8Array(totalVoxels);

      // Create offscreen canvas for frame extraction
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        throw new Error("Failed to create 2D rendering context");
      }

      // Extract frames at evenly spaced timestamps
      for (let z = 0; z < depth; z++) {
        const t = (z / (depth - 1)) * duration * 0.99; // slightly under duration
        await seekToTime(video, t);

        const frame = extractLuminanceFrame(video, canvas, ctx, width, height);

        // Copy frame into volume data
        const sliceOffset = z * width * height;
        data.set(frame, sliceOffset);

        if (onProgress && z % 4 === 0) {
          onProgress({
            current: z,
            total: depth,
            message: `Extracting frame ${z + 1}/${depth}`,
          });
          // Yield to main thread for UI updates
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      onProgress?.({
        current: depth,
        total: depth,
        message: "Building 3D texture...",
      });

      const texture = buildData3DTexture(data, width, height, depth);

      return {
        data,
        texture,
        metadata: {
          width,
          height,
          depth,
          sourceType: "video",
          sourceName: file.name,
          duration,
        },
      };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  },
};
