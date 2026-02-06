"use client";

import { useState } from "react";
import { VolumeViewport } from "@/components/viewport/VolumeViewport";

interface PlaygroundLayoutProps {
  controlPanel: React.ReactNode;
}

export function PlaygroundLayout({ controlPanel }: PlaygroundLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile toggle */}
      <button
        className="fixed top-2 left-2 z-30 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "Hide" : "Controls"}
      </button>

      {/* Control panel sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-20 w-80 min-w-[280px] overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 pt-10 transition-transform md:relative md:translate-x-0 md:pt-4`}
      >
        {controlPanel}

        {/* Keyboard hints */}
        <div className="mt-6 space-y-1 border-t border-zinc-800 pt-4">
          <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
            Shortcuts
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-zinc-500">
            <span>Space</span><span>Play / Pause</span>
            <span>Left / Right</span><span>Step slice</span>
            <span>R</span><span>Reset params</span>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 3D Viewport */}
      <main className="flex-1 relative">
        <VolumeViewport />
      </main>
    </div>
  );
}
