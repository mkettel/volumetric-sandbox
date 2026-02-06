# Volumetric Playground

## Tech Stack
Next.js 16, React Three Fiber, Three.js, TypeScript, Tailwind CSS, Zustand. Frontend only.

## Architecture
```
Source → Encoder → Uint8Array (volume)       → Ray March Shader
                 → Float32Array (particles)  → Instanced Points
                 → Mesh (isosurface)         → Standard Material
                 → Vector Field              → Streamline Renderer
                 → SDF Parameters            → SDF Ray March
```
The encoder pattern is the constant — each data source maps to a GPU-friendly representation. What varies is the *renderer*. Some experiences use volumetric ray marching, others use particles, meshes, flow fields, or SDFs. Each experience picks its own renderer (or offers multiple views of the same data). The shared parts are the controls and interactions (slicing, thresholding, windowing, playback), not necessarily the rendering pipeline.

## Development Commands
```bash
npm run dev      # Start dev server
npm run build    # Build (type check)
```

---

## Core Thesis

Started from DICOM/CT — radiology's interaction paradigm (windowing, slicing, thresholding) is a general-purpose way to explore ANY dense data. But the project isn't limited to the volumetric/ray-marching approach. The real insight is broader: **take data people normally see in 2D or as numbers, and give them spatial, interactive, multi-dimensional ways to explore it.** The rendering technique should serve the data, not the other way around.

## Rendering Approaches

Not everything wants to be a ray-marched volume. The right visualization depends on the data:

- **Ray marching (volumes):** Best for dense scalar fields where you want to see through layers — CT data, video-as-time, stacked images. Windowing and transfer functions shine here.
- **Particles / point clouds:** Best for data that's dynamic, sparse, or wants to feel alive — real-time audio, flowing data. GPU instanced rendering handles millions of points.
- **Mesh / geometry:** Best for data with clear surfaces or when you want something tangible and lit — isosurface extraction from volumes (marching cubes), displacement-mapped planes, exploded layer views. Can be 3D printed / exported.
- **Vector / flow fields:** Best for data that has direction and magnitude — EKG cardiac vectors, fluid-like audio, wind data. Rendered as streamlines, arrows, or animated particles following the field.
- **Signed distance fields (SDFs):** Best for procedural shapes modulated by data — mathematically defined surfaces displaced by signals. Razor-sharp at any scale because it's math, not voxels.
- **Reaction-diffusion / simulation:** Best for organic transformation — data seeds initial conditions, then biological-looking patterns grow from it. Computationally cheap on GPU, looks extraordinary.
- **Hybrid:** The most interesting option. Same data, multiple simultaneous representations — volume + extracted isosurface + particles spawning from the surface. Mixing paradigms makes each one more legible because they provide context for each other.

### Data as Environment vs Data as Specimen

Two fundamentally different UX modes:
- **Specimen mode:** Data is an object you examine from outside. Rotate, slice, window. (Current approach.)
- **Environment mode:** Data becomes a space you're inside. Navigate through a song where bass is ground, mids are atmosphere, treble is precipitation. Or walk through a text-landscape. Shifts from "examine" to "inhabit."

---

## Experiment Roadmap

### Tier 1: Priority (Build First)

1. **Video → Time Volume** ✅ DONE
   - Each frame becomes a Z-slice, scrub through time as depth
   - Motion creates ghostly 3D trails, static regions stay sharp

2. **RGB Channel Peeling** — the gateway drug
   - Encoder skeleton already exists (`lib/encoders/rgb-encoder.ts`)
   - **Rendering options:**
     - **Geometry approach (primary):** Three actual displaced meshes with image UV-mapped, additive blending. Users grab and drag planes apart, rotate independently. Spring physics on recombination — they snap back with bounce. More tactile than volumetric.
     - **Volumetric approach:** Encode R/G/B as three Z-slices of a 3-deep volume → existing slice plane cuts through color space. Per-channel windowing — boost reds, suppress blues = same UX as bone vs soft tissue.
   - **Key design moves:**
     - Frequency decomposition variant: FFT into low/mid/high frequency bands instead of color channels. Low freq = image "skeleton" (broad shapes), high freq = "surface detail" (edges, texture). Users window frequency bands like density ranges.

3. **Radiology Windowing as General UX**
   - Already built into the shared engine — just needs demonstration across data sources
   - Nobody outside medicine uses this interaction pattern
   - The through-line: windowing is how you ask "show me only the things in this value range" — universally useful

### Tier 1.5: EKG as Volume

