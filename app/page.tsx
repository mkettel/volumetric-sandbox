"use client";

import { useEffect } from "react";
import { PlaygroundLayout } from "@/components/playground/PlaygroundLayout";
import { LoadingOverlay } from "@/components/playground/LoadingOverlay";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { WebGL2Check } from "@/components/viewport/WebGL2Check";
import { useVolumeLoader } from "@/hooks/use-volume-loader";
import { usePlayback } from "@/hooks/use-playback";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function Home() {
  const { loadVolume } = useVolumeLoader();

  usePlayback();
  useKeyboardShortcuts();

  useEffect(() => {
    loadVolume("noise");
  }, [loadVolume]);

  return (
    <WebGL2Check>
      <PlaygroundLayout controlPanel={<ControlPanel />} />
      <LoadingOverlay />
    </WebGL2Check>
  );
}
