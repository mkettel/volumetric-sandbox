# Volumetric Playground

## Tech Stack
Next.js 16, React Three Fiber, Three.js, TypeScript, Tailwind CSS, Zustand. Frontend only.

## Architecture
```
Data Source → Encoder → Uint8Array scalar field → Data3DTexture → Ray March Shader
```
Every new data source is just a new encoder. Rendering engine, controls, and UX are shared.

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Build (type check)
```

---

## Core Thesis

Radiology's interaction paradigm — windowing, slicing, thresholding — is a general-purpose way to explore ANY dense data. It just hasn't escaped medicine yet. Every experiment below is the same pipeline: `encode(source) → Uint8Array → Data3DTexture`. Windowing, slicing, transfer functions, and render modes apply to all of them unchanged.

---

## Experiment Roadmap

### Tier 1: Priority (Build First)

1. **Video → Time Volume** ✅ DONE
   - Each frame becomes a Z-slice, scrub through time as depth
   - Motion creates ghostly 3D trails, static regions stay sharp

2. **RGB Channel Peeling** — the gateway drug
   - Separate image into R, G, B channels as three translucent displaced planes
   - Planes merge back into original photo on click
   - Encoder skeleton already exists (`lib/encoders/rgb-encoder.ts`)
   - **Key design moves:**
     - Per-channel windowing — boost reds, suppress blues = same UX as bone vs soft tissue
     - Encode R/G/B as three Z-slices of a 3-deep volume → existing slice plane cuts through color space
     - Frequency decomposition variant: FFT into low/mid/high frequency bands instead of color channels. Low freq = image "skeleton" (broad shapes), high freq = "surface detail" (edges, texture). Users window frequency bands like density ranges.

3. **Radiology Windowing as General UX**
   - Already built into the shared engine — just needs demonstration across data sources
   - Nobody outside medicine uses this interaction pattern
   - The through-line: windowing is how you ask "show me only the things in this value range" — universally useful

### Tier 1.5: EKG as Volume

4. **EKG → Volumetric Visualization** — the bridge piece
   - Educational tool, not diagnostic — helps understand what ECGs actually measure
   - **Axis mapping:**
     - Time → Z, but map *derivative* (rate of change) → density, not raw voltage
     - QRS (fastest depolarization) becomes densest structure, P/T waves are softer, isoelectric baseline is empty
   - **12-lead as angular sampling:**
     - Each lead is a projection of a 3D electrical vector onto a 1D axis
     - Arrange leads by anatomical angle (I=0°, II=60°, III=120°, aVR=-150°, etc.) as radial layers
     - Rotating the volume = rotating perspective around the heart's electrical axis
     - Axis deviation becomes visible as asymmetry
   - **Rhythm as texture:**
     - NSR → smooth, repetitive laminar structure
     - AFib → chaotic, noisy surface
     - VT → rigid, repetitive columns
     - PVCs → structural discontinuities
   - **Comparison mode:** Stack 10s of NSR next to 10s of AFib in same volume, slice between them
   - **Opti synergy:** Volume becomes bridge representation — surface ECG in the same visual language as 3D heart model. Students intuit that the waveform *is* a projection of the spatial process.
   - Can combine with existing optical-ekg backend (`/ecg-visualizer/`) for real-time ECG generation

### Tier 2: High Novelty, More Effort

5. **Audio → Sculpted Matter** — most visceral
   - FFT → frequency bins (Y), time slices → Z, amplitude → density
   - **Harmonic structure becomes anatomy:** Instruments have overtone series (fundamental + harmonics) that appear as layered structures at integer frequency multiples. A violin looks completely different from a flute. Chords create interference patterns.
   - **Stereo as spatial anatomy:** Left/right channels as separate spatial regions. Panning = spatial asymmetry. Centered vocal = midline structure, hard-panned guitar = lateral.
   - **Playhead as moving slice plane:** Sync audio playback position to slice position. As the song plays, the slice sweeps through the volume. Users see what they hear at the moment of the cut. This is the killer interaction.
   - **Beat detection → structural landmarks:** Transients (drum hits, consonants) create sharp density spikes across all frequency bands — they become cross-sectional "walls." Rhythm literally becomes architecture.

6. **Photo → Depth Sculpture** — instant payoff
   - Monocular depth estimation (MiDaS, Depth Anything) on a single photo
   - **Don't just displace geometry — make it volumetric:** Use depth map to distribute density along Z. Near objects are dense at small Z, far at large Z. Slice plane peels through depth like peeling through anatomy.
   - **Multi-scale encoding:** Run depth estimation at multiple resolutions, stack results. Coarse depth = broad structure, fine depth = surface detail. Windowing selects spatial scale (analogous to CT reconstruction kernels).
   - **Luminance + depth = two-channel volume:** Encode luminance as one scalar field and depth as another. Transfer function maps both — bright-and-near gets one color, dark-and-far gets another. Bivariate volumetric rendering.

7. **Photo Segmentation → 3D Layers** (Exploded PSD)
   - ML segmentation separates photo into semantic layers (sky, trees, person)
   - Each layer becomes a displaced plane with interactive depth separation
   - Client-side ML segmentation models now available

### Tier 3: Art Pieces (Conceptually Deep)

8. **Text as Volume** — needs most design iteration
   - **The encoding must be semantically meaningful:**
     - Sentence-level embeddings → scalar projection (sentiment axis, complexity axis) → density
     - Paragraphs become Z-slices. Volume has interpretable structure.
   - **Comparison volumes:** Encode two texts, overlay. Agreement reinforces density, divergence cancels. Volumetric diff on meaning.
   - **Simpler version that still works:** Word density per line → brightness, line position → Y, paragraph → Z. Dialogue is sparse (short lines). Dense prose is opaque. Poetry has characteristic shapes.

9. **Photo Series → Memory Volume**
   - Stack related photos as temporal layers (same location over time)
   - Buildings appearing/disappearing, seasons as layers, memory decay (older images blur/fade)
   - Exhibition-quality piece

### Additional Ideas

**New data source concepts:**
- **Satellite/aerial time stack:** Same location from historical imagery, years as Z-slices. Urban growth = densifying structures. Deforestation = erosion. Seasonal agriculture = pulsing texture.
- **Git repository as volume:** X = file position in tree, Y = line number, Z = commit time. Density = change frequency. Hot spots become dense structures, refactors are horizontal disruptions, dead code is empty space.
- **Microscopy Z-stacks:** Confocal microscopy produces real volumetric data — validates engine against ground-truth. Open-access datasets freely available.

**Image-based:**
- Frequency decomposition (FFT/wavelets into frequency bands)
- Histology stain separation (H&E color-deconvolution)
- Edge/feature volumes: stack Sobel, Canny, and other filtered versions. Structural edges become solid, flat areas fade. Great for architectural photos.

**Geospatial/Remote Sensing:**
- Multispectral satellite imagery (Sentinel-2, 13+ bands)
- LiDAR point clouds (with classification layers)

**Scientific Data:**
- Microscopy Z-stacks (confocal, multiple fluorescent channels)
- Astronomical FITS files (multi-wavelength telescope data)
- Weather/atmospheric volumes (NOAA 3D atmospheric data)
