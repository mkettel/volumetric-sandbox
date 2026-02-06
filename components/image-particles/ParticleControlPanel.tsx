"use client";

import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useParticleStore, type ZMode } from "@/store/particle-store";
import { encodeImageToParticles } from "@/lib/encoders/particle-encoder";
import { estimateDepth } from "@/lib/encoders/depth-encoder";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

const Z_MODES: { id: ZMode; label: string }[] = [
  { id: "flat", label: "Flat" },
  { id: "luminance", label: "Luminance" },
  { id: "hue", label: "Hue" },
  { id: "saturation", label: "Saturation" },
  { id: "depth", label: "Depth" },
];

export function ParticleControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const sourceImage = useParticleStore((s) => s.sourceImage);
  const zMode = useParticleStore((s) => s.zMode);
  const pointSize = useParticleStore((s) => s.pointSize);
  const opacity = useParticleStore((s) => s.opacity);
  const zScale = useParticleStore((s) => s.zScale);
  const explode = useParticleStore((s) => s.explode);
  const particleData = useParticleStore((s) => s.particleData);
  const depthStatus = useParticleStore((s) => s.depthStatus);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    fileRef.current = file;
    setLoading(true);
    try {
      const { image, data } = await encodeImageToParticles(file);
      useParticleStore.getState().setSourceImage(image);
      useParticleStore.getState().setParticleData(data);

      // Start depth estimation in background
      useParticleStore.getState().setDepthStatus("loading");
      estimateDepth(file, data.imageWidth, data.imageHeight)
        .then((depthMap) => {
          useParticleStore.getState().setDepthMap(depthMap);
        })
        .catch((err) => {
          console.error("Depth estimation failed:", err);
          useParticleStore.getState().setDepthStatus("error");
        });
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

  const getDepthLabel = () => {
    if (depthStatus === "loading") return "Depth...";
    if (depthStatus === "error") return "Depth (!)";
    return "Depth";
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-semibold text-zinc-200">Image Particles</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Every pixel becomes a 3D particle
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

          {/* Z-Mode */}
          <div className="space-y-3">
            <Label>Z-Mode</Label>
            <div className="flex flex-wrap gap-2">
              {Z_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => useParticleStore.getState().setZMode(mode.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    zMode === mode.id
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {mode.id === "depth" ? getDepthLabel() : mode.label}
                </button>
              ))}
            </div>
            {depthStatus === "loading" && (
              <p className="text-[10px] text-zinc-500">
                Estimating depth (first run downloads ~25MB model)...
              </p>
            )}
            {depthStatus === "error" && (
              <p className="text-[10px] text-red-400">
                Depth estimation failed
              </p>
            )}
          </div>

          <Separator />

          {/* Point Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Point Size</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {pointSize.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[pointSize]}
              min={0.5}
              max={8}
              step={0.1}
              onValueChange={([v]) => useParticleStore.getState().setPointSize(v)}
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
              onValueChange={([v]) => useParticleStore.getState().setOpacity(v)}
            />
          </div>

          <Separator />

          {/* Z Scale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Z Scale</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {zScale.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[zScale]}
              min={0}
              max={3}
              step={0.01}
              onValueChange={([v]) => useParticleStore.getState().setZScale(v)}
            />
          </div>

          <Separator />

          {/* Explode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Explode</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {explode.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[explode]}
              min={0}
              max={2}
              step={0.01}
              onValueChange={([v]) => useParticleStore.getState().setExplode(v)}
            />
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-2">
            <Label>Info</Label>
            {particleData && (
              <p className="text-[10px] text-zinc-500 font-mono">
                {particleData.count.toLocaleString()} particles
                ({particleData.imageWidth} x {particleData.imageHeight})
              </p>
            )}
          </div>

          <Separator />

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => useParticleStore.getState().reset()}
          >
            Reset
          </Button>
        </>
      )}
    </div>
  );
}
