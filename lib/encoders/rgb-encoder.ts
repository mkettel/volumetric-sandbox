import * as THREE from "three";

export interface RGBChannelTextures {
  imageTexture: THREE.Texture;
  channelTextures: {
    r: THREE.DataTexture;
    g: THREE.DataTexture;
    b: THREE.DataTexture;
  };
}

/**
 * Load an image file and split it into R, G, B channel textures.
 * Each channel texture is an RGBA DataTexture where only one color channel
 * has data (others zeroed). When composited with additive blending,
 * the three channels reconstruct the original image.
 */
export async function encodeImageToChannels(file: File): Promise<RGBChannelTextures> {
  const image = await loadImage(file);
  const { width, height } = image;

  // Draw image to canvas and extract pixel data
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data; // RGBA Uint8ClampedArray

  // Create channel-separated pixel arrays
  const rData = new Uint8Array(width * height * 4);
  const gData = new Uint8Array(width * height * 4);
  const bData = new Uint8Array(width * height * 4);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    // R channel: (R, 0, 0, A)
    rData[i] = r;
    rData[i + 1] = 0;
    rData[i + 2] = 0;
    rData[i + 3] = a;

    // G channel: (0, G, 0, A)
    gData[i] = 0;
    gData[i + 1] = g;
    gData[i + 2] = 0;
    gData[i + 3] = a;

    // B channel: (0, 0, B, A)
    bData[i] = 0;
    bData[i + 1] = 0;
    bData[i + 2] = b;
    bData[i + 3] = a;
  }

  // Build Three.js textures
  const makeChannelTexture = (data: Uint8Array): THREE.DataTexture => {
    const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
    tex.flipY = true;
    tex.needsUpdate = true;
    return tex;
  };

  // Composite texture from the original image
  const imageTexture = new THREE.Texture(image);
  imageTexture.flipY = true;
  imageTexture.needsUpdate = true;

  return {
    imageTexture,
    channelTextures: {
      r: makeChannelTexture(rData),
      g: makeChannelTexture(gData),
      b: makeChannelTexture(bData),
    },
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
