"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAudioStore, type ColorMode } from "@/store/audio-store";
import { encodeAudioToParticles } from "@/lib/encoders/audio-encoder";

function Separator() {
  return <div className="h-px bg-zinc-800" />;
}

const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: "frequency", label: "Frequency" },
  { id: "amplitude", label: "Amplitude" },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioControlPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const audioData = useAudioStore((s) => s.audioData);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const pointSize = useAudioStore((s) => s.pointSize);
  const opacity = useAudioStore((s) => s.opacity);
  const yScale = useAudioStore((s) => s.yScale);
  const colorMode = useAudioStore((s) => s.colorMode);

  // Create/destroy audio element when sourceFile changes
  const sourceFile = useAudioStore((s) => s.sourceFile);

  useEffect(() => {
    if (!sourceFile) {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
      return;
    }

    const url = URL.createObjectURL(sourceFile);
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      useAudioStore.getState().setIsPlaying(false);
      useAudioStore.getState().setCurrentTime(0);
    });

    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
      audioRef.current = null;
    };
  }, [sourceFile]);

  // Sync playback time via rAF
  useEffect(() => {
    if (!isPlaying || !audioRef.current) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    audioRef.current.play();

    const tick = () => {
      if (audioRef.current) {
        useAudioStore.getState().setCurrentTime(audioRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const handleAudioFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("audio/")) return;

    setLoading(true);
    try {
      const data = await encodeAudioToParticles(file);
      useAudioStore.getState().setAudioData(data);
      useAudioStore.getState().setSourceFile(file);
      useAudioStore.getState().setDuration(data.duration);
      useAudioStore.getState().setCurrentTime(0);
      useAudioStore.getState().setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleAudioFile(file);
      e.target.value = "";
    },
    [handleAudioFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleAudioFile(file);
    },
    [handleAudioFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const togglePlayback = useCallback(() => {
    const state = useAudioStore.getState();
    if (state.isPlaying) {
      audioRef.current?.pause();
      useAudioStore.getState().setIsPlaying(false);
    } else {
      useAudioStore.getState().setIsPlaying(true);
    }
  }, []);

  const handleSeek = useCallback(([v]: number[]) => {
    useAudioStore.getState().setCurrentTime(v);
    if (audioRef.current) {
      audioRef.current.currentTime = v;
    }
  }, []);

  const handleReset = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
      audioRef.current = null;
    }
    useAudioStore.getState().reset();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-sm font-semibold text-zinc-200">
          Audio Spectrogram
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Frequency, time, and amplitude in 3D
        </p>
      </div>

      <Separator />

      {/* Audio Source */}
      <div className="space-y-3">
        <Label>Audio Source</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Choose Audio"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
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
          {loading ? "Processing FFT..." : "Drop audio file here"}
        </div>
      </div>

      {audioData && (
        <>
          <Separator />

          {/* Playback */}
          <div className="space-y-3">
            <Label>Playback</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={togglePlayback}>
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <span className="text-[10px] text-zinc-500 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handleSeek}
            />
          </div>

          <Separator />

          {/* Y Scale */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Y Scale</Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {yScale.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[yScale]}
              min={0}
              max={5}
              step={0.01}
              onValueChange={([v]) =>
                useAudioStore.getState().setYScale(v)
              }
            />
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
              onValueChange={([v]) =>
                useAudioStore.getState().setPointSize(v)
              }
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
                useAudioStore.getState().setOpacity(v)
              }
            />
          </div>

          <Separator />

          {/* Color Mode */}
          <div className="space-y-3">
            <Label>Color Mode</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() =>
                    useAudioStore.getState().setColorMode(mode.id)
                  }
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    colorMode === mode.id
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-2">
            <Label>Info</Label>
            <div className="text-[10px] text-zinc-500 font-mono space-y-0.5">
              <p>{formatTime(duration)} duration</p>
              <p>{audioData.frequencyBins} frequency bins</p>
              <p>{audioData.timeSlices} time slices</p>
              <p>{audioData.count.toLocaleString()} particles</p>
            </div>
          </div>

          <Separator />

          {/* Reset */}
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </>
      )}
    </div>
  );
}
