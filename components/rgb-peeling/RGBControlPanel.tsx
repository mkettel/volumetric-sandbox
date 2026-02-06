"use client";

import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useRGBStore } from "@/store/rgb-store";
import { encodeImageToChannels } from "@/lib/encoders/rgb-encoder";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

export function RGBControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const sourceImage = useRGBStore((s) => s.sourceImage);
  const separation = useRGBStore((s) => s.separation);
  const opacity = useRGBStore((s) => s.opacity);
  const visibility = useRGBStore((s) => s.channelVisibility);
  const channelWindows = useRGBStore((s) => s.channelWindows);
  const isAnimating = useRGBStore((s) => s.isAnimating);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setLoading(true);
    try {
      const { imageTexture, channelTextures } = await encodeImageToChannels(file);

      // Load the image element for display reference
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      useRGBStore.getState().setTextures(imageTexture, channelTextures);
      useRGBStore.getState().setSourceImage(img);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageFile(file);
      e.target.value = "";
    },
    [handleImageFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-semibold text-zinc-200">RGB Peeling</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Separate an image into R, G, B channels
        </p>
      </div>

      <Separator />

      {/* Image Source */}
      <div className="space-y-3">
        <Label>Image Source</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Choose Image"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`flex items-center justify-center rounded-md border border-dashed p-4 text-xs text-zinc-500 transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-500/10 text-blue-400"
              : "border-zinc-700"
          }`}
        >
          {loading ? "Processing..." : "Drop image file here"}
        </div>
      </div>

      {sourceImage && (
        <>
          <Separator />

          {/* Merge / Split */}
          <div className="space-y-3">
            <Label>Merge / Split</Label>
            <Button
              variant={separation > 0.5 ? "active" : "outline"}
              size="sm"
              onClick={() => useRGBStore.getState().toggleMerge()}
              disabled={isAnimating}
            >
              {separation > 0.5 ? "Merge" : "Split"}
            </Button>
          </div>

          <Separator />

          {/* Separation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Separation</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {separation.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[separation]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => {
                useRGBStore.getState().setSeparation(v);
                useRGBStore.getState().setTargetSeparation(v);
                useRGBStore.getState().setIsAnimating(false);
              }}
            />
          </div>

          <Separator />

          {/* Opacity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Opacity</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {opacity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[opacity]}
              min={0.1}
              max={1}
              step={0.01}
              onValueChange={([v]) => useRGBStore.getState().setOpacity(v)}
            />
          </div>

          <Separator />

          {/* Channel Visibility */}
          <div className="space-y-3">
            <Label>Channels</Label>
            <div className="flex gap-2">
              {(["r", "g", "b"] as const).map((ch) => {
                const colors = {
                  r: { active: "bg-red-600 text-white hover:bg-red-700", label: "R" },
                  g: { active: "bg-green-600 text-white hover:bg-green-700", label: "G" },
                  b: { active: "bg-blue-600 text-white hover:bg-blue-700", label: "B" },
                };
                const isVisible = visibility[ch];
                return (
                  <button
                    key={ch}
                    onClick={() =>
                      useRGBStore.getState().setChannelVisibility(ch, !isVisible)
                    }
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      isVisible
                        ? colors[ch].active
                        : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                    }`}
                  >
                    {colors[ch].label}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Per-Channel Windowing */}
          <div className="space-y-3">
            <Label>Channel Windowing</Label>
            {(["r", "g", "b"] as const).map((ch) => {
              const labels = { r: "Red", g: "Green", b: "Blue" };
              const accentColors = {
                r: "text-red-400",
                g: "text-green-400",
                b: "text-blue-400",
              };
              const win = channelWindows[ch];
              return (
                <div key={ch} className="space-y-2">
                  <span className={`text-[10px] font-medium ${accentColors[ch]}`}>
                    {labels[ch]}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Center</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {win.center.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[win.center]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([v]) =>
                        useRGBStore
                          .getState()
                          .setChannelWindow(ch, v, win.width)
                      }
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Width</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {win.width.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[win.width]}
                      min={0.01}
                      max={2}
                      step={0.01}
                      onValueChange={([v]) =>
                        useRGBStore
                          .getState()
                          .setChannelWindow(ch, win.center, v)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
