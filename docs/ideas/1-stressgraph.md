# 1: Voronoi Stress Graph

An interactive Voronoi tessellation where cell boundaries warp and distort under cursor "pressure." Colors drift through the cells using the project's HSL hue system. The diagram responds to mouse velocity, clicks, and holds — calm when idle, chaotic under stress.

Route: `/thing/stressgraph`

---

## Overview

The canvas is divided into a Voronoi diagram generated from a set of seed points. At rest, the cells are static and evenly colored. As the mouse moves, nearby cell boundaries deform based on cursor velocity and proximity — fast motion creates violent distortion, slow motion creates gentle ripples. The seed points themselves are displaced by cursor forces using a spring-damper system, so the topology shifts over time and relaxes back to equilibrium when the mouse stops.

Clicks "fracture" cells — splitting a single cell into 2-4 smaller ones with a brief crack-propagation animation. Right-click-hold creates a gravity well that pulls seed points inward, collapsing the diagram before they spring back on release. The overall effect is a material under stress — a stained-glass window being pushed, pulled, and shattered.

---

## Architecture

### File Structure

```
client/src/
  hooks/
    useStressGraph.ts            # Main simulation hook (owns loop, cleanup)
  stressgraph/
    VoronoiSolver.ts             # Fortune's algorithm + incremental updates
    SeedField.ts                 # Seed point physics (spring-damper system)
    StressModel.ts               # Cursor → force field mapping
    CellRenderer.ts              # Canvas 2D cell fill + boundary drawing
    FractureSystem.ts            # Click-triggered cell splitting + animation
    config.ts                    # Default config with getDefaultStressGraphConfig()
  pages/
    StressGraph.jsx              # Page component (mirrors Gravity.jsx pattern)
```

### Dependencies

None beyond what's already in the project. Pure Canvas 2D + requestAnimationFrame + math. No external libraries.

---

## Simulation Design

### Coordinate System

Everything operates in pixel space directly (no world/pixel conversion needed — this is 2D geometry, not physics). The canvas is square, matching the existing pattern:

```typescript
canvas.width = Math.min(1920, container.clientWidth);
canvas.height = canvas.width;
```

### Seed Field (SeedField.ts)

The Voronoi diagram is defined by N seed points. Each seed is a point-mass with position, velocity, and an anchor (its rest position).

**Initialization:**

Seeds are distributed using a Poisson disk sampling algorithm to ensure even spacing. This prevents clumpy initial layouts that pure random placement would give. The sampling radius is derived from the canvas size and seed count:

```
samplingRadius = canvas.width / sqrt(seedCount) * 0.8
```

Default seed count: 80 (produces ~80 cells, visually dense enough to be interesting but cheap enough to tessellate every frame).

**Per-seed state:**

```typescript
interface Seed {
  id: number;
  x: number; // current position
  y: number;
  vx: number; // velocity
  vy: number;
  anchorX: number; // rest position (where it wants to return to)
  anchorY: number;
  mass: number; // affects inertia (default: 1.0)
  hue: number; // cell fill hue (HSL)
  hueVelocity: number; // hue drift rate
}
```

**Spring-damper physics:**

Each frame, every seed is pulled toward its anchor by a spring force and slowed by damping:

```
F_spring = -k * (position - anchor)
F_damper = -d * velocity
F_total  = F_spring + F_damper + F_external

acceleration = F_total / mass
velocity += acceleration * dt
position += velocity * dt
```

Constants:

- `k` (spring stiffness): 2.0 — seeds return to rest in ~1 second
- `d` (damping): 0.85 — critically damped, minimal oscillation
- `dt`: 1/60

Seeds are clamped to canvas bounds with elastic reflection (same pattern as `PhysicalSquare` in `useGravity.ts`).

### Stress Model (StressModel.ts)

The cursor generates a force field that displaces nearby seeds. The model converts raw mouse input into per-seed external forces.

**Proximity force (continuous):**

While the mouse is on the canvas, every seed within a radius `R` of the cursor receives a repulsion force:

```
distance = dist(seed, cursor)
if distance < R:
  strength = (1 - distance / R)^2 * cursorVelocityMagnitude * pushForce
  direction = normalize(seed.position - cursor.position)
  F_external = direction * strength
```

- `R` (influence radius): 150px default
- `pushForce`: 0.4 default
- The `cursorVelocityMagnitude` term means stationary cursor exerts zero force — you have to move to stress the graph

**Velocity wake:**

In addition to radial repulsion, seeds receive a tangential force in the direction of cursor motion. This creates a "wake" effect — seeds don't just push away, they swirl:

