import type { Encoder, VolumeData, EncoderProgress } from "@/lib/volume/types";
import { buildData3DTexture } from "@/lib/volume/texture-builder";
import { VOLUME_LIMITS } from "@/lib/constants";

// Simple 3D noise using a hash-based approach (no dependencies)
function hash(x: number, y: number, z: number): number {
  let h = x * 374761393 + y * 668265263 + z * 1274126177;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return (h ^ (h >> 16)) >>> 0;
}

function noise3D(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;

  // Smooth interpolation
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const h000 = (hash(ix, iy, iz) & 0xffff) / 0xffff;
  const h100 = (hash(ix + 1, iy, iz) & 0xffff) / 0xffff;
  const h010 = (hash(ix, iy + 1, iz) & 0xffff) / 0xffff;
  const h110 = (hash(ix + 1, iy + 1, iz) & 0xffff) / 0xffff;
  const h001 = (hash(ix, iy, iz + 1) & 0xffff) / 0xffff;
  const h101 = (hash(ix + 1, iy, iz + 1) & 0xffff) / 0xffff;
  const h011 = (hash(ix, iy + 1, iz + 1) & 0xffff) / 0xffff;
  const h111 = (hash(ix + 1, iy + 1, iz + 1) & 0xffff) / 0xffff;

  const x00 = h000 + ux * (h100 - h000);
  const x10 = h010 + ux * (h110 - h010);
  const x01 = h001 + ux * (h101 - h001);
  const x11 = h011 + ux * (h111 - h011);

  const y0 = x00 + uy * (x10 - x00);
  const y1 = x01 + uy * (x11 - x01);

  return y0 + uz * (y1 - y0);
}

function fbm(x: number, y: number, z: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return value / maxValue;
}

export const noiseEncoder: Encoder = {
  name: "noise",

  async encode(
    _source: unknown,
    onProgress?: (progress: EncoderProgress) => void
  ): Promise<VolumeData> {
    const width = VOLUME_LIMITS.defaultWidth;
    const height = VOLUME_LIMITS.defaultHeight;
    const depth = VOLUME_LIMITS.defaultDepth;
    const total = width * height * depth;
    const data = new Uint8Array(total);

    const scale = 4;

    for (let z = 0; z < depth; z++) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const nx = (x / width) * scale;
          const ny = (y / height) * scale;
          const nz = (z / depth) * scale;

          // FBM noise with a spherical falloff to create a cloud shape
          let val = fbm(nx, ny, nz, 4);

          // Spherical falloff from center
          const cx = (x / width - 0.5) * 2;
          const cy = (y / height - 0.5) * 2;
          const cz = (z / depth - 0.5) * 2;
          const dist = Math.sqrt(cx * cx + cy * cy + cz * cz);
          const falloff = Math.max(0, 1 - dist);

          val *= falloff;

          const idx = x + y * width + z * width * height;
          data[idx] = Math.round(val * 255);
        }
      }

      if (onProgress && z % 8 === 0) {
        onProgress({
          current: z,
          total: depth,
          message: `Generating noise: slice ${z}/${depth}`,
        });
        // Yield to main thread
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.({ current: depth, total: depth, message: "Done" });

    const texture = buildData3DTexture(data, width, height, depth);

    return {
      data,
      texture,
      metadata: {
        width,
        height,
        depth,
        sourceType: "noise",
        sourceName: "3D Perlin Noise",
      },
    };
  },
};
