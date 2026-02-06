import type { Encoder } from "./types";

const encoderRegistry = new Map<string, Encoder>();

export function registerEncoder(encoder: Encoder) {
  encoderRegistry.set(encoder.name, encoder);
}

export function getEncoder(name: string): Encoder | undefined {
  return encoderRegistry.get(name);
}

export function getEncoderNames(): string[] {
  return Array.from(encoderRegistry.keys());
}
