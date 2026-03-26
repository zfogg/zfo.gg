# 10: Hydraulic Erosion Simulation

An interactive terrain erosion simulation powered by LiquidFun (via `liquidfun-wasm`) and Canvas 2D. Water particles flow over procedurally generated terrain, carving rivers and depositing sediment in real time. The user controls rainfall with their mouse.

Route: `/thing/erosion`

---

## Overview

This is a 2D side-view hydraulic erosion simulation. A Perlin noise heightmap defines initial terrain as a series of Box2D edge chains. LiquidFun's SPH (Smoothed Particle Hydrodynamics) particle system simulates water that flows downhill, pools in basins, and splashes off cliffs. A custom erosion layer detects where water contacts terrain and progressively removes material, reshaping the edge chain vertices over time. Eroded material becomes sediment particles that settle in low-lying areas, building up deltas and alluvial fans.

The user clicks to spawn rainstorms. The terrain evolves. Rivers form. It's geology in your browser.

---

## Architecture

### File Structure

```
client/src/
  hooks/
    useErosion.ts              # Main simulation hook (owns world, loop, cleanup)
  erosion/
    ErosionWorld.ts            # Box2D/LiquidFun world setup and stepping
    Terrain.ts                 # Heightmap generation + edge chain management
    TerrainRenderer.ts         # Canvas 2D terrain drawing (filled polygon + texture)
    ParticleRenderer.ts        # Canvas 2D particle drawing (water + sediment)
    ErosionSolver.ts           # Contact-driven erosion + deposition logic
    Cursor.ts                  # Mouse input → rainfall spawning
    config.ts                  # Default config with getDefaultErosionConfig()
    noise.ts                   # Perlin/simplex noise (tiny standalone impl)
  pages/
    Erosion.jsx                # Page component (mirrors Gravity.jsx pattern)
```

### Dependency

```
liquidfun-wasm@7.0.0
```

This package ships a WASM build of Box2D + LiquidFun with full particle system support and TypeScript declarations. It exposes `b2World`, `b2ParticleSystem`, `b2ParticleDef`, all particle flags (`b2_waterParticle`, `b2_powderParticle`, `b2_colorMixingParticle`, etc.), and rigid body primitives. ES module entry at `liquidfun-wasm/dist/es/entry.js`. ~118kB gzipped total.

Install with `vp add liquidfun-wasm`.

---

## Simulation Design

### Coordinate System

The simulation runs in Box2D "meter" space, separate from pixel space. A scale factor converts between them. This keeps physics constants reasonable and avoids floating-point issues at large pixel values.

```
PIXELS_PER_METER = 20
WORLD_WIDTH  = canvas.width  / PIXELS_PER_METER  (e.g. 48m at 960px)
WORLD_HEIGHT = canvas.height / PIXELS_PER_METER  (e.g. 48m at 960px)
```

The canvas is square, matching the pattern in `useGravity.ts` where width is clamped to `Math.min(1920, container.clientWidth)` and height equals width.

### Terrain Generation (Terrain.ts)

The initial terrain is a 1D heightmap sampled at regular x-intervals across the world width.

**Heightmap generation:**

```
TERRAIN_RESOLUTION = 200  (number of x-samples)
dx = WORLD_WIDTH / TERRAIN_RESOLUTION
```

For each sample `i`, the height is computed as a sum of octaves of Perlin noise:

```
h(x) = BASE_HEIGHT
     + A1 * noise(x * F1)        // broad hills     (A1=0.35, F1=0.04)
     + A2 * noise(x * F2)        // medium ridges   (A2=0.15, F2=0.12)
     + A3 * noise(x * F3)        // fine detail      (A3=0.05, F3=0.3)
```

Where `BASE_HEIGHT` is ~40% of `WORLD_HEIGHT` (terrain fills the lower portion of the canvas). Heights are stored as an array of `[x, y]` pairs in world coordinates, with `y` pointing up (Box2D convention).

**Box2D representation:**

The heightmap is converted into a `b2ChainShape` attached to a static `b2Body`. The chain connects all sample points plus two "wall" segments that extend vertically at x=0 and x=WORLD_WIDTH down to y=0, forming a closed basin so water can't leak out the sides or bottom.

