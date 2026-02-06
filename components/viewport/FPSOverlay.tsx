"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * Place this component inside the R3F Canvas.
 * It updates a DOM element (#fps-display) directly from the render loop.
 */
export function FPSCounter() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;

    if (delta >= 500) {
      const fps = Math.round((frameCount.current / delta) * 1000);
      frameCount.current = 0;
      lastTime.current = now;

      const el = document.getElementById("fps-display");
      if (el) el.textContent = `${fps} FPS`;
    }
  });

  return null;
}

/**
 * HTML overlay element for FPS display. Place outside the Canvas.
 */
export function FPSDisplay() {
  return (
    <div
      id="fps-display"
      className="absolute top-2 right-2 z-10 rounded bg-black/60 px-2 py-1 text-xs font-mono text-zinc-400"
    >
      -- FPS
    </div>
  );
}
