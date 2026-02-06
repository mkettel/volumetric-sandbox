"use client";

import { useRenderStore } from "@/store/render-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function WindowControls() {
  const windowCenter = useRenderStore((s) => s.windowCenter);
  const windowWidth = useRenderStore((s) => s.windowWidth);
  const setWindow = useRenderStore((s) => s.setWindow);

  return (
    <div className="space-y-3">
      <Label>Windowing</Label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Center</span>
          <span className="text-xs text-zinc-400 font-mono">
            {windowCenter.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[windowCenter]}
          onValueChange={([v]) => setWindow(v, windowWidth)}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Width</span>
          <span className="text-xs text-zinc-400 font-mono">
            {windowWidth.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[windowWidth]}
          onValueChange={([v]) => setWindow(windowCenter, v)}
          min={0.01}
          max={2}
          step={0.01}
        />
      </div>
    </div>
  );
}
