"use client";

import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDepthStore } from "@/store/depth-store";
import { encodeDepthSculpture } from "@/lib/encoders/depth-sculpture-encoder";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

export function DepthControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const sourceImage = useDepthStore((s) => s.sourceImage);
  const sculptureData = useDepthStore((s) => s.sculptureData);
  const depthStatus = useDepthStore((s) => s.depthStatus);
  const renderMode = useDepthStore((s) => s.renderMode);
  const depthScale = useDepthStore((s) => s.depthScale);
  const pointSize = useDepthStore((s) => s.pointSize);
  const opacity = useDepthStore((s) => s.opacity);
  const wireframe = useDepthStore((s) => s.wireframe);
  const colorMode = useDepthStore((s) => s.colorMode);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    useDepthStore.getState().setDepthStatus("loading");
    try {
      const { image, data } = await encodeDepthSculpture(file);
      useDepthStore.getState().setSourceImage(image);
      useDepthStore.getState().setSculptureData(data);
      useDepthStore.getState().setDepthStatus("ready");
    } catch (err) {
      console.error("Depth sculpture encoding failed:", err);
      useDepthStore.getState().setDepthStatus("error");
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
        <h1 className="text-sm font-semibold text-zinc-200">Depth Sculpture</h1>
        <p className="text-xs text-zinc-500 mt-1">Photo to 3D depth</p>
      </div>

      <Separator />

      {/* Image Source */}
      <div className="space-y-3">
        <Label>Image Source</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={depthStatus === "loading"}
        >
          {depthStatus === "loading" ? "Processing..." : "Choose Image"}
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
          {depthStatus === "loading"
            ? "Estimating depth..."
            : "Drop image file here"}
        </div>
        {depthStatus === "loading" && (
          <p className="text-[10px] text-zinc-500">
            First run downloads ~25MB model
          </p>
        )}
        {depthStatus === "error" && (
          <p className="text-[10px] text-red-400">
            Depth estimation failed
          </p>
        )}
      </div>

      {sculptureData && sourceImage && (
        <>
          <Separator />

          {/* Render Mode */}
          <div className="space-y-3">
            <Label>Render Mode</Label>
            <div className="flex gap-2">
              {(["mesh", "points"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    useDepthStore.getState().setRenderMode(mode)
                  }
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    renderMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {mode === "mesh" ? "Mesh" : "Points"}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Depth Scale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Depth Scale</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {depthScale.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[depthScale]}
              min={0}
              max={3}
              step={0.01}
              onValueChange={([v]) =>
                useDepthStore.getState().setDepthScale(v)
              }
            />
          </div>

          {/* Point Size (points mode only) */}
          {renderMode === "points" && (
            <>
              <Separator />
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
                  onValueChange={([v]) =>
                    useDepthStore.getState().setPointSize(v)
                  }
                />
              </div>
            </>
          )}

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
                useDepthStore.getState().setOpacity(v)
              }
            />
          </div>

          <Separator />

          {/* Color Mode */}
          <div className="space-y-3">
            <Label>Color Mode</Label>
            <div className="flex gap-2">
              {(["photo", "depth"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() =>
                    useDepthStore.getState().setColorMode(mode)
                  }
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    colorMode === mode
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {mode === "photo" ? "Photo" : "Depth"}
                </button>
              ))}
            </div>
          </div>

          {/* Wireframe (mesh mode only) */}
          {renderMode === "mesh" && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Wireframe</Label>
                <button
                  onClick={() =>
                    useDepthStore
                      .getState()
                      .setWireframe(!wireframe)
                  }
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    wireframe
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {wireframe ? "On" : "Off"}
                </button>
              </div>
            </>
          )}

          <Separator />

          {/* Info */}
          <div className="space-y-2">
            <Label>Info</Label>
            <p className="text-[10px] text-zinc-500 font-mono">
              {(sculptureData.imageWidth * sculptureData.imageHeight).toLocaleString()}{" "}
              {renderMode === "points" ? "particles" : "vertices"} (
              {sculptureData.imageWidth} x {sculptureData.imageHeight})
            </p>
          </div>

          <Separator />

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => useDepthStore.getState().reset()}
          >
            Reset
          </Button>
        </>
      )}
    </div>
  );
}
