"use client";

import { useRenderStore } from "@/store/render-store";
import { RenderMode } from "@/lib/volume/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const modes = [
  { label: "DVR", value: RenderMode.DVR },
  { label: "MIP", value: RenderMode.MIP },
  { label: "Slice", value: RenderMode.Slice },
];

export function RenderModeControls() {
  const mode = useRenderStore((s) => s.mode);
  const setMode = useRenderStore((s) => s.setMode);

  return (
    <div className="space-y-2">
      <Label>Render Mode</Label>
      <div className="flex gap-1">
        {modes.map((m) => (
          <Button
            key={m.value}
            variant={mode === m.value ? "active" : "outline"}
            size="sm"
            onClick={() => setMode(m.value)}
            className="flex-1"
          >
            {m.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
