import * as THREE from "three";

/**
 * Build a Data3DTexture from a raw Uint8Array scalar field.
 * Single-channel (RedFormat) for minimal GPU memory.
 */
export function buildData3DTexture(
  data: Uint8Array,
  width: number,
  height: number,
  depth: number
): THREE.Data3DTexture {
  const texture = new THREE.Data3DTexture(data, width, height, depth);
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
