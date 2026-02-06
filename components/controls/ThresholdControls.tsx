"use client";

import { useRenderStore } from "@/store/render-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function ThresholdControls() {
  const thresholdMin = useRenderStore((s) => s.thresholdMin);
  const thresholdMax = useRenderStore((s) => s.thresholdMax);
  const setThreshold = useRenderStore((s) => s.setThreshold);

  return (
    <div className="space-y-3">
      <Label>Threshold</Label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Range</span>
          <span className="text-xs text-zinc-400 font-mono">
            {thresholdMin.toFixed(2)} - {thresholdMax.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[thresholdMin, thresholdMax]}
          onValueChange={([min, max]) => setThreshold(min, max)}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </div>
  );
}
