"use client";

import { SourceSelector } from "@/components/playground/SourceSelector";
import { RenderModeControls } from "./RenderModeControls";
import { WindowControls } from "./WindowControls";
import { ThresholdControls } from "./ThresholdControls";
import { SlicePlaneControls } from "./SlicePlaneControls";
import { OpacityStepControls } from "./OpacityStepControls";
import { TransferFunctionControls } from "./TransferFunctionControls";
import { PlaybackControls } from "./PlaybackControls";
import { useVolumeStore } from "@/store/volume-store";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

export function ControlPanel() {
  const volume = useVolumeStore((s) => s.currentVolume);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-semibold text-zinc-200">
          Volumetric Playground
        </h1>
        {volume && (
          <p className="text-xs text-zinc-500 mt-1">
            {volume.metadata.sourceName} &mdash;{" "}
            {volume.metadata.width}&times;{volume.metadata.height}&times;
            {volume.metadata.depth}
          </p>
        )}
      </div>

      <Separator />
      <SourceSelector />
      <Separator />
      <RenderModeControls />
      <Separator />
      <TransferFunctionControls />
      <Separator />
      <WindowControls />
      <Separator />
      <ThresholdControls />
      <Separator />
      <OpacityStepControls />
      <Separator />
      <SlicePlaneControls />
      <Separator />
      <PlaybackControls />
    </div>
  );
}
