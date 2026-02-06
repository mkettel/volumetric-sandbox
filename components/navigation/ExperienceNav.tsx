"use client";

type Experience = "volume" | "rgb-peeling" | "image-particles" | "audio-spectrogram" | "depth-sculpture" | "photo-layers" | "bas-relief";

interface ExperienceNavProps {
  active: Experience;
  onChange: (experience: Experience) => void;
}

const tabs: { id: Experience; label: string }[] = [
  { id: "volume", label: "Volume Explorer" },
  { id: "rgb-peeling", label: "RGB Peeling" },
  { id: "image-particles", label: "Image Particles" },
  { id: "audio-spectrogram", label: "Audio Spectrogram" },
  { id: "depth-sculpture", label: "Depth Sculpture" },
  { id: "photo-layers", label: "Photo Layers" },
  { id: "bas-relief", label: "Bas Relief" },
];

export function ExperienceNav({ active, onChange }: ExperienceNavProps) {
  return (
    <nav className="flex items-center gap-1 border-b border-zinc-800 bg-zinc-950 px-4 py-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            active === tab.id
              ? "bg-blue-600 text-white"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
