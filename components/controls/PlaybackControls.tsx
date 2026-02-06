"use client";

import { useRenderStore } from "@/store/render-store";
import { useUIStore } from "@/store/ui-store";
import { useVolumeStore } from "@/store/volume-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const speeds = [0.25, 0.5, 1, 2];

export function PlaybackControls() {
  const volume = useVolumeStore((s) => s.currentVolume);
  const isPlaying = useUIStore((s) => s.isPlaying);
  const playbackSpeed = useUIStore((s) => s.playbackSpeed);
  const setPlaying = useUIStore((s) => s.setPlaying);
  const setPlaybackSpeed = useUIStore((s) => s.setPlaybackSpeed);
  const slicePlane = useRenderStore((s) => s.slicePlane);
  const setSlicePlane = useRenderStore((s) => s.setSlicePlane);

  // Only show for time-based sources
  if (!volume?.metadata.duration) return null;

  return (
    <div className="space-y-3">
      <Label>Playback</Label>
      <div className="flex items-center gap-2">
        <Button
          variant={isPlaying ? "active" : "outline"}
          size="sm"
          onClick={() => {
            // Enable slice plane on Z axis for playback
            if (!slicePlane.enabled) {
              setSlicePlane({ enabled: true, axis: 2 });
            }
            setPlaying(!isPlaying);
          }}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button>
        {speeds.map((s) => (
          <Button
            key={s}
            variant={playbackSpeed === s ? "active" : "ghost"}
            size="sm"
            onClick={() => setPlaybackSpeed(s)}
          >
            {s}x
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Time Scrub</span>
          <span className="text-xs text-zinc-400 font-mono">
            {(slicePlane.position * (volume.metadata.duration ?? 0)).toFixed(1)}s
          </span>
        </div>
        <Slider
          value={[slicePlane.position]}
          onValueChange={([v]) => {
            if (!slicePlane.enabled) {
              setSlicePlane({ enabled: true, axis: 2 });
            }
            setSlicePlane({ position: v });
          }}
          min={0}
          max={1}
          step={0.005}
        />
      </div>
    </div>
  );
}
