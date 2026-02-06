"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/ui-store";
import { useRenderStore } from "@/store/render-store";

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case "Space": {
          e.preventDefault();
          const { isPlaying, setPlaying } = useUIStore.getState();
          const { slicePlane, setSlicePlane } = useRenderStore.getState();
          if (!slicePlane.enabled) {
            setSlicePlane({ enabled: true, axis: 2 });
          }
          setPlaying(!isPlaying);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const { slicePlane, setSlicePlane } = useRenderStore.getState();
          if (slicePlane.enabled) {
            setSlicePlane({
              position: Math.min(1, slicePlane.position + 0.01),
            });
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const { slicePlane, setSlicePlane } = useRenderStore.getState();
          if (slicePlane.enabled) {
            setSlicePlane({
              position: Math.max(0, slicePlane.position - 0.01),
            });
          }
          break;
        }
        case "KeyR": {
          const { reset } = useRenderStore.getState();
          reset();
          break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