4. **EKG → Volumetric Visualization** — the bridge piece
   - Educational tool, not diagnostic — helps understand what ECGs actually measure
   - **Rendering options:**
     - **Volume approach:** Time → Z, derivative (rate of change) → density. QRS = densest, P/T waves softer, isoelectric = empty. 12 leads arranged by anatomical angle as radial layers. Windowing isolates waveform features.
     - **Vector field approach (potentially stronger):** The heart's electrical activity IS a vector field. Compute instantaneous cardiac vector at each time step, render as streamlines or arrows in 3D. The axis evolves through P-wave → QRS → T-wave. The Einthoven triangle comes alive. Pedagogically unmatched.
     - **Propagating wavefront:** Render depolarization as a surface expanding through 3D space over time. Users pause, rotate, scrub. Closer to physiological reality than any density mapping.
   - **12-lead as angular sampling:**
     - Each lead is a projection of a 3D electrical vector onto a 1D axis
     - Arrange leads by anatomical angle (I=0°, II=60°, III=120°, aVR=-150°, etc.)
     - Rotating the view = rotating perspective around the heart's electrical axis
     - Axis deviation becomes visible as asymmetry
   - **Rhythm as texture:**
     - NSR → smooth, repetitive laminar structure
     - AFib → chaotic, noisy surface
     - VT → rigid, repetitive columns
     - PVCs → structural discontinuities
   - **Comparison mode:** Stack 10s of NSR next to 10s of AFib, slice between them
   - **Opti synergy:** Bridge representation — surface ECG in the same visual language as 3D heart model. Students intuit that the waveform *is* a projection of the spatial process.
   - Can combine with existing optical-ekg backend (`/ecg-visualizer/`) for real-time ECG generation

### Tier 2: High Novelty, More Effort

5. **Audio → Sculpted Matter** — most visceral
   - **Rendering options:**
     - **Volume approach:** FFT → frequency bins (Y), time slices → Z, amplitude → density. Playhead as moving slice plane synced to audio playback — users see what they hear at the moment of the cut. Static, inspectable.
     - **Particle approach (potentially stronger):** Spawn particles in real-time from frequency data. Bass emits heavy, slow particles that cluster low. Treble emits fast, light ones that scatter. Amplitude = emission rate. Music *generates* a living structure that self-organizes and decays. GPU instanced points.
     - **Flow field approach:** Treat frequency evolution as a velocity field. Low frequencies flow slowly, high create turbulence. Visualization looks like fluid dynamics driven by music. Curl noise modulated by audio data.
     - **Hybrid:** Volume for the full song (static, sliceable) + live particles spawning from the current playhead position.
   - **Harmonic structure becomes anatomy:** Instruments have overtone series that appear as layered structures at integer frequency multiples. A violin looks completely different from a flute.
   - **Stereo as spatial anatomy:** Left/right channels as separate spatial regions. Panning = spatial asymmetry.
   - **Beat detection → structural landmarks:** Transients create sharp density spikes across all bands — cross-sectional "walls." Rhythm becomes architecture.

6. **Photo → Depth Sculpture** — instant payoff
   - Monocular depth estimation (MiDaS, Depth Anything) on a single photo
   - **Rendering options:**
     - **Volume approach:** Use depth map to distribute density along Z. Near objects dense at small Z, far at large Z. Slice plane peels through depth like peeling through anatomy.
     - **Point cloud approach:** Scatter every pixel as a 3D point using depth for Z, original color preserved. Navigable point cloud you fly through. Poor-man's Gaussian splatting — immediately impressive.
     - **Mesh displacement:** Depth map drives vertex displacement on a plane. Lit, tangible, exportable for 3D printing.
   - **Multi-scale encoding:** Depth estimation at multiple resolutions, stacked. Coarse = broad structure, fine = surface detail. Windowing selects spatial scale.
   - **Luminance + depth = two-channel volume:** Transfer function maps both — bright-and-near gets one color, dark-and-far gets another. Bivariate volumetric rendering.

7. **Photo Segmentation → 3D Layers** (Exploded PSD)
   - ML segmentation separates photo into semantic layers (sky, trees, person)
   - Each layer becomes a displaced plane with interactive depth separation
   - Client-side ML segmentation models now available

### Tier 3: Art Pieces (Conceptually Deep)

8. **Text as Volume** — needs most design iteration
   - **Rendering options:**
     - **Volume approach:** Sentence embeddings → scalar projection → density, paragraphs as Z-slices.
     - **Terrain approach (potentially more legible):** Sentence length = ridge height, word frequency = texture roughness, paragraph breaks = valleys. Camera at ground level with fog and lighting — a landscape shaped by language. Environment mode, not specimen mode.
     - **Reaction-diffusion:** Text data seeds initial conditions, organic patterns grow from it. A novel slowly transforms into biological-looking textures.
   - **Comparison volumes:** Encode two texts, overlay. Agreement reinforces density, divergence cancels. Volumetric diff on meaning.
   - **Simpler version that still works:** Word density per line → brightness, line position → Y, paragraph → Z. Dialogue is sparse. Dense prose is opaque. Poetry has characteristic shapes.

9. **Photo Series → Memory Volume**
   - Stack related photos as temporal layers (same location over time)
   - Buildings appearing/disappearing, seasons as layers, memory decay (older images blur/fade)
   - Exhibition-quality piece

### Cross-Cutting: Isosurface Extraction

Any volumetric data source (video, audio, EKG, depth) can also be rendered via marching cubes — extract a mesh at a specific density threshold. Instead of a translucent volume, you get a solid, lit, tangible *object*. Users adjust the threshold and watch the shape morph in real-time. Different thresholds extract different "organs" from the data. This is also the 3D printing / export pipeline.

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
