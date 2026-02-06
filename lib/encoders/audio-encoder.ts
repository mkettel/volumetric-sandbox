import type { AudioData } from "@/store/audio-store";

const MAX_PARTICLES = 500_000;
const DEFAULT_FFT_SIZE = 512;
const DEFAULT_SLICES_PER_SEC = 30;

/**
 * Radix-2 Cooley-Tukey FFT (in-place).
 * real and imag are same-length arrays with length = power of 2.
 */
function fft(real: Float32Array, imag: Float32Array) {
  const n = real.length;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;

    if (i < j) {
      let tmp = real[i]; real[i] = real[j]; real[j] = tmp;
      tmp = imag[i]; imag[i] = imag[j]; imag[j] = tmp;
    }
  }

  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wR = Math.cos(angle);
    const wI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curR = 1, curI = 0;
      for (let j = 0; j < halfLen; j++) {
        const a = i + j;
        const b = a + halfLen;
        const tR = curR * real[b] - curI * imag[b];
        const tI = curR * imag[b] + curI * real[b];
        real[b] = real[a] - tR;
        imag[b] = imag[a] - tI;
        real[a] += tR;
        imag[a] += tI;
        const nextR = curR * wR - curI * wI;
        curI = curR * wI + curI * wR;
        curR = nextR;
      }
    }
  }
}

/**
 * HSL to RGB (h in [0, 360], s and l in [0, 1]).
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return [r + m, g + m, b + m];
}

export async function encodeAudioToParticles(file: File): Promise<AudioData> {
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new OfflineAudioContext(1, 1, 44100);
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // Mix to mono
  let samples: Float32Array;
  if (audioBuffer.numberOfChannels === 1) {
    samples = audioBuffer.getChannelData(0);
  } else {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    samples = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      samples[i] = (left[i] + right[i]) * 0.5;
    }
  }

  const fftSize = DEFAULT_FFT_SIZE;
  const freqBins = fftSize >> 1; // 256

  // Determine slices/sec, cap particle count
  let slicesPerSec = DEFAULT_SLICES_PER_SEC;
  let timeSlices = Math.floor(duration * slicesPerSec);
  if (timeSlices * freqBins > MAX_PARTICLES) {
    slicesPerSec = Math.floor(MAX_PARTICLES / (freqBins * duration));
    if (slicesPerSec < 1) slicesPerSec = 1;
    timeSlices = Math.floor(duration * slicesPerSec);
  }

  const hopSize = Math.floor(sampleRate / slicesPerSec);

  // Pre-compute Hann window
  const hannWindow = new Float32Array(fftSize);
  for (let i = 0; i < fftSize; i++) {
    hannWindow[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)));
  }

  // Compute magnitude spectrum for all slices
  const magnitudes = new Float32Array(timeSlices * freqBins);
  let globalMax = 0;

  const fftReal = new Float32Array(fftSize);
  const fftImag = new Float32Array(fftSize);

  for (let t = 0; t < timeSlices; t++) {
    const start = t * hopSize;

    // Window and zero-pad
    fftReal.fill(0);
    fftImag.fill(0);
    for (let i = 0; i < fftSize; i++) {
      const idx = start + i;
      fftReal[i] = idx < samples.length ? samples[idx] * hannWindow[i] : 0;
    }

    fft(fftReal, fftImag);

    // Compute magnitudes (first half only)
    for (let f = 0; f < freqBins; f++) {
      const mag = Math.sqrt(fftReal[f] * fftReal[f] + fftImag[f] * fftImag[f]);
      magnitudes[t * freqBins + f] = mag;
      if (mag > globalMax) globalMax = mag;
    }
  }

  // Normalize to 0-1
  if (globalMax > 0) {
    const inv = 1 / globalMax;
    for (let i = 0; i < magnitudes.length; i++) {
      magnitudes[i] *= inv;
    }
  }

  // Build particle arrays
  const count = timeSlices * freqBins;
  const positions = new Float32Array(count * 3);
  const frequencyColors = new Float32Array(count * 3);
  const amplitudeColors = new Float32Array(count * 3);

  for (let t = 0; t < timeSlices; t++) {
    const zNorm = timeSlices > 1 ? t / (timeSlices - 1) : 0.5;

    for (let f = 0; f < freqBins; f++) {
      const idx = t * freqBins + f;
      const fNorm = f / (freqBins - 1);
      const amp = magnitudes[idx];

      // Position: x = freq [-1, 1], z = time [-1.5, 1.5], y = amplitude
      positions[idx * 3] = fNorm * 2 - 1;
      positions[idx * 3 + 1] = amp;
      positions[idx * 3 + 2] = zNorm * 3 - 1.5;

      // Frequency color: hue mapped to frequency bin
      const hue = fNorm * 260; // bass=red(0) -> treble=purple(260)
      const [fr, fg, fb] = hslToRgb(hue, 0.85, 0.55);
      frequencyColors[idx * 3] = fr;
      frequencyColors[idx * 3 + 1] = fg;
      frequencyColors[idx * 3 + 2] = fb;

      // Amplitude color: dark blue -> bright yellow/white
      const al = amp * 0.8 + 0.1; // lightness 0.1 -> 0.9
      const as = amp > 0.7 ? 0.6 : 0.8;
      const ah = amp > 0.7 ? 50 : 220; // shift from blue to warm at high amp
      const [ar, ag, ab] = hslToRgb(ah, as, al);
      amplitudeColors[idx * 3] = ar;
      amplitudeColors[idx * 3 + 1] = ag;
      amplitudeColors[idx * 3 + 2] = ab;
    }
  }

  return {
    positions,
    frequencyColors,
    amplitudeColors,
    count,
    duration,
    frequencyBins: freqBins,
    timeSlices,
  };
}
