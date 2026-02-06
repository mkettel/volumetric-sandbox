import * as THREE from "three";

type RGBA = [number, number, number, number];
type ColorMapFn = (t: number) => RGBA;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const colorMaps: Record<string, ColorMapFn> = {
  grayscale: (t) => [t * 255, t * 255, t * 255, t * 255],

  heat: (t) => {
    const r = Math.min(1, t * 3);
    const g = Math.min(1, Math.max(0, t * 3 - 1));
    const b = Math.min(1, Math.max(0, t * 3 - 2));
    return [r * 255, g * 255, b * 255, t * 255];
  },

  viridis: (t) => {
    // Simplified viridis approximation
    const r = lerp(0.267, 0.993, t * t);
    const g = lerp(0.004, 0.906, Math.sqrt(t));
    const b = lerp(0.329, 0.143, t);
    return [r * 255, g * 255, b * 255, t * 255];
  },

  cool: (t) => {
    const r = t;
    const g = 1 - t;
    const b = 1;
    return [r * 255, g * 255, b * 255, t * 255];
  },

  bone: (t) => {
    let r: number, g: number, b: number;
    if (t < 0.375) {
      const s = t / 0.375;
      r = lerp(0, 0.329, s);
      g = lerp(0, 0.329, s);
      b = lerp(0, 0.444, s);
    } else if (t < 0.75) {
      const s = (t - 0.375) / 0.375;
      r = lerp(0.329, 0.662, s);
      g = lerp(0.329, 0.784, s);
      b = lerp(0.444, 0.784, s);
    } else {
      const s = (t - 0.75) / 0.25;
      r = lerp(0.662, 1, s);
      g = lerp(0.784, 1, s);
      b = lerp(0.784, 1, s);
    }
    return [r * 255, g * 255, b * 255, t * 255];
  },
};

/**
 * Build a 256×1 RGBA DataTexture for the given transfer function name.
 */
export function buildTransferFunctionTexture(
  name: string
): THREE.DataTexture {
  const mapFn = colorMaps[name] ?? colorMaps.grayscale;
  const size = 256;
  const data = new Uint8Array(size * 4);

  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const [r, g, b, a] = mapFn(t);
    data[i * 4 + 0] = Math.round(r);
    data[i * 4 + 1] = Math.round(g);
    data[i * 4 + 2] = Math.round(b);
    data[i * 4 + 3] = Math.round(a);
  }

  const texture = new THREE.DataTexture(data, size, 1, THREE.RGBAFormat);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}
