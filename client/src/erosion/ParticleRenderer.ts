import { hslToRgb } from "../utils/color";
import type { ErosionConfig } from "./config";
import { PIXELS_PER_METER } from "./ErosionWorld";

const SATURATION = 70;
const LIGHTNESS = 55;

export class ParticleRenderer {
  draw(
    ctx: CanvasRenderingContext2D,
    particleSystem: any,
    config: ErosionConfig,
    frameCount: number,
    box2d: any,
  ): void {
    const particleCount = particleSystem.GetParticleCount();
    if (particleCount === 0) return;

    const canvas = ctx.canvas;
    const height = canvas.height;

    // Access WASM heap buffers for position and velocity data.
    // GetPositionBuffer/GetVelocityBuffer return b2Vec2 pointers into the WASM heap.
    // We read them as flat float arrays: [x0, y0, x1, y1, ...]
    let positions: Float32Array;
    let velocities: Float32Array | null = null;

    try {
      const posPtr = box2d.getPointer(particleSystem.GetPositionBuffer());
      positions = new Float32Array(box2d.HEAPF32.buffer, posPtr, particleCount * 2);
    } catch {
      return; // Can't render without positions
    }

    try {
      const velPtr = box2d.getPointer(particleSystem.GetVelocityBuffer());
      velocities = new Float32Array(box2d.HEAPF32.buffer, velPtr, particleCount * 2);
    } catch {
      // Velocity buffer not available, will use position-based variation instead
    }

    // Determine particle flags if available
    const b2_powderParticle = box2d.b2_powderParticle || 0x0008;

    // Batch water particles by hue
    const hueBuckets = new Map<number, Array<{ x: number; y: number }>>();
    const sedimentParticles: Array<{
      x: number;
      y: number;
      depth: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];

      if (!isFinite(x) || !isFinite(y)) continue;

      const px = x * PIXELS_PER_METER;
      const py = height - y * PIXELS_PER_METER;

      // Check if particle is sediment (powder) via per-particle flags API
      let isSediment = false;
      try {
        isSediment = (particleSystem.GetParticleFlags(i) & b2_powderParticle) !== 0;
      } catch {
        // Flags not available
      }

      if (isSediment) {
        const depthFraction = Math.max(0, 1 - y / (height * 0.5));
        sedimentParticles.push({ x: px, y: py, depth: depthFraction });
      } else {
        let vx = 0;
        let vy = 0;
        if (velocities) {
          vx = velocities[i * 2];
          vy = velocities[i * 2 + 1];
        }

        const velocityMag = Math.sqrt(vx * vx + vy * vy);
        const hueShift = Math.min(40, velocityMag * 10);
        const hue = Math.round(((config.waterHue - hueShift + frameCount * 0.5) % 360) / 45) * 45;

        if (!hueBuckets.has(hue)) {
          hueBuckets.set(hue, []);
        }
        hueBuckets.get(hue)!.push({ x: px, y: py });
      }
    }

    // Draw water particles by hue bucket with 0.7 opacity
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.7;

    for (const [hue, particles] of hueBuckets) {
      const [r, g, b] = hslToRgb(hue, SATURATION, LIGHTNESS);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      ctx.beginPath();
      for (const p of particles) {
        const radius = config.particleRadius * PIXELS_PER_METER;
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Draw sediment particles as small squares (different from water circles)
    ctx.globalAlpha = 0.8;
    for (const p of sedimentParticles) {
      // Lightness varies by depth: surface = light tan (L=65), deep = dark earth (L=35)
      const lightness = 35 + p.depth * 30;
      const [r, g, b] = hslToRgb(config.sedimentHue, 60, lightness);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      const size = config.particleRadius * PIXELS_PER_METER;
      ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    }

    ctx.globalAlpha = previousAlpha;
  }
}
