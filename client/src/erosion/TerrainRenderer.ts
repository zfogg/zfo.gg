import type { Terrain } from "./Terrain";

export class TerrainRenderer {
  draw(ctx: CanvasRenderingContext2D, terrain: Terrain, canvas: HTMLCanvasElement): void {
    const width = canvas.width;
    const height = canvas.height;
    const step = width / (terrain.heights.length - 1);

    // 1. Sky vertical gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, "hsl(215, 60%, 25%)");
    skyGradient.addColorStop(1, "hsl(200, 40%, 75%)");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Build terrain polygon path
    const terrainPath = new Path2D();
    terrainPath.moveTo(0, height); // Bottom-left

    // Top surface
    for (let i = 0; i < terrain.heights.length; i++) {
      const x = i * step;
      const y = height - terrain.heights[i];
      if (i === 0) {
        terrainPath.lineTo(x, y);
      } else {
        terrainPath.lineTo(x, y);
      }
    }

    // Right edge down
    terrainPath.lineTo(width, height);
    terrainPath.closePath();

    // 2. Deep terrain fill with vertical gradient (4-layer geological strata)
    const terrainGradient = ctx.createLinearGradient(0, 0, 0, height);
    terrainGradient.addColorStop(0, "hsl(90, 40%, 45%)"); // Surface: muted green-brown (topsoil)
    terrainGradient.addColorStop(0.33, "hsl(30, 35%, 35%)"); // Mid-depth: warm brown (subsoil)
    terrainGradient.addColorStop(0.66, "hsl(20, 30%, 30%)"); // Deep: darker brown
    terrainGradient.addColorStop(1, "hsl(15, 25%, 25%)"); // Bedrock: dark reddish-brown
    ctx.fillStyle = terrainGradient;
    ctx.fill(terrainPath);

    // 3. Surface stroke
    ctx.strokeStyle = "hsl(20, 40%, 40%)";
    ctx.lineWidth = 2;
    ctx.stroke(terrainPath);

    // 4. Strata lines clipped to terrain
    ctx.save();
    ctx.clip(terrainPath);

    const strataColors = ["hsl(30, 25%, 35%)", "hsl(25, 30%, 30%)", "hsl(35, 20%, 40%)"];

    for (let s = 0; s < 3; s++) {
      const yFraction = 0.3 + s * 0.25; // 0.3, 0.55, 0.8
      const y = height - height * yFraction;

      ctx.strokeStyle = strataColors[s];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
