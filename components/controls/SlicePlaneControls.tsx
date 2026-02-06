"use client";

import { useRenderStore } from "@/store/render-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const axes = ["X", "Y", "Z"];

export function SlicePlaneControls() {
  const slicePlane = useRenderStore((s) => s.slicePlane);
  const setSlicePlane = useRenderStore((s) => s.setSlicePlane);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Slice Plane</Label>
        <Button
          variant={slicePlane.enabled ? "active" : "outline"}
          size="sm"
          onClick={() => setSlicePlane({ enabled: !slicePlane.enabled })}
        >
          {slicePlane.enabled ? "On" : "Off"}
        </Button>
      </div>

      {slicePlane.enabled && (
        <>
          <div className="space-y-2">
            <span className="text-xs text-zinc-500">Axis</span>
            <div className="flex gap-1">
              {axes.map((a, i) => (
                <Button
                  key={a}
                  variant={slicePlane.axis === i ? "active" : "outline"}
                  size="sm"
                  onClick={() => setSlicePlane({ axis: i })}
                  className="flex-1"
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Position</span>
              <span className="text-xs text-zinc-400 font-mono">
                {slicePlane.position.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[slicePlane.position]}
              onValueChange={([v]) => setSlicePlane({ position: v })}
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">Thickness</span>
              <span className="text-xs text-zinc-400 font-mono">
                {slicePlane.thickness.toFixed(3)}
              </span>
            </div>
            <Slider
              value={[slicePlane.thickness]}
              onValueChange={([v]) => setSlicePlane({ thickness: v })}
              min={0.001}
              max={0.5}
              step={0.001}
            />
          </div>
        </>
      )}
    </div>
  );
}