```
vertices: [
  (0, 0),                         // bottom-left corner
  (0, h[0]),                      // left wall top
  (dx, h[1]),                     // terrain samples...
  (2*dx, h[2]),
  ...
  (WORLD_WIDTH, h[N]),            // right wall top
  (WORLD_WIDTH, 0),               // bottom-right corner
]
```

The chain shape is closed (first vertex connects to last) so the basin is watertight.

**Terrain mutation:**

When erosion removes material, the heightmap array is modified directly and the Box2D chain shape is destroyed and recreated from the updated vertices. This is the simplest approach and plenty fast at 200 vertices per rebuild. The rebuild happens at most once per simulation step (not per particle contact).

### Water Simulation (ErosionWorld.ts)

**Particle system setup:**

```typescript
const psd = new b2ParticleSystemDef();
psd.radius = 0.12; // particle radius in meters (~2.4px)
psd.dampingStrength = 0.3; // slight damping to prevent infinite sloshing
psd.gravityScale = 1.0; // normal gravity
psd.density = 1.0; // water density

const particleSystem = world.CreateParticleSystem(psd);
```

**World gravity:** `(0, -9.8)` — standard Earth gravity, y-down in Box2D convention.

**Stepping:**

```typescript
const TIMESTEP = 1 / 60;
const VELOCITY_ITERATIONS = 6;
const POSITION_ITERATIONS = 2;

// LiquidFun recommends calculating particle iterations from timestep
const particleIterations = world.CalculateReasonableParticleIterations(TIMESTEP);

world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS, particleIterations);
```

**Particle cap:** 4000 maximum active particles. When the count exceeds this, the oldest particles are destroyed using the zombie flag (`b2_zombieParticle`). This mirrors the zip cap (150) in `useGridZips.ts` — same philosophy of bounding compute.

### Rainfall / Mouse Interaction (Cursor.ts)

The mouse interaction follows the patterns established in `useGravity.ts` (PhysicalCursor) and `useGridZips.ts` (mouse-hold spawning), adapted for rainfall:

**Click (instant burst):**
A single click spawns a cluster of 30-60 water particles in a circular area (radius ~1.5m in world space) centered on the cursor's world-space position. Particles get a slight random downward velocity plus a small horizontal spread:

```
vx = random(-1.5, 1.5)
vy = random(-3.0, -1.0)
```

**Hold (continuous rain):**
While mouse is held, spawn 5-10 particles every 3 frames at the cursor position with the same velocity distribution. This mirrors the `mouseDownCooldown` pattern in `useGridZips.ts`.

**Release (cloudburst):**
On release after a hold, spawn a final burst of 2x the normal click amount. Same pattern as the grid zips release mechanic.

**Right-click (drain):**
Right-click creates a temporary `b2Body` (kinematic, follows cursor) with a small box shape that acts as a "drain" — particles that contact it are flagged as zombies. Provides a way to remove water and reset areas. Destroyed on right-mouse-up.

### Erosion Mechanics (ErosionSolver.ts)

This is the core of the simulation. It runs once per frame, after the physics step.

**Step 1: Accumulate contact forces**

Use LiquidFun's `JSContactListener` to intercept `BeginContactParticleSystemParticleBodyContact` events. For each water particle contacting the terrain body, record:

- The contact point (which terrain segment it hit)
- The particle's velocity magnitude at impact

These are accumulated into a per-terrain-segment buffer:

```typescript
interface ErosionAccumulator {
  segmentIndex: number; // which terrain edge segment
  totalImpulse: number; // sum of |velocity| of all particles hitting this segment
  contactCount: number; // number of particle contacts this frame
}
```

**Step 2: Erode terrain vertices**

After stepping the world, iterate the accumulator. For each segment with contacts above a threshold:

```
erosionAmount = EROSION_RATE * totalImpulse * dt
```

