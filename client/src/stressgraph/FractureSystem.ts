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
    const sorted = [...seedField.seeds].sort(
      (a, b) => Math.hypot(a.x - mx, a.y - my) - Math.hypot(b.x - mx, b.y - my),
    );

    const splitCount = 2 + Math.floor(Math.random() * 3);

    for (const seed of sorted.slice(0, splitCount)) {
      if (seedField.seeds.length >= this.config.maxSeeds) break;

      const dx = seed.x - mx;
      const dy = seed.y - my;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      const impulse = this.config.fractureImpulse * (1 - dist / this.config.fractureRadius);

      if (impulse <= 0) continue;

      const nx = dx / dist;
      const ny = dy / dist;
      seedField.applyImpulse(seed.id, nx * impulse, ny * impulse);

      const perpX = -ny;
      const perpY = nx;
      const offset = 15 + Math.random() * 20;

      const child = seedField.addSeed(
        seed.x + perpX * offset,
        seed.y + perpY * offset,
        -nx * impulse * 0.7,
        -ny * impulse * 0.7,
        seed.anchorX + perpX * offset * 0.5,
        seed.anchorY + perpY * offset * 0.5,
        (seed.hue + 20 + Math.random() * 40) % 360,
        seed.id,
      );

      if (child) {
        this.crackLines.push({
          id: this.nextCrackId++,
          x1: mx,
          y1: my,
          x2: seed.x,
          y2: seed.y,
          opacity: 1.0,
          stress: seed.stress,
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
