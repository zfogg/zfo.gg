import type { StressGraphConfig } from "./config";

export interface Seed {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  anchorX: number;
  anchorY: number;
  mass: number;
  hue: number; // 0–360
  hueVelocity: number; // degrees/frame
  stress: number; // 0–1, computed each frame
  parentId: number | null;
}

export interface GLSeedData {
  positions: Float32Array; // [x0, y0_FLIPPED, x1, y1_FLIPPED, ...]
  hues: Float32Array;
  stresses: Float32Array;
  count: number;
}

export class SeedField {
  seeds: Seed[] = [];
  private nextId = 0;
  private width: number;
  private height: number;

  getNextId(): number {
    return this.nextId;
  }

  resetId(): void {
    this.nextId = 0;
  }

  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  constructor(
    private config: StressGraphConfig,
    width: number,
    height: number,
  ) {
    this.width = width;
    this.height = height;
  }

  // Mitchell's best-candidate Poisson disk: for each of seedCount seeds,
  // generate k=30 random candidates, keep the one farthest from existing seeds.
  initialize(): void {
    const n = this.config.seedCount;
    const k = 30;
    this.seeds = [];

    for (let i = 0; i < n; i++) {
      let bestX = 0;
      let bestY = 0;
      let bestDist = -1;

      for (let j = 0; j < k; j++) {
        const cx = Math.random() * this.width;
        const cy = Math.random() * this.height;
        let minD = Infinity;

        for (const s of this.seeds) {
          const d = Math.hypot(s.x - cx, s.y - cy);
          if (d < minD) minD = d;
        }

        if (minD > bestDist) {
          bestDist = minD;
          bestX = cx;
          bestY = cy;
        }
      }

      this.seeds.push({
        id: this.nextId++,
        x: bestX,
        y: bestY,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        anchorX: bestX,
        anchorY: bestY,
        mass: 1.0,
        hue: Math.random() * 360,
        hueVelocity:
          this.config.hueVelocityMin +
          Math.random() * (this.config.hueVelocityMax - this.config.hueVelocityMin),
        stress: 0,
        parentId: null,
      });
    }
  }

  step(deltaTime: number): void {
    const dt = this.config.dt * deltaTime;
    const margin = 20;

    for (const s of this.seeds) {
      // Spring force toward anchor
      s.vx += -this.config.springK * (s.x - s.anchorX) * dt;
      s.vy += -this.config.springK * (s.y - s.anchorY) * dt;

      // Damping
      s.vx *= this.config.damping;
      s.vy *= this.config.damping;

      // Update position
      s.x += s.vx;
      s.y += s.vy;

      // Update hue
      s.hue = (s.hue + s.hueVelocity) % 360;

      // Compute stress (displacement from anchor)
      const dx = s.x - s.anchorX;
      const dy = s.y - s.anchorY;
      const maxDim = Math.max(this.width, this.height);
      s.stress = Math.min(1, Math.hypot(dx, dy) / (maxDim * 0.05));

      // Boundary repulsion
      if (s.x < margin) s.vx += (margin - s.x) * 0.5;
      else if (s.x > this.width - margin) s.vx -= (s.x - (this.width - margin)) * 0.5;

      if (s.y < margin) s.vy += (margin - s.y) * 0.5;
      else if (s.y > this.height - margin) s.vy -= (s.y - (this.height - margin)) * 0.5;
    }
  }

  applyImpulse(seedId: number, fx: number, fy: number): void {
    const s = this.seeds.find((s) => s.id === seedId);
    if (s) {
      s.vx += fx;
      s.vy += fy;
    }
  }

  addSeed(
    x: number,
    y: number,
    vx: number,
    vy: number,
    anchorX: number,
    anchorY: number,
    hue: number,
    parentId: number | null,
  ): Seed | null {
    if (this.seeds.length >= this.config.maxSeeds) return null;

    const s: Seed = {
      id: this.nextId++,
      x,
      y,
      vx: vx || (Math.random() - 0.5) * 2,
      vy: vy || (Math.random() - 0.5) * 2,
      anchorX,
      anchorY,
      mass: 1,
      hue,
      hueVelocity:
        this.config.hueVelocityMin +
        Math.random() * (this.config.hueVelocityMax - this.config.hueVelocityMin),
      stress: 0,
      parentId,
    };

    this.seeds.push(s);
    return s;
  }

  removeSeed(id: number): void {
    this.seeds = this.seeds.filter((s) => s.id !== id);
  }

  randomizeHues(): void {
    for (const s of this.seeds) s.hue = Math.random() * 360;
  }

  // Y-flip for WebGL: WebGL (0,0)=bottom-left, Canvas2D (0,0)=top-left
  packForGL(): GLSeedData {
    const n = this.seeds.length;
    const positions = new Float32Array(n * 2);
    const hues = new Float32Array(n);
    const stresses = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const s = this.seeds[i];
      positions[i * 2] = s.x;
      positions[i * 2 + 1] = this.height - s.y; // FLIP Y
      hues[i] = s.hue;
      stresses[i] = s.stress;
    }

    return { positions, hues, stresses, count: n };
  }
}