```
tangent = normalize(cursorVelocity)
F_wake = tangent * wakeStrength * falloff
```

- `wakeStrength`: 0.15 default
- `falloff`: same `(1 - distance / R)^2` as the proximity force

**Click impulse:**

On left click, all seeds within radius `R * 1.5` receive a one-time radial impulse (velocity spike, not continuous force). Magnitude proportional to `(1 - distance / (R * 1.5))`:

```
impulse = 8.0 * (1 - distance / (R * 1.5))
seed.vx += dirX * impulse
seed.vy += dirY * impulse
```

**Right-click gravity well:**

While right mouse is held, the force model switches from repulsion to attraction within the influence radius. Seeds accelerate toward the cursor, the Voronoi cells compress, and the diagram distorts inward. On release, the spring-damper system snaps everything back — the rebound creates a satisfying expansion wave.

```
F_gravity = -direction * wellStrength * falloff
```

- `wellStrength`: 0.6 default

### Voronoi Solver (VoronoiSolver.ts)

The Voronoi diagram must be recomputed every frame since seed positions change continuously.

**Algorithm: Fortune's sweep line**

Fortune's algorithm computes a Voronoi diagram in O(n log n) time. At 80 seeds this takes <0.5ms. The implementation is self-contained (no library dependency), computing:

1. The list of Voronoi vertices (polygon corners)
2. The list of edges connecting vertices
3. The cell for each seed (ordered list of vertices forming its polygon)

**Clipping:**

Voronoi cells at the canvas edge extend to infinity. These are clipped to the canvas bounding rectangle. Each cell becomes a closed convex polygon suitable for Canvas 2D `fill()`.

**Output per frame:**

```typescript
interface VoronoiCell {
  seedId: number;
  vertices: Array<[number, number]>; // ordered polygon vertices (clockwise)
  neighbors: number[]; // adjacent cell seed IDs
  area: number; // polygon area (used for rendering)
}
```

**Optimization — spatial hashing for neighbor queries:**

Rather than checking all 80 seeds against the cursor, a simple grid hash (cell size = influence radius) provides O(1) lookup for seeds within cursor range. This matters more if seed count increases via fracturing.

### Fracture System (FractureSystem.ts)

Clicking fractures the nearest Voronoi cell, splitting it into smaller cells. This is the most visually dramatic mechanic.

**On click:**

1. Find the seed nearest to the click point
2. Determine the cell's area — larger cells split into more pieces (2-4 children)
3. Replace the parent seed with N child seeds positioned around the parent's location:

```
childPositions = parent.position + polarOffset(angle, radius)
angle = (i / N) * 2 * PI + randomJitter
radius = sqrt(parent.area / PI) * 0.3
```

4. Child seeds inherit the parent's velocity plus a radial burst (outward from click)
5. Child anchors are set to their spawn positions — they won't try to return to the parent's anchor
6. Child hues are slight variations of the parent hue (parent.hue +/- random(5, 15))

**Fracture animation:**

The split doesn't happen instantly. Over 8-12 frames:

- Frame 0: Parent cell gets a bright white border flash (crack initiation)
- Frames 1-4: A crack line propagates from the click point to the cell edges, drawn as a jagged 2px white line using midpoint displacement
- Frames 5-8: The crack widens, the parent cell fades, and child cells emerge at reduced opacity
- Frames 8-12: Child cells reach full opacity, crack line fades

This is tracked as an array of active `FractureAnimation` objects, each with a `progress: number` (0.0 to 1.0) that advances each frame.

**Seed cap:**

Fracturing adds seeds. Cap at 200 total. When approaching the cap, the oldest/smallest cells are merged back into their neighbors (reverse fracture — the smallest seed is removed and its neighbor absorbs its area). This keeps the simulation bounded.

**Healing:**

If no mouse interaction occurs for 5 seconds, cells slowly merge back toward the original seed count. One merge per second, smallest cell first. The diagram gradually "heals" to its initial state. This provides a natural reset without a button.

### Hue System

Each seed carries a `hue` and `hueVelocity`. The hue drifts continuously:

```
seed.hue += seed.hueVelocity * dt
```

`hueVelocity` is initialized with slight random variation per seed (range: 0.1-0.5 degrees/frame), so colors drift at different rates, creating slow, organic color evolution across the diagram.

**Stress coloring:**

When a seed is displaced far from its anchor, its hue shifts faster and its saturation increases:

```
displacement = dist(position, anchor)
stressFactor = clamp(displacement / maxDisplacement, 0, 1)

effectiveHue = seed.hue + stressFactor * 60    // shift toward warmer hues under stress
effectiveSaturation = SATURATION + stressFactor * 20
effectiveLightness = LIGHTNESS - stressFactor * 10  // darken under stress
```

