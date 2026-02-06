import * as THREE from "three";

export interface SegmentResult {
  label: string;
  texture: THREE.DataTexture;
  pixelCount: number;
}

export interface SegmentationResult {
  image: HTMLImageElement;
  layers: SegmentResult[];
}

let segmenter: any = null;

async function getSegmenter() {
  if (!segmenter) {
    const { pipeline } = await import("@huggingface/transformers");
    segmenter = await pipeline(
      "image-segmentation",
      "Xenova/segformer-b0-finetuned-ade-512-512"
    );
  }
  return segmenter;
}

const MAX_DIM = 1024;

export async function encodeSegmentation(
  file: File
): Promise<SegmentationResult> {
  const image = await loadImage(file);
  let { width, height } = image;

  // Downscale large images to avoid OOM
  if (width > MAX_DIM || height > MAX_DIM) {
    const scale = MAX_DIM / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // Draw image to canvas (possibly downscaled) and extract pixel data
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  try {
    const seg = await getSegmenter();
    // Pass the File directly — transformers.js accepts Blob inputs
    const results = await seg(file);

    const totalPixels = width * height;
    const minPixelThreshold = totalPixels * 0.01;

    const layers: SegmentResult[] = [];

    for (const result of results) {
      const { label, mask } = result;

      const maskData = mask.data;
      const maskW = mask.width;
      const maskH = mask.height;

      const layerData = new Uint8Array(width * height * 4);
      let pixelCount = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const mx = Math.floor((x / width) * maskW);
          const my = Math.floor((y / height) * maskH);
          const maskVal = maskData[my * maskW + mx];

          const imgIdx = (y * width + x) * 4;

          if (maskVal > 0) {
            pixelCount++;
            layerData[imgIdx] = pixels[imgIdx];
            layerData[imgIdx + 1] = pixels[imgIdx + 1];
            layerData[imgIdx + 2] = pixels[imgIdx + 2];
            layerData[imgIdx + 3] = pixels[imgIdx + 3];
          }
        }
      }

      if (pixelCount < minPixelThreshold) continue;

      const texture = new THREE.DataTexture(
        layerData,
        width,
        height,
        THREE.RGBAFormat
      );
      texture.flipY = true;
      texture.needsUpdate = true;

      layers.push({ label, texture, pixelCount });
    }

    layers.sort((a, b) => b.pixelCount - a.pixelCount);

    return { image, layers };
  } catch (err) {
    console.error("[segmentation-encoder] Pipeline failed:", err);
    throw err;
  }
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
