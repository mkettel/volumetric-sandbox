let estimator: any = null;

async function getEstimator() {
  if (!estimator) {
    const { pipeline } = await import("@huggingface/transformers");
    estimator = await pipeline(
      "depth-estimation",
      "onnx-community/depth-anything-v2-small"
    );
  }
  return estimator;
}

export async function estimateDepth(
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<Float32Array> {
  const est = await getEstimator();

  const url = URL.createObjectURL(file);
  try {
    const result = await est(url);
    const depthTensor = result.predicted_depth;
    const rawData =
      depthTensor.data instanceof Float32Array
        ? depthTensor.data
        : new Float32Array(depthTensor.data);

    const dims = depthTensor.dims;
    const modelH = dims[dims.length - 2] as number;
    const modelW = dims[dims.length - 1] as number;

    // Normalize to 0-1
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < rawData.length; i++) {
      if (rawData[i] < min) min = rawData[i];
      if (rawData[i] > max) max = rawData[i];
    }
    const range = max - min || 1;

    // Resize to target dimensions with bilinear interpolation
    const depthMap = new Float32Array(targetWidth * targetHeight);
    const scaleX = modelW / targetWidth;
    const scaleY = modelH / targetHeight;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const srcX = x * scaleX;
        const srcY = y * scaleY;
        const x0 = Math.floor(srcX);
        const y0 = Math.floor(srcY);
        const x1 = Math.min(x0 + 1, modelW - 1);
        const y1 = Math.min(y0 + 1, modelH - 1);
        const fx = srcX - x0;
        const fy = srcY - y0;

        const v00 = rawData[y0 * modelW + x0];
        const v10 = rawData[y0 * modelW + x1];
        const v01 = rawData[y1 * modelW + x0];
        const v11 = rawData[y1 * modelW + x1];

        const v =
          v00 * (1 - fx) * (1 - fy) +
          v10 * fx * (1 - fy) +
          v01 * (1 - fx) * fy +
          v11 * fx * fy;

        depthMap[y * targetWidth + x] = (v - min) / range;
      }
    }

    return depthMap;
  } finally {
    URL.revokeObjectURL(url);
  }
}
