"use client";

import { useRenderStore } from "@/store/render-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { STEP_COUNT_PRESETS } from "@/lib/constants";

export function OpacityStepControls() {
  const opacity = useRenderStore((s) => s.opacity);
  const stepCount = useRenderStore((s) => s.stepCount);
  const setOpacity = useRenderStore((s) => s.setOpacity);
  const setStepCount = useRenderStore((s) => s.setStepCount);

  return (
    <div className="space-y-3">
      <Label>Opacity & Quality</Label>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Opacity</span>
          <span className="text-xs text-zinc-400 font-mono">
            {opacity.toFixed(2)}
          </span>
        </div>
        <Slider
          value={[opacity]}
          onValueChange={([v]) => setOpacity(v)}
          min={0.01}
          max={2}
          step={0.01}
        />
      </div>
      <div className="space-y-2">
        <span className="text-xs text-zinc-500">Ray Steps</span>
        <div className="flex gap-1">
          {STEP_COUNT_PRESETS.map((p) => (
            <Button
              key={p.value}
              variant={stepCount === p.value ? "active" : "outline"}
              size="sm"
              onClick={() => setStepCount(p.value)}
              className="flex-1"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
