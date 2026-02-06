import { estimateDepth } from "./depth-encoder";
import type { SculptureData } from "@/store/depth-store";

const MAX_PIXELS = 500_000;

export async function encodeDepthSculpture(
  file: File
): Promise<{ image: HTMLImageElement; data: SculptureData }> {
  const image = await loadImage(file);
  const { width, height } = image;

  let drawWidth = width;
  let drawHeight = height;

  const totalPixels = width * height;
  if (totalPixels > MAX_PIXELS) {
    const scale = Math.sqrt(MAX_PIXELS / totalPixels);
    drawWidth = Math.floor(width * scale);
    drawHeight = Math.floor(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = drawWidth;
  canvas.height = drawHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
  const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);
  const pixels = imageData.data;

  const count = drawWidth * drawHeight;
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const pi = i * 4;
    colors[i * 3] = pixels[pi] / 255;
    colors[i * 3 + 1] = pixels[pi + 1] / 255;
    colors[i * 3 + 2] = pixels[pi + 2] / 255;
  }

  const depthMap = await estimateDepth(file, drawWidth, drawHeight);

  return {
    image,
    data: { colors, depthMap, imageWidth: drawWidth, imageHeight: drawHeight },
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
