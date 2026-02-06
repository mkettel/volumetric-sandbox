"use client";

import { useUIStore } from "@/store/ui-store";

export function LoadingOverlay() {
  const isEncoding = useUIStore((s) => s.isEncoding);
  const progress = useUIStore((s) => s.encodingProgress);

  if (!isEncoding) return null;

  const percent = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-900 p-8">
        <div className="text-sm text-zinc-300">
          {progress?.message ?? "Encoding..."}
        </div>
        <div className="h-2 w-64 overflow-hidden rounded-full bg-zinc-700">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-xs text-zinc-500">{percent}%</div>
      </div>
    </div>
  );
}
