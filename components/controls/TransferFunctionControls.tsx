"use client";

import { useRenderStore } from "@/store/render-store";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TRANSFER_FUNCTION_NAMES } from "@/lib/constants";

export function TransferFunctionControls() {
  const current = useRenderStore((s) => s.transferFunction);
  const setTf = useRenderStore((s) => s.setTransferFunction);

  return (
    <div className="space-y-2">
      <Label>Color Map</Label>
      <div className="flex flex-wrap gap-1">
        {TRANSFER_FUNCTION_NAMES.map((name) => (
          <Button
            key={name}
            variant={current === name ? "active" : "outline"}
            size="sm"
            onClick={() => setTf(name)}
          >
            {name}
          </Button>
        ))}
      </div>
    </div>
  );
}
