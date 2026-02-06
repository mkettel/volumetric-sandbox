"use client";

import { useEffect, useState } from "react";

export function WebGL2Check({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  if (supported === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Checking WebGL2 support...
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="max-w-md text-center space-y-4 p-8">
          <h1 className="text-lg font-semibold text-zinc-200">
            WebGL2 Required
          </h1>
          <p className="text-sm text-zinc-400">
            This application requires WebGL2 to render volumetric data. Please
            use a modern browser (Chrome, Firefox, Edge, or Safari 15+) with
            hardware acceleration enabled.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
