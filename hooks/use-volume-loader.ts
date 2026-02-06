"use client";

import { useCallback } from "react";
import { useVolumeStore } from "@/store/volume-store";
import { useUIStore } from "@/store/ui-store";
import { noiseEncoder } from "@/lib/encoders/noise-encoder";
import { videoEncoder } from "@/lib/encoders/video-encoder";
import type { Encoder, EncoderProgress } from "@/lib/volume/types";

const encoders: Record<string, Encoder> = {
  noise: noiseEncoder,
  video: videoEncoder,
};

export function useVolumeLoader() {
  const setCurrentVolume = useVolumeStore((s) => s.setCurrentVolume);
  const setEncoding = useUIStore((s) => s.setEncoding);
  const setEncodingProgress = useUIStore((s) => s.setEncodingProgress);

  const loadVolume = useCallback(
    async (encoderName: string, source?: unknown) => {
      const encoder = encoders[encoderName];
      if (!encoder) {
        console.error(`Unknown encoder: ${encoderName}`);
        return;
      }

      setEncoding(true);
      setEncodingProgress(null);

      try {
        const volume = await encoder.encode(
          source,
          (progress: EncoderProgress) => {
            setEncodingProgress(progress);
          }
        );
        setCurrentVolume(volume);
      } catch (err) {
        console.error("Encoding failed:", err);
      } finally {
        setEncoding(false);
        setEncodingProgress(null);
      }
    },
    [setCurrentVolume, setEncoding, setEncodingProgress]
  );

  const registerEncoder = useCallback((encoder: Encoder) => {
    encoders[encoder.name] = encoder;
  }, []);

  return { loadVolume, registerEncoder };
}
