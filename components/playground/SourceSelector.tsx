"use client";

import { useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useVolumeLoader } from "@/hooks/use-volume-loader";
import { useUIStore } from "@/store/ui-store";

export function SourceSelector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loadVolume } = useVolumeLoader();
  const isEncoding = useUIStore((s) => s.isEncoding);
  const [dragOver, setDragOver] = useState(false);

  const handleVideoFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("video/")) {
        alert("Please select a video file");
        return;
      }
      loadVolume("video", file);
    },
    [loadVolume]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleVideoFile(file);
      // Reset input so re-selecting same file triggers change
      e.target.value = "";
    },
    [handleVideoFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleVideoFile(file);
    },
    [handleVideoFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-3">
      <Label>Data Source</Label>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadVolume("noise")}
          disabled={isEncoding}
        >
          Noise
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isEncoding}
        >
          Video
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
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
        Drop video file here
      </div>
    </div>
  );
}
