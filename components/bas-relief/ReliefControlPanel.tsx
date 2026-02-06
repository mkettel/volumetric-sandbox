"use client";

import { useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useReliefStore } from "@/store/relief-store";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export function ReliefControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const sourceImage = useReliefStore((s) => s.sourceImage);
  const displacementScale = useReliefStore((s) => s.displacementScale);
  const lightAzimuth = useReliefStore((s) => s.lightAzimuth);
  const lightElevation = useReliefStore((s) => s.lightElevation);
  const roughness = useReliefStore((s) => s.roughness);
  const invert = useReliefStore((s) => s.invert);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    try {
      const img = await loadImage(file);
      const texture = new THREE.Texture(img);
      texture.flipY = true;
      texture.needsUpdate = true;

      useReliefStore.getState().setImageTexture(texture);
      useReliefStore.getState().setSourceImage(img);
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
        <h1 className="text-sm font-semibold text-zinc-200">Bas Relief</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Convert photos into sculpted plaster
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

          {/* Relief Depth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Relief Depth</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {displacementScale.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[displacementScale]}
              min={0}
              max={10}
              step={0.1}
              onValueChange={([v]) =>
                useReliefStore.getState().setDisplacementScale(v)
              }
            />
          </div>

          <Separator />

          {/* Light Azimuth */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Light Angle</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {lightAzimuth.toFixed(0)}°
              </span>
            </div>
            <Slider
              value={[lightAzimuth]}
              min={0}
              max={360}
              step={1}
              onValueChange={([v]) =>
                useReliefStore.getState().setLightAzimuth(v)
              }
            />
          </div>

          {/* Light Elevation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Light Elevation</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {lightElevation.toFixed(0)}°
              </span>
            </div>
            <Slider
              value={[lightElevation]}
              min={5}
              max={85}
              step={1}
              onValueChange={([v]) =>
                useReliefStore.getState().setLightElevation(v)
              }
            />
          </div>

          <Separator />

          {/* Roughness */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Roughness</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {roughness.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[roughness]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) =>
                useReliefStore.getState().setRoughness(v)
              }
            />
          </div>

          <Separator />

          {/* Invert */}
          <div className="space-y-3">
            <Label>Style</Label>
            <div className="flex gap-2">
              <button
                onClick={() => useReliefStore.getState().setInvert(false)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  !invert
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                }`}
              >
                Raised
              </button>
              <button
                onClick={() => useReliefStore.getState().setInvert(true)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  invert
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                }`}
              >
                Recessed
              </button>
            </div>
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-1">
            <Label>Info</Label>
            <p className="text-[10px] text-zinc-500">
              {sourceImage.width} x {sourceImage.height}
            </p>
          </div>

          <Separator />

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => useReliefStore.getState().reset()}
          >
            Reset
          </Button>
        </>
      )}
    </div>
  );
}
