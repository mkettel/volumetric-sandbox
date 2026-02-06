"use client";

import { useState } from "react";
import { RGBViewport } from "./RGBViewport";
import { RGBControlPanel } from "./RGBControlPanel";

export function RGBPeelingLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-1 w-full overflow-hidden">
      {/* Mobile toggle */}
      <button
        className="fixed top-12 left-2 z-30 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "Hide" : "Controls"}
      </button>

      {/* Control panel sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-20 w-80 min-w-[280px] overflow-y-auto border-r border-zinc-800 bg-zinc-950 p-4 pt-14 transition-transform md:relative md:translate-x-0 md:pt-4`}
      >
        <RGBControlPanel />
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
        <RGBViewport />
      </main>
    </div>
  );
}
