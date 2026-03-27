import type { StressGraphConfig } from "./config";
import type { SeedField } from "./SeedField";

export interface CursorState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isRightHeld: boolean;
  lastMoveTime: number;
}

export class StressModel {
  cursor: CursorState = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    isRightHeld: false,
    lastMoveTime: 0,
  };

  private prevX = 0;
  private prevY = 0;
  private handlers: Map<string, EventListener> = new Map();

  constructor(
    private canvas: HTMLCanvasElement,
    private config: StressGraphConfig,
  ) {}

  attach(): void {
    const onMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.prevX = this.cursor.x;
      this.prevY = this.cursor.y;
      this.cursor.x = (e.clientX - rect.left) * scaleX;
      this.cursor.y = (e.clientY - rect.top) * scaleY;
      this.cursor.lastMoveTime = performance.now();
    };

    const onDown = (e: MouseEvent) => {
      if (e.button === 2) this.cursor.isRightHeld = true;
    };

    const onUp = (e: MouseEvent) => {
      if (e.button === 2) this.cursor.isRightHeld = false;
    };

    this.canvas.addEventListener("mousemove", onMove as EventListener);
    this.canvas.addEventListener("mousedown", onDown as EventListener);
    this.canvas.addEventListener("mouseup", onUp as EventListener);
    document.addEventListener("mouseup", onUp as EventListener);

    this.handlers.set("mousemove", onMove as EventListener);
    this.handlers.set("mousedown", onDown as EventListener);
    this.handlers.set("mouseup", onUp as EventListener);
  }

  detach(): void {
    this.canvas.removeEventListener("mousemove", this.handlers.get("mousemove")!);
    this.canvas.removeEventListener("mousedown", this.handlers.get("mousedown")!);
    this.canvas.removeEventListener("mouseup", this.handlers.get("mouseup")!);
    document.removeEventListener("mouseup", this.handlers.get("mouseup")!);
  }

  update(): CursorState {
    this.cursor.vx = this.cursor.x - this.prevX;
    this.cursor.vy = this.cursor.y - this.prevY;
    this.prevX = this.cursor.x;
    this.prevY = this.cursor.y;
    return { ...this.cursor };
  }

  applyRepulsion(seedField: SeedField): void {
    const { x, y, vx, vy } = this.cursor;
    const speed = Math.hypot(vx, vy);
    if (speed < 0.5) return;

    const R = this.config.mouseRepulsionRadius;
    const strength = this.config.mouseRepulsionStrength;

    for (const s of seedField.seeds) {
      const dx = s.x - x;
      const dy = s.y - y;
      const dist = Math.hypot(dx, dy);

      if (dist < 1 || dist > R) continue;

      const falloff = 1 - dist / R;
      const mag = speed * strength * falloff * falloff;
      seedField.applyImpulse(s.id, (dx / dist) * mag, (dy / dist) * mag);
    }
  }

  applyGravityWell(seedField: SeedField): void {
    const { x, y } = this.cursor;
    const strength = this.config.gravityWellStrength;

    for (const s of seedField.seeds) {
      const dx = x - s.x;
      const dy = y - s.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 1) continue;

      const mag = strength / Math.max(dist, 30);
      seedField.applyImpulse(s.id, (dx / dist) * mag, (dy / dist) * mag);
    }
  }

  isIdle(): boolean {
    return performance.now() - this.cursor.lastMoveTime > this.config.idleHealDelay;
  }
}
