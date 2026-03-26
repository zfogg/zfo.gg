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
    const posBuffer = particleSystem.GetPositionBuffer();
    const particleCount = particleSystem.GetParticleCount();

    if (particleCount === 0 || !posBuffer) return;

    const canvas = ctx.canvas;
    const height = canvas.height;

    // Try to get velocity buffer for velocity-based effects
    let velocityBuffer: Float32Array | null = null;
    try {
      velocityBuffer = particleSystem.GetVelocityBuffer();
    } catch {
      // Velocity buffer not available, will use position-based variation instead
    }

    // Try to get flags buffer to distinguish particle types
    let flagsBuffer: Uint32Array | null = null;
    try {
      flagsBuffer = particleSystem.GetFlagsBuffer();
    } catch {
      // Flags buffer not available, will treat all particles as water
    }

    // Determine particle flags if available
    const b2_powderParticle = box2d.b2_powderParticle || 0x0008;

    // Batch water particles by hue
    const hueBuckets = new Map<number, Array<{ x: number; y: number; vx?: number; vy?: number }>>();
    const sedimentParticles: Array<{
      x: number;
      y: number;
      depth: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      // GetPositionBuffer returns a flat array [x0, y0, x1, y1, ...]
      const x = posBuffer[i * 2];
      const y = posBuffer[i * 2 + 1];

      if (typeof x !== "number" || typeof y !== "number") continue;
      if (!isFinite(x) || !isFinite(y)) continue;

      const px = x * PIXELS_PER_METER;
      const py = height - y * PIXELS_PER_METER;

      // Check if particle is sediment (powder)
      const isSediment = flagsBuffer && (flagsBuffer[i] & b2_powderParticle) !== 0;

      if (isSediment) {
        // Sediment particles: colored by erosion depth (y position)
        // Deeper/lower particles are darker
        const depthFraction = Math.max(0, 1 - y / (height * 0.5));
        sedimentParticles.push({ x: px, y: py, depth: depthFraction });
      } else {
        // Water particles: velocity-based hue shifting
        let vx = 0;
        let vy = 0;
        if (velocityBuffer) {
          vx = velocityBuffer[i * 2];
          vy = velocityBuffer[i * 2 + 1];
        }

        // Velocity magnitude affects hue (fast = cyan, slow = deep blue)
        const velocityMag = Math.sqrt(vx * vx + vy * vy);
        const hueShift = Math.min(40, velocityMag * 10); // shift up to 40 hue points
        const hue = Math.round(((config.waterHue - hueShift + frameCount * 0.5) % 360) / 45) * 45;

        if (!hueBuckets.has(hue)) {
          hueBuckets.set(hue, []);
        }
        hueBuckets.get(hue)!.push({ x: px, y: py, vx, vy });
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