This means calm cells are cool-toned and muted, stressed cells are warm and vivid. The user can "see" the stress field by color alone.

**Color uses the existing `hslToRgb` from `utils/color.ts`** and the project constants `SATURATION` (70) and `LIGHTNESS` (55) as baselines.

---

## Rendering (Canvas 2D)

### Cell Rendering (CellRenderer.ts)

**Per frame, back to front:**

1. **Background** — solid `#111` (near-black). The dark background makes the colored cells pop and the white boundary lines visible.

2. **Cell fills** — each cell polygon is filled with its computed HSL color. Cells are drawn as `ctx.beginPath()` → `moveTo` → `lineTo` loop → `ctx.fill()`. Batched by similar hue (8 buckets) to minimize fill style changes.

3. **Cell boundaries** — all Voronoi edges drawn as a single stroked path. Default: 1.5px, `rgba(255, 255, 255, 0.3)`. Under stress (cursor nearby), edge opacity increases to 0.8 and width increases to 2.5px, proportional to the average displacement of the two cells sharing the edge. This makes the "stress lines" visually prominent.

4. **Seed points** — small dots (3px radius) at each seed position, drawn at 0.2 opacity. Subtle, but they provide visual anchoring. During fracture animation, the parent seed flashes white.

5. **Cursor influence ring** — a dashed circle at the cursor position showing the influence radius `R`. Opacity tracks cursor velocity (invisible when still, visible when moving). Drawn with `ctx.setLineDash([4, 8])`.

6. **Fracture cracks** — active fracture animations are drawn on top as white jagged lines with glow (`ctx.shadowColor = 'white'`, `ctx.shadowBlur = 6`). They fade over the animation duration.

### Performance

At 80 seeds, the Voronoi computation is ~0.3ms. Rendering 80 filled polygons with boundaries is ~2ms. Even at the 200-seed cap after heavy fracturing, total frame time stays under 5ms. No optimization beyond the hue-bucketed fill batching is needed.

---

## Hook API (useStressGraph.ts)

Follows the exact `useGravity.ts` pattern — synchronous setup, no async loading needed (no WASM):

```typescript
export interface StressGraphConfig {
  seedCount: number;
  springStiffness: number;
  damping: number;
  influenceRadius: number;
  pushForce: number;
  wakeStrength: number;
  wellStrength: number;
  clickImpulse: number;
  maxSeeds: number;
  healDelay: number;
}

export const useStressGraph = (externalConfig?: StressGraphConfig) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const resetCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas (same as useGravity lines 39-43)
    const container = canvas.parentElement;
    if (container) {
      canvas.width = Math.min(1920, container.clientWidth);
      canvas.height = canvas.width;
    }

    const config = { ...(externalConfig || getDefaultStressGraphConfig()) };

    // Initialize seed field, Voronoi solver, stress model, fracture system
    // ... (all synchronous, no WASM)

    // Mouse/touch event listeners on canvas
    // ... (same addEventListener pattern as useGravity.ts PhysicalCursor)

    const main = () => {
      // 1. Update stress model from mouse state
      // 2. Apply forces to seeds (spring + damper + external)
      // 3. Step seed positions
      // 4. Run fracture animations
      // 5. Check healing timer
      // 6. Recompute Voronoi diagram
      // 7. Clear canvas
      // 8. Render cells, boundaries, effects
      // 9. requestAnimationFrame(main)
    };

    main();

    return () => {
      // Cancel rAF, remove event listeners
    };
  }, [externalConfig]);

  return {
    canvasRef,
    reset: () => resetCallbackRef.current?.(),
  };
};
```

---

## Config Defaults

```typescript
export const getDefaultStressGraphConfig = (): StressGraphConfig => ({
  seedCount: 80,
  springStiffness: 2.0,
  damping: 0.85,
  influenceRadius: 150,
  pushForce: 0.4,
  wakeStrength: 0.15,
  wellStrength: 0.6,
  clickImpulse: 8.0,
  maxSeeds: 200,
  healDelay: 5.0, // seconds of idle before healing begins
});
```

Following the `gravity/config.ts` pattern, some values could be lightly randomized per session (e.g., `seedCount: randomBetween(60, 100)`).

---

## Page Component (StressGraph.jsx)

Mirrors `Gravity.jsx`:

```
Route: /thing/stressgraph
Title: "Stress Graph - zfo.gg"
```

### Controls (via CanvasControls)

