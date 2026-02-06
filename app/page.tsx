"use client";

import { useState, useEffect } from "react";
import { ExperienceNav } from "@/components/navigation/ExperienceNav";
import { PlaygroundLayout } from "@/components/playground/PlaygroundLayout";
import { LoadingOverlay } from "@/components/playground/LoadingOverlay";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { WebGL2Check } from "@/components/viewport/WebGL2Check";
import { RGBPeelingLayout } from "@/components/rgb-peeling/RGBPeelingLayout";
import { ParticleLayout } from "@/components/image-particles/ParticleLayout";
import { AudioLayout } from "@/components/audio-particles/AudioLayout";
import { DepthLayout } from "@/components/depth-sculpture/DepthLayout";
import { useVolumeLoader } from "@/hooks/use-volume-loader";
import { usePlayback } from "@/hooks/use-playback";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

type Experience = "volume" | "rgb-peeling" | "image-particles" | "audio-spectrogram" | "depth-sculpture";

function VolumeExplorer() {
  const { loadVolume } = useVolumeLoader();

  usePlayback();
  useKeyboardShortcuts();

  useEffect(() => {
    loadVolume("noise");
  }, [loadVolume]);

  return (
    <>
      <PlaygroundLayout controlPanel={<ControlPanel />} />
      <LoadingOverlay />
    </>
  );
}

export default function Home() {
  const [active, setActive] = useState<Experience>("volume");

  return (
    <WebGL2Check>
      <div className="flex flex-col h-screen w-full overflow-hidden">
        <ExperienceNav active={active} onChange={setActive} />
        <div className="flex-1 overflow-hidden">
          {active === "volume" && <VolumeExplorer />}
          {active === "rgb-peeling" && <RGBPeelingLayout />}
          {active === "image-particles" && <ParticleLayout />}
          {active === "audio-spectrogram" && <AudioLayout />}
          {active === "depth-sculpture" && <DepthLayout />}
        </div>
      </div>
    </WebGL2Check>
  );
}
