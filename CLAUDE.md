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

## Experiment Roadmap

### Tier 1: Priority (Build First)

1. **Video → Time Volume** ✅ DONE
   - Each frame becomes a Z-slice, scrub through time as depth
   - Motion creates ghostly 3D trails, static regions stay sharp

2. **RGB Channel Peeling**
   - Separate image into R, G, B channels as three translucent displaced planes
   - Planes merge back into original photo on click
   - Simplest to implement, immediate wow factor

3. **Radiology Windowing as General UX**
   - Apply medical imaging windowing (width/level) to any data source
   - Already built into the shared engine — just needs demonstration/docs
   - Nobody outside medicine uses this interaction pattern

### Tier 1.5: EKG as Volume

9. **EKG → Volumetric Visualization**
   - Time → depth (Z-axis), voltage → voxel density
   - 12-lead ECG: each lead becomes a layer or channel in the volume
   - Apply radiology windowing/thresholding to isolate waveform features (QRS complex as "bone," P/T waves as "tissue")
   - Slice through the cardiac cycle as depth — see rhythm patterns as 3D structure
   - Combine with the existing optical-ekg backend (`/ecg-visualizer/`) for real-time ECG generation
   - Could reveal arrhythmia patterns (AFib chaos, VT circuits) as visible 3D topology
   - Bridges the medical imaging metaphor back to actual medical data

### Tier 2: High Novelty, More Effort

4. **Audio → Sculpted Matter**
   - Bass frequencies → "bone," treble → "tissue"
   - FFT decomposition via Web Audio API
   - Z-axis = time (same pattern as video volume)
   - Most visually unique approach

5. **Photo Segmentation → 3D Layers** (Exploded PSD)
   - ML segmentation separates photo into semantic layers (sky, trees, person)
   - Each layer becomes a displaced plane with interactive depth separation
   - Client-side ML segmentation models now available

6. **Depth Map Extraction from Photos**
   - Monocular depth estimation (MiDaS, Depth Anything) on regular photos
   - Render as 2.5D/3D scene, slice by depth to separate foreground/midground/background
   - Lowest barrier: one ML model call → depth map → Three.js rendering

### Tier 3: Art Pieces (Conceptually Deep)

7. **Text as Volume**
   - Convert text into volumetric structure
   - Needs significant design exploration to make visually compelling

8. **Photo Series → Memory Volume**
   - Stack related photos as temporal layers (e.g., same location over time)
   - Exhibition-quality piece

### Additional Data Sources

**Image-Based:**
- Frequency decomposition (FFT/wavelets into frequency bands)
- Histology stain separation (H&E color-deconvolution)

**Geospatial/Remote Sensing:**
- Multispectral satellite imagery (Sentinel-2, 13+ bands)
- LiDAR point clouds (with classification layers)

**Scientific Data:**
- Microscopy Z-stacks (confocal, multiple fluorescent channels)
- Astronomical FITS files (multi-wavelength telescope data)
- Weather/atmospheric volumes (NOAA 3D atmospheric data)