| Control          | Config Key      | Range   | Default |
| ---------------- | --------------- | ------- | ------- |
| Cell Count       | seedCount       | 20-150  | 80      |
| Spring Stiffness | springStiffness | 0.5-6.0 | 2.0     |
| Push Force       | pushForce       | 0.1-1.5 | 0.4     |
| Influence Radius | influenceRadius | 50-300  | 150     |
| Wake Strength    | wakeStrength    | 0.0-0.5 | 0.15    |
| Well Strength    | wellStrength    | 0.1-2.0 | 0.6     |

Plus two buttons:

- **Default Values** — resets config to `getDefaultStressGraphConfig()`
- **Regenerate** — calls `reset()`, new Poisson disk seed distribution

### Home Page Integration

Add a ThingCard to the Home page grid:

```jsx
<ThingCard href="/thing/stressgraph">stressgraph</ThingCard>
```

And the route in App.jsx:

```jsx
<Route path="/thing/stressgraph" element={<StressGraph />} />
```

---

## Performance Budget

Target: 60fps on a 2020-era laptop at 960px canvas.

| Component        | Per-Frame Cost | Budget  |
| ---------------- | -------------- | ------- |
| Seed physics     | ~0.1ms (80)    | 0.3ms   |
| Voronoi solve    | ~0.3ms (80)    | 1.0ms   |
| Fracture system  | ~0.1ms         | 0.3ms   |
| Canvas 2D render | ~2.0ms         | 4.0ms   |
| **Total**        | **~2.5ms**     | **6ms** |

This is well within budget even at the 200-seed cap after heavy fracturing (~4ms Voronoi + ~3ms render = ~7ms total). No WASM, no physics engine overhead — it's pure geometry and spring math.

---

## Animation Loop

```
1.  cursor.update(mouseState)
2.  stressModel.computeForces(cursor, seeds)
3.  seedField.step(dt)                          // spring-damper + external forces
4.  fractureSystem.update(dt)                   // advance crack animations, handle merges
5.  if (idleTime > healDelay) healSmallestCell()
6.  voronoi = voronoiSolver.compute(seeds)      // Fortune's algorithm
7.  clearCanvas(canvas, ctx)
8.  cellRenderer.drawFills(ctx, voronoi, seeds)
9.  cellRenderer.drawBoundaries(ctx, voronoi, seeds, cursor)
10. cellRenderer.drawSeeds(ctx, seeds)
11. fractureSystem.drawCracks(ctx)
12. cursor.drawInfluenceRing(ctx)
13. requestAnimationFrame(loop)
```

---

## Color System

Uses `utils/color.ts` (`hslToRgb`, `SATURATION`, `LIGHTNESS`) throughout.

**Cell fills at rest:**

- Hue: per-seed, drifting slowly (0.1-0.5 deg/frame)
- Saturation: `SATURATION` (70)
- Lightness: `LIGHTNESS` (55)
- Result: the same rich, saturated palette as the grid zips and colorshifter

**Cell fills under stress:**

- Hue shifts +60 (toward warm)
- Saturation increases to 90
- Lightness drops to 45
- The transition is proportional to displacement — gradient, not binary

**Boundaries at rest:** `rgba(255, 255, 255, 0.3)`, 1.5px
**Boundaries under stress:** `rgba(255, 255, 255, 0.8)`, 2.5px — the stress "glows" through the cracks

**Fracture cracks:** Pure white with 6px glow shadow, fading over the animation

**Background:** `#111` — near-black to maximize cell color contrast

---

## Interaction Summary

| Input              | Action                                          |
| ------------------ | ----------------------------------------------- |
| Mouse move         | Repel nearby seeds + tangential wake force      |
| Left click         | Radial impulse + fracture nearest cell          |
| Right click + hold | Gravity well — attract seeds toward cursor      |
| Right release      | Spring rebound — expansion wave                 |
| Spacebar           | Randomize all seed hues (instant palette shift) |
| (idle 5s)          | Cells slowly heal/merge back to initial count   |

---

## Future Extensions

- **Audio reactivity:** Feed Web Audio API frequency bins into the stress model as external forces on seed positions. Music makes the diagram dance. Natural Sidechain crossover.
- **3D depth:** Extrude cell fills with a slight parallax offset based on area — larger cells appear closer. Pure CSS transform on overlaid divs or Canvas 2D perspective faking.
- **Multi-touch:** On touch devices, each finger is an independent stress source. Two fingers create competing force fields with interference patterns between them.
- **Screenshot mode:** Freeze the simulation, hide the cursor ring, and export the current frame as a high-res PNG. Generative art output.
- **Seed painting:** Hold shift + drag to paint new seed points freehand, creating custom Voronoi layouts. The painted seeds are fixed (infinite spring stiffness) while the original seeds remain dynamic.
