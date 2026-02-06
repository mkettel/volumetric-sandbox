import type { ParticleData, BaseZMode } from "@/store/particle-store";

const MAX_PARTICLES = 500_000;

export async function encodeImageToParticles(file: File): Promise<{
  image: HTMLImageElement;
  data: ParticleData;
}> {
  const image = await loadImage(file);
  const { width, height } = image;

  const canvas = document.createElement("canvas");
  let drawWidth = width;
  let drawHeight = height;

  // Downsample if too many pixels
  const totalPixels = width * height;
  if (totalPixels > MAX_PARTICLES) {
    const scale = Math.sqrt(MAX_PARTICLES / totalPixels);
    drawWidth = Math.floor(width * scale);
    drawHeight = Math.floor(height * scale);
  }

  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
  const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
  const pixels = imageData.data;

  const count = drawWidth * drawHeight;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const zFlat = new Float32Array(count);
  const zLuminance = new Float32Array(count);
  const zHue = new Float32Array(count);
  const zSaturation = new Float32Array(count);

  const aspect = drawWidth / drawHeight;
  const halfW = 0.5 * aspect;
  const halfH = 0.5;

  for (let i = 0; i < count; i++) {
    const px = i % drawWidth;
    const py = Math.floor(i / drawWidth);
    const pi = i * 4;

    const r = pixels[pi] / 255;
    const g = pixels[pi + 1] / 255;
    const b = pixels[pi + 2] / 255;

    // Position: normalized coords centered at origin, Y-flipped
    positions[i * 3] = (px / (drawWidth - 1)) * aspect - halfW;
    positions[i * 3 + 1] = (1 - py / (drawHeight - 1)) - halfH;
    positions[i * 3 + 2] = 0;

    // Color
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    // Z-maps
    zFlat[i] = 0;
    zLuminance[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // HSV hue and saturation
    const cMax = Math.max(r, g, b);
    const cMin = Math.min(r, g, b);
    const delta = cMax - cMin;

    // Saturation
    zSaturation[i] = cMax > 0 ? delta / cMax : 0;

    // Hue (normalized 0-1)
    if (delta === 0) {
      zHue[i] = 0;
    } else if (cMax === r) {
      zHue[i] = (((g - b) / delta) % 6) / 6;
      if (zHue[i] < 0) zHue[i] += 1;
    } else if (cMax === g) {
      zHue[i] = ((b - r) / delta + 2) / 6;
    } else {
      zHue[i] = ((r - g) / delta + 4) / 6;
    }
  }

  const zMaps: Record<BaseZMode, Float32Array> = {
    flat: zFlat,
    luminance: zLuminance,
    hue: zHue,
    saturation: zSaturation,
  };

  return {
    image,
    data: { positions, colors, zMaps, count, imageWidth: drawWidth, imageHeight: drawHeight },
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
