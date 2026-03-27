import type { StressGraphConfig } from "./config";
import type { SeedField } from "./SeedField";

export interface CrackLine {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  stress: number;
}

export class FractureSystem {
  crackLines: CrackLine[] = [];
  private nextCrackId = 0;
  private lastHealTime = performance.now();

  constructor(
    private config: StressGraphConfig,
    private originalSeedCount: number,
  ) {}

  fracture(mx: number, my: number, seedField: SeedField): void {
    if (seedField.seeds.length === 0) return;

    // Find the closest seed (cell being clicked)
    let closestSeed = seedField.seeds[0];
    let closestDist = Math.hypot(closestSeed.x - mx, closestSeed.y - my);

    for (const seed of seedField.seeds) {
      const dist = Math.hypot(seed.x - mx, seed.y - my);
      if (dist < closestDist) {
        closestDist = dist;
        closestSeed = seed;
      }
    }

    // Find the nearest neighbor to define the break direction (widest Voronoi edge)
    let nearestNeighbor = seedField.seeds.find((s) => s.id !== closestSeed.id);
    if (!nearestNeighbor) return;

    let nearestNeighborDist = Math.hypot(
      nearestNeighbor.x - closestSeed.x,
      nearestNeighbor.y - closestSeed.y,
    );

    for (const seed of seedField.seeds) {
      if (seed.id === closestSeed.id) continue;

      const dist = Math.hypot(seed.x - closestSeed.x, seed.y - closestSeed.y);
      if (dist < nearestNeighborDist) {
        nearestNeighborDist = dist;
        nearestNeighbor = seed;
      }
    }

    // Compute break direction (along the line between the two seeds)
    const edgeDx = nearestNeighbor.x - closestSeed.x;
    const edgeDy = nearestNeighbor.y - closestSeed.y;
    const edgeDist = Math.max(Math.hypot(edgeDx, edgeDy), 1);
    const edgeNx = edgeDx / edgeDist;
    const edgeNy = edgeDy / edgeDist;

    // Perpendicular to the edge (break direction)
    const breakNx = -edgeNy;
    const breakNy = edgeNx;

    const impulse = this.config.fractureImpulse;
    const offset = 25 + Math.random() * 15;

    // Fracture the closest seed
    if (seedField.seeds.length < this.config.maxSeeds) {
      seedField.applyImpulse(closestSeed.id, breakNx * impulse, breakNy * impulse);

      const child1 = seedField.addSeed(
        closestSeed.x + breakNx * offset,
        closestSeed.y + breakNy * offset,
        -breakNx * impulse * 0.5,
        -breakNy * impulse * 0.5,
        closestSeed.anchorX + breakNx * offset * 0.5,
        closestSeed.anchorY + breakNy * offset * 0.5,
        (closestSeed.hue + 30 + Math.random() * 30) % 360,
        closestSeed.id,
      );

      if (child1) {
        this.crackLines.push({
          id: this.nextCrackId++,
          x1: mx,
          y1: my,
          x2: closestSeed.x,
          y2: closestSeed.y,
          opacity: 1.0,
          stress: closestSeed.stress,
        });
      }
    }

    // Optionally fracture the neighbor seed as well
    if (seedField.seeds.length < this.config.maxSeeds && Math.random() < 0.3) {
      seedField.applyImpulse(
        nearestNeighbor.id,
        -breakNx * impulse * 0.5,
        -breakNy * impulse * 0.5,
      );

      const child2 = seedField.addSeed(
        nearestNeighbor.x - breakNx * offset * 0.5,
        nearestNeighbor.y - breakNy * offset * 0.5,
        breakNx * impulse * 0.3,
        breakNy * impulse * 0.3,
        nearestNeighbor.anchorX - breakNx * offset * 0.25,
        nearestNeighbor.anchorY - breakNy * offset * 0.25,
        (nearestNeighbor.hue + 30 + Math.random() * 30) % 360,
        nearestNeighbor.id,
      );

      if (child2) {
        this.crackLines.push({
          id: this.nextCrackId++,
          x1: closestSeed.x,
          y1: closestSeed.y,
          x2: nearestNeighbor.x,
          y2: nearestNeighbor.y,
          opacity: 0.8,
          stress: nearestNeighbor.stress,
        });
      }
    }
  }

  updateCracks(deltaTime: number): void {
    const decay = 0.015 * deltaTime;
    this.crackLines = this.crackLines
      .map((c) => ({ ...c, opacity: c.opacity - decay }))
      .filter((c) => c.opacity > 0);
  }

  tryHeal(seedField: SeedField, isIdle: boolean): void {
    if (!isIdle) {
      this.lastHealTime = performance.now();
      return;
    }

    if (performance.now() - this.lastHealTime < this.config.healIntervalMs) return;

    if (seedField.seeds.length <= this.originalSeedCount) return;

    this.lastHealTime = performance.now();

    const children = seedField.seeds.filter((s) => s.parentId !== null);
    const toRemove =
      children.length > 0
        ? children.reduce((a, b) => (a.id > b.id ? a : b))
        : seedField.seeds.reduce((a, b) => (a.id > b.id ? a : b));

    seedField.removeSeed(toRemove.id);
  }

  touch(): void {
    this.lastHealTime = performance.now();
  }
}
