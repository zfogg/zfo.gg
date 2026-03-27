import type { CrackLine } from "./FractureSystem";

export class OverlayRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("[OverlayRenderer] Canvas 2D unavailable");
    this.ctx = ctx;
  }

  render(
    cx: number,
    cy: number,
    isRightHeld: boolean,
    cracks: CrackLine[],
    canvasSize: number,
  ): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw crack lines
    for (const line of cracks) {
      const hue = 30 + line.stress * 30;
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${line.opacity})`;
      ctx.lineWidth = 1 + line.stress * 2;
      ctx.stroke();
    }

    // Draw cursor ring
    const radius = isRightHeld ? 40 : 20;
    const color = isRightHeld ? "rgba(180, 80, 255, 0.8)" : "rgba(255, 255, 255, 0.7)";

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = isRightHeld ? 2.5 : 1.5;
    ctx.stroke();

    // Draw center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}
