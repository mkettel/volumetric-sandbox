"use client";

import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSegmentationStore } from "@/store/segmentation-store";
import { encodeSegmentation } from "@/lib/encoders/segmentation-encoder";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

export function LayersControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const sourceImage = useSegmentationStore((s) => s.sourceImage);
  const layers = useSegmentationStore((s) => s.layers);
  const segmentStatus = useSegmentationStore((s) => s.segmentStatus);
  const separation = useSegmentationStore((s) => s.separation);
  const opacity = useSegmentationStore((s) => s.opacity);
  const isAnimating = useSegmentationStore((s) => s.isAnimating);
  const visibility = useSegmentationStore((s) => s.layerVisibility);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    useSegmentationStore.getState().setSegmentStatus("loading");
    try {
      const { image, layers } = await encodeSegmentation(file);
      useSegmentationStore.getState().setSourceImage(image);
      useSegmentationStore.getState().setLayers(layers);
    } catch {
      useSegmentationStore.getState().setSegmentStatus("error");
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

  const loading = segmentStatus === "loading";
  const totalPixels = sourceImage
    ? sourceImage.width * sourceImage.height
    : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-semibold text-zinc-200">Photo Layers</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Segment &amp; explode into 3D layers
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
          {loading ? "Segmenting..." : "Choose Image"}
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
          {loading
            ? "Segmenting image... (model downloads on first use)"
            : "Drop image file here"}
        </div>
      </div>

      {segmentStatus === "error" && (
        <p className="text-xs text-red-400">
          Segmentation failed. Try a different image.
        </p>
      )}

      {layers && sourceImage && (
        <>
          <Separator />

          {/* Merge / Split */}
          <div className="space-y-3">
            <Label>Merge / Split</Label>
            <Button
              variant={separation > 0.5 ? "active" : "outline"}
              size="sm"
              onClick={() => useSegmentationStore.getState().toggleMerge()}
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
                useSegmentationStore.getState().setSeparation(v);
                useSegmentationStore.getState().setTargetSeparation(v);
                useSegmentationStore.getState().setIsAnimating(false);
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
              onValueChange={([v]) =>
                useSegmentationStore.getState().setOpacity(v)
              }
            />
          </div>

          <Separator />

          {/* Layer Visibility */}
          <div className="space-y-3">
            <Label>Layers ({layers.length})</Label>
            <div className="space-y-1">
              {layers.map((layer) => {
                const pct = ((layer.pixelCount / totalPixels) * 100).toFixed(1);
                const isVisible = visibility[layer.label] !== false;
                return (
                  <button
                    key={layer.label}
                    onClick={() =>
                      useSegmentationStore
                        .getState()
                        .setLayerVisibility(layer.label, !isVisible)
                    }
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                      isVisible
                        ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        : "bg-zinc-900 text-zinc-600 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="truncate">{layer.label}</span>
                    <span className="ml-2 shrink-0 text-[10px] text-zinc-500 font-mono">
                      {pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-1">
            <Label>Info</Label>
            <p className="text-[10px] text-zinc-500">
              {sourceImage.width} x {sourceImage.height} &middot;{" "}
              {layers.length} layers
            </p>
          </div>

          <Separator />

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => useSegmentationStore.getState().reset()}
          >
            Reset
          </Button>
        </>
      )}
    </div>
  );
}