The two vertices bounding the contacted segment have their y-values reduced by `erosionAmount`, clamped to a minimum height of 0 (can't erode below the basin floor). A smoothing pass averages each vertex with its neighbors to prevent spiky artifacts:

```
h[i] = 0.25 * h[i-1] + 0.5 * h[i] + 0.25 * h[i+1]
```

The smoothing only runs on vertices that were modified this frame, so undisturbed terrain stays crisp.

**Step 3: Deposit sediment**

For every unit of height removed by erosion, spawn sediment particles near the erosion site. Sediment particles use `b2_powderParticle` behavior (they scatter like sand) and are colored based on the terrain depth they were eroded from — surface material is lighter (tan/ochre), deeper material is darker (brown/umber).

Sediment particles that come to rest (velocity < threshold for N consecutive frames) are converted back into terrain: the nearest heightmap vertex gets a small height increase, and the particle is destroyed. This creates natural deposition — sediment accumulates in valleys and behind obstructions.

**Step 4: Rebuild terrain shape**

If any vertices were modified, destroy the old `b2ChainShape` fixture and create a new one from the updated vertex array. This is the "mutation" step — one rebuild per frame max.

### Erosion Parameters

```typescript
interface ErosionConfig {
  // Terrain
  terrainSeed: number; // Perlin noise seed (random per session)
  terrainResolution: number; // Heightmap sample count (default: 200)
  baseHeight: number; // Base terrain height as fraction of world (default: 0.4)

  // Water
  particleRadius: number; // SPH particle radius in meters (default: 0.12)
  maxParticles: number; // Particle cap (default: 4000)
  damping: number; // Particle damping (default: 0.3)

  // Erosion
  erosionRate: number; // How fast terrain erodes (default: 0.002)
  erosionThreshold: number; // Minimum impulse to erode (default: 0.5)
  depositionRate: number; // How fast sediment deposits (default: 0.6)
  smoothingStrength: number; // Vertex smoothing factor (default: 0.25)

  // Rainfall
  burstSize: number; // Particles per click (default: 45)
  rainRate: number; // Particles per frame while held (default: 8)
  rainSpreadRadius: number; // World-space radius of rain area (default: 1.5)

  // Rendering
  waterHue: number; // Base water hue (default: 210, blue)
  sedimentHue: number; // Base sediment hue (default: 30, tan)
}
```

Follows the `getDefaultErosionConfig()` pattern from `gravity/config.ts`, with some values randomized per session (seed, slight hue variation).

---

## Rendering (Canvas 2D)

All rendering uses the Canvas 2D API, consistent with every other animation in the codebase. No WebGL.

### Terrain Rendering (TerrainRenderer.ts)

The terrain is drawn as a filled polygon using the heightmap vertices, transformed from world to pixel coordinates.

**Layers (back to front):**

1. **Sky gradient** — a vertical linear gradient from deep blue (top) to pale blue/white (horizon line at the average terrain height). Subtle; sets atmosphere.

2. **Deep terrain fill** — the full terrain polygon filled with a vertical gradient from dark brown (bottom) to medium brown (surface). This gives the illusion of geological strata.

3. **Surface line** — the terrain heightmap drawn as a 2px stroked path in a slightly darker shade, giving the ground a defined edge.

4. **Strata lines** — 3-4 horizontal lines at fixed y-positions within the terrain body, drawn only where they're inside the terrain polygon. These suggest rock layers. As erosion carves into the terrain, deeper strata become visible — a visual reward for the user.

### Particle Rendering (ParticleRenderer.ts)

Each frame, read the particle position and color buffers from LiquidFun's `b2ParticleSystem`:

```typescript
const positionBuffer = particleSystem.GetPositionBuffer(); // flat Float32Array [x0,y0,x1,y1,...]
const count = particleSystem.GetParticleCount();
```

**Water particles:**
Drawn as small filled circles (radius = particle radius \* PIXELS_PER_METER). Color is HSL-based using the project's existing `hslToRgb` from `utils/color.ts`:

```
hue:        waterHue (210) + slight variation based on velocity magnitude
saturation: SATURATION (70, from color.ts)
lightness:  LIGHTNESS (55, from color.ts) + velocity brightness boost
opacity:    0.7 (slight transparency so pooled water looks deeper)
```

For performance, water particles with similar colors are batched into single `beginPath()` / `fill()` calls rather than one draw call per particle. Bucket particles into ~8 hue bands and draw each band as a single path of arcs.

**Sediment particles:**
Drawn as small filled squares (2x2px) rather than circles, visually distinguishing them from water. Color uses `sedimentHue` (30, tan) with lightness mapped to the depth they were eroded from.

### Cursor Rendering

When mouse is held, draw a translucent circle at the cursor position showing the rain spread radius. Opacity pulses gently (sine wave on frame count) to indicate active rainfall. When right-click drain is active, draw a small square with a downward arrow icon.

---

## Hook API (useErosion.ts)

Follows the exact patterns from `useGravity.ts`:

```typescript
export interface ErosionConfig {
  // ... (as defined above)
}

export const useErosion = (externalConfig?: ErosionConfig) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const resetTerrainCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // 1. Get canvas + context (same as useGravity lines 32-43)
    // 2. Resize canvas to container width, square aspect ratio
    // 3. Initialize WASM module (async — see WASM Loading below)
    // 4. Build ErosionWorld, Terrain, Cursor, renderers
    // 5. Start animation loop
    // 6. Return cleanup function

    let destroyed = false;

    const init = async () => {
      const Box2D = await import("liquidfun-wasm");
      const box2d = await Box2D.default();
      if (destroyed) return;

      // ... setup world, terrain, particle system, cursor
      // ... animation loop (update → step → erode → render)
    };

    init();

    return () => {
      destroyed = true;
      // cancel rAF, destroy world, remove event listeners
    };
  }, [externalConfig]);

  return {
    canvasRef,
    resetTerrain: () => resetTerrainCallbackRef.current?.(),
  };
};
```

**Key difference from useGravity:** The WASM module load is async, so the init is wrapped in an `async` IIFE inside the effect. A `destroyed` flag prevents setup from completing if the component unmounts during loading. The animation loop itself is synchronous `requestAnimationFrame` as usual — only the initial setup is async.

### WASM Loading

`liquidfun-wasm` exports a factory function that returns a promise resolving to the Box2D module. The WASM binary (`Box2D.wasm`) is co-located with the JS entry and loaded automatically via `fetch`. Vite handles the WASM asset correctly for both dev and production builds when imported as an ES module.

If SIMD is available (most modern browsers), the package automatically uses `Box2D.simd.wasm` for better performance. No configuration needed.

---

## Page Component (Erosion.jsx)

Mirrors `Gravity.jsx` exactly: state-managed config, canvas with ref, CanvasControls panel.

```
Route: /thing/erosion
Title: "Erosion - zfo.gg"
```

### Controls (via CanvasControls)

Exposed as range sliders in the existing CanvasControls component:

| Control           | Config Key         | Range       | Default |
| ----------------- | ------------------ | ----------- | ------- |
| Erosion Rate      | erosionRate        | 0.0005–0.01 | 0.002   |
| Rain Intensity    | rainRate           | 1–20        | 8       |
| Water Damping     | damping            | 0.0–1.0     | 0.3     |
| Terrain Roughness | (regenerates seed) | 1–5 octaves | 3       |
| Deposition Rate   | depositionRate     | 0.1–1.0     | 0.6     |

Plus two buttons following the Gravity page pattern:

- **Default Values** — resets config to `getDefaultErosionConfig()`
- **New Terrain** — calls `resetTerrain()`, regenerates heightmap with a new random seed

### Home Page Integration

Add a new ThingCard to the Home page grid:

```jsx
<ThingCard href="/thing/erosion">erosion</ThingCard>
```

And the route in App.jsx:

```jsx
<Route path="/thing/erosion" element={<Erosion />} />
```

---

## Performance Budget

Target: 60fps on a 2020-era laptop at 960px canvas.

| Component            | Per-Frame Cost   | Budget    |
| -------------------- | ---------------- | --------- |
| Box2D/LiquidFun step | ~4ms at 4k parts | 6ms max   |
| Erosion solver       | ~0.5ms           | 1ms max   |
| Terrain rebuild      | ~0.2ms           | 0.5ms max |
| Canvas 2D render     | ~3ms             | 5ms max   |
| **Total**            | **~8ms**         | **13ms**  |

**Optimizations:**

- Particle cap at 4000 prevents unbounded growth
- Terrain rebuild only when vertices actually changed (dirty flag)
- Particle rendering batched by color bucket (8 draw calls, not 4000)
- Erosion accumulator uses a pre-allocated typed array, not per-frame allocations
- Contact listener only records terrain-body contacts, ignores particle-particle
- The 200-vertex terrain resolution is a sweet spot: detailed enough for natural-looking erosion, cheap enough to rebuild every frame

**Scaling for canvas sizes above 960px:**

At larger canvas sizes, increase `PIXELS_PER_METER` proportionally so the world-space dimensions stay constant. This keeps the particle count (and therefore physics cost) independent of resolution — only the rendering scales, which Canvas 2D handles well.

---

## Animation Loop

The main loop follows the same structure as `useGravity.ts` (lines 211-251):

```
1. cursor.update(mouseState)
2. spawnRainParticles(cursor)          // if mouse active
3. world.Step(dt, velIter, posIter, partIter)
4. erosionSolver.solve(dt)             // accumulate → erode → deposit → rebuild
5. destroyExcessParticles()            // enforce cap
6. clearCanvas(canvas, ctx)
7. terrainRenderer.draw(ctx, terrain)
8. particleRenderer.draw(ctx, particleSystem)
9. cursor.draw(ctx)
10. frameCount++
11. requestAnimationFrame(loop)
```

---

## Color System

Integrates with the existing `utils/color.ts` module (`hslToRgb`, `SATURATION`, `LIGHTNESS`).

**Water:** Base hue 210 (blue). Velocity shifts hue toward 190 (cyan) for fast-moving water and 230 (deeper blue) for still pools. This gives visual feedback about flow speed without any UI — the user can "read" the current patterns by color alone.

**Sediment:** Base hue 30 (warm tan). Lightness varies with erosion depth — surface sediment is L=65 (sandy), deep sediment is L=35 (dark earth). When sediment deposits, it visually darkens the valley floors.

**Terrain gradient:**

- Surface: `hsl(90, 40%, 45%)` — muted green-brown (topsoil)
- Mid-depth: `hsl(30, 35%, 35%)` — warm brown (subsoil)
- Deep: `hsl(15, 25%, 25%)` — dark reddish-brown (bedrock)
- Strata lines: `hsl(0, 0%, 20%)` — dark gray

**Sky:** Vertical gradient from `hsl(215, 60%, 25%)` (top) to `hsl(200, 40%, 75%)` (horizon).

---

## Interaction Summary

| Input              | Action                                       |
| ------------------ | -------------------------------------------- |
| Left click         | Burst of 30-60 rain particles at cursor      |
| Left hold          | Continuous rain (8 particles / 3 frames)     |
| Left release       | Cloudburst (2x burst)                        |
| Right click + hold | Drain tool — removes particles at cursor     |
| Spacebar           | Global rainstorm — rain across entire width  |
| (no input)         | Existing water continues flowing and eroding |

---

## Future Extensions

These are not part of the initial build but are natural next steps if the core works well:

- **Rock types:** Assign different erosion resistance to different height bands. Harder rock erodes slower, creating overhangs and waterfalls.
- **Vegetation:** Particles that spawn on flat terrain above water level, reducing erosion rate where they grow. Creates a feedback loop — erosion exposes soil, vegetation stabilizes it.
- **Time-lapse mode:** Step the simulation at 4x speed with reduced rendering (skip every other frame), letting the user watch geological timescales unfold.
- **Multiple fluids:** Use LiquidFun's `b2_viscousParticle` for a second fluid (lava/mud) with different erosion and deposition properties.
- **Audio:** Procedural water sounds using Web Audio API whose volume and pitch map to total particle velocity. A natural bridge to Sidechain's audio domain.
- **Export:** Capture the final terrain heightmap as a downloadable SVG path or PNG, so eroded landscapes can be used as art or game assets.
