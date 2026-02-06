"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/ui-store";
import { useRenderStore } from "@/store/render-store";

/**
 * Animates the slice plane position along Z when playing.
 * Advances position from 0→1 and wraps around.
 */
export function usePlayback() {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      const { isPlaying, playbackSpeed } = useUIStore.getState();

      if (isPlaying) {
        const dt = lastTimeRef.current ? (now - lastTimeRef.current) / 1000 : 0;
        lastTimeRef.current = now;

        const { slicePlane, setSlicePlane } = useRenderStore.getState();
        // Advance at speed: 1 full cycle in ~4 seconds at 1x speed
        const advance = dt * playbackSpeed * 0.25;
        let newPos = slicePlane.position + advance;
        if (newPos > 1) newPos -= 1;
        setSlicePlane({ position: newPos });
      } else {
        lastTimeRef.current = 0;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
}
