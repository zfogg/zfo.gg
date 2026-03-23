import { useEffect, useRef, RefObject } from "react";
import { hslToRgb, SATURATION, LIGHTNESS } from "../utils/color";

const GRID = 25;
const GRID_LINE_WIDTH = 1;
const GRID_LINE_DECAY = 0.03; // opacity decay per frame for lit grid lines

// Type definitions
interface GridZipsConfig {
  speed: number;
  frequency: number;
  trailLength: number;
  trailDecay: number;
  mouseZipRate: number;
}

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

interface Zip {
  id: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  waypoints: Array<[number, number]>;
  totalDist: number;
  headDist: number;
  speed: number;
  color: [number, number, number];
  trail: TrailPoint[];
  phase: "active" | "fading";
}

interface LitLineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hue: number;
  opacity: number;
}

interface LitLinesMap {
  [key: string]: LitLineSegment;
}

interface Timer {
  frequency: number;
  phase: number;
  lastTriggered: boolean;
}

interface GridZipsState {
  zips: Zip[];
  zipIdCounter: number;
  hue: number;
  frameCount: number;
  mouseZipCooldown: number;
  lastMouseCanvas: { x: number; y: number } | null;
  lastClickCanvas: { x: number; y: number } | null;
  litLines: LitLinesMap;
  timer1: Timer;
  timer2: Timer;
  timer3: Timer;
  mouseDown: boolean;
  mouseDownPos: [number, number] | null;
  mouseDownCooldown: number;
  animId: number | null;
}

interface CanvasCoords {
  x: number;
  y: number;
}

interface UseGridZipsReturn {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export const getDefaultGridZipsConfig = (): GridZipsConfig => ({
  speed: 5,
  frequency: 3,
  trailLength: 40,
  trailDecay: 0.04,
  mouseZipRate: 4,
});

// Snap (x, y) to nearest grid intersection
function snapToGrid(x: number, y: number): [number, number] {
  return [Math.round(x / GRID) * GRID, Math.round(y / GRID) * GRID];
}

// Pick a random grid endpoint within [minDist, maxDist] of (sx, sy) that fits on canvas
function randomGridEndpoint(
  sx: number,
  sy: number,
  minDist: number,
  maxDist: number,
  canvasW: number,
  canvasH: number,
): [number, number] | null {
  for (let attempt = 0; attempt < 20; attempt++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const [ex, ey] = snapToGrid(sx + Math.cos(angle) * dist, sy + Math.sin(angle) * dist);
    if (ex >= 0 && ey >= 0 && ex <= canvasW && ey <= canvasH) {
      const actualDist = Math.hypot(ex - sx, ey - sy);
      if (actualDist >= minDist && actualDist <= maxDist) {
        return [ex, ey];
      }
    }
  }
  return null;
}

// Create grid-aligned waypoints using simple pathfinding with some randomness
function createRandomPath(ax: number, ay: number, bx: number, by: number): Array<[number, number]> {
  const waypoints: Array<[number, number]> = [[ax, ay]];
  let cx = ax;
  let cy = ay;

  // Create a winding path with intermediate waypoints
  const step = GRID;

  while (cx !== bx || cy !== by) {
    // Randomly decide direction: try to move toward target, but occasionally go perpendicular
    const dx = bx - cx;
    const dy = by - cy;
    const canMoveX = dx !== 0;
    const canMoveY = dy !== 0;

    let moveX = false;
    let moveY = false;

    if (canMoveX && canMoveY) {
      // Randomly choose which direction, but bias toward getting closer
      const rand = Math.random();
      if (rand < 0.7) {
        // 70% of the time: move toward target
        moveX = Math.abs(dx) >= Math.abs(dy);
        moveY = !moveX;
      } else {
        // 30% of the time: take a detour
        moveX = Math.random() > 0.5;
        moveY = !moveX;
      }
    } else {
      moveX = canMoveX;
      moveY = canMoveY;
    }

    if (moveX) {
      cx += Math.sign(dx) * step;
    }
    if (moveY) {
      cy += Math.sign(dy) * step;
    }

    waypoints.push([cx, cy]);
  }

  return waypoints;
}

// Create grid-aligned waypoints from (ax,ay) to (bx,by)
// Uses L-shaped path: horizontal first, then vertical (or vertical first randomly)
function createGridPath(ax: number, ay: number, bx: number, by: number): Array<[number, number]> {
  // 50% of the time use simple pathfinding, 50% use L-shaped
  if (Math.random() > 0.5) {
    return createRandomPath(ax, ay, bx, by);
  }

  const waypoints: Array<[number, number]> = [[ax, ay]];
  const useHorizontalFirst = Math.random() > 0.5;

  if (useHorizontalFirst) {
    // Go horizontal first
    if (ax !== bx) {
      waypoints.push([bx, ay]);
    }
    // Then vertical
    if (ay !== by) {
      waypoints.push([bx, by]);
    }
  } else {
    // Go vertical first
    if (ay !== by) {
      waypoints.push([ax, by]);
    }
    // Then horizontal
    if (ax !== bx) {
      waypoints.push([bx, by]);
    }
  }

  return waypoints;
}

// Get position along waypoint path at distance dist
function getPositionAlongPath(waypoints: Array<[number, number]>, dist: number): [number, number] {
  let remaining = dist;
  for (let i = 1; i < waypoints.length; i++) {
    const [x1, y1] = waypoints[i - 1];
    const [x2, y2] = waypoints[i];
    const segDist = Math.hypot(x2 - x1, y2 - y1);

    if (remaining <= segDist) {
      const t = segDist > 0 ? remaining / segDist : 0;
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    }
    remaining -= segDist;
  }

  // Reached end
  const last = waypoints[waypoints.length - 1];
  return last;
}

// Mark grid line segments that a line segment traverses
function markGridLineSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  litLines: LitLinesMap,
  hue: number,
): void {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / GRID;
  for (let i = 0; i < steps; i++) {
    const t = steps > 0 ? i / steps : 0;
    const nextT = steps > 0 ? (i + 1) / steps : 1;
    const sx = x1 + (x2 - x1) * t;
    const sy = y1 + (y2 - y1) * t;
    const ex = x1 + (x2 - x1) * nextT;
    const ey = y1 + (y2 - y1) * nextT;

    // Create key for this segment
    const segKey = `${Math.round(sx / GRID)},${Math.round(sy / GRID)}-${Math.round(ex / GRID)},${Math.round(ey / GRID)}`;

    if (!litLines[segKey]) {
      litLines[segKey] = { x1: sx, y1: sy, x2: ex, y2: ey, hue, opacity: 1.0 };
    } else {
      litLines[segKey].opacity = Math.min(1.0, litLines[segKey].opacity + 0.2);
      litLines[segKey].hue = hue;
    }
  }
}

// Draw lit grid line segments
function drawLitGridLines(ctx: CanvasRenderingContext2D, litLines: LitLinesMap): void {
  for (const key in litLines) {
    const seg = litLines[key];
    if (seg.opacity <= 0) continue;

    const [r, g, b] = hslToRgb(seg.hue, SATURATION, LIGHTNESS);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${seg.opacity})`;
    ctx.lineWidth = GRID_LINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.stroke();
  }
}

// Draw all zips
function drawZips(ctx: CanvasRenderingContext2D, zips: Zip[]): void {
  for (const zip of zips) {
    if (zip.trail.length < 2) continue;

    const [r, g, b] = zip.color;

    // Draw trail as line segments
    for (let i = 1; i < zip.trail.length; i++) {
      const prev = zip.trail[i - 1];
      const curr = zip.trail[i];

      const segOpacity = Math.max(0, Math.min(1, (prev.opacity + curr.opacity) / 2));
      const taper = i / zip.trail.length;
      const lineWidth = 1.0 + taper * 4.0;

      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${segOpacity})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(curr.x, curr.y);
      ctx.stroke();
    }
  }
}

export function useGridZips(config: GridZipsConfig): UseGridZipsReturn {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef(config);
  const stateRef = useRef<GridZipsState>({
    zips: [],
    zipIdCounter: 0,
    hue: 180,
    frameCount: 0,
    mouseZipCooldown: 0,
    lastMouseCanvas: null,
    lastClickCanvas: null,
    litLines: {}, // map of "h:y" or "v:x" -> {hue, opacity}
    // Three oscillating timers with sine waves
    timer1: { frequency: 0.02, phase: 0, lastTriggered: false },
    timer2: { frequency: 0.015, phase: Math.PI * 0.66, lastTriggered: false },
    timer3: { frequency: 0.01, phase: Math.PI * 1.33, lastTriggered: false },
    // Mouse hold mechanic
    mouseDown: false,
    mouseDownPos: null,
    mouseDownCooldown: 0,
    animId: null,
  });

  // Update configRef whenever config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // Size canvas to match container
    const container = canvas.parentElement;
    if (!container) return;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    // Initial size
    resizeCanvas();

    // Listen for window resize
    window.addEventListener("resize", resizeCanvas);

    const state = stateRef.current;

    // Helper: create a zip
    function makeZip(ax: number, ay: number, bx: number, by: number, hue: number): Zip | null {
      const [r, g, b] = hslToRgb(hue, SATURATION, LIGHTNESS);
      const waypoints = createGridPath(ax, ay, bx, by);

      // Calculate total distance along waypoints
      let totalDist = 0;
      for (let i = 1; i < waypoints.length; i++) {
        const [x1, y1] = waypoints[i - 1];
        const [x2, y2] = waypoints[i];
        totalDist += Math.hypot(x2 - x1, y2 - y1);
      }

      if (totalDist < 1) return null;

      return {
        id: state.zipIdCounter++,
        ax,
        ay,
        bx,
        by,
        waypoints,
        totalDist,
        headDist: 0,
        speed: configRef.current.speed,
        color: [r, g, b],
        trail: [],
        phase: "active",
      };
    }

    // Helper: spawn zip with random endpoint
    function spawnRandomZip(sx: number, sy: number, hueOverride?: number): void {
      if (!canvas) return;
      const endpoint = randomGridEndpoint(sx, sy, 50, 400, canvas.width, canvas.height);
      if (!endpoint) return;
      const [ax, ay] = snapToGrid(sx, sy);
      const [bx, by] = endpoint;
      const zip = makeZip(ax, ay, bx, by, hueOverride !== undefined ? hueOverride : state.hue);
      if (zip) state.zips.push(zip);
    }

    // Main animation loop
    function loop(): void {
      if (!canvas) return;

      state.frameCount++;

      // Advance hue
      state.hue = (((state.hue + 0.15) % 360) + 360) % 360;

      // Three oscillating timers with sine waves
      const checkTimer = (timer: Timer): boolean => {
        const sineValue = Math.sin(state.frameCount * timer.frequency + timer.phase);
        const isTriggering = sineValue > 0.5; // Trigger when sine > 0.5
        const shouldTrigger = isTriggering && !timer.lastTriggered;
        timer.lastTriggered = isTriggering;
        return shouldTrigger;
      };

      // Skip random zips while mouse is held down
      if (!state.mouseDown) {
        if (checkTimer(state.timer1) || checkTimer(state.timer2) || checkTimer(state.timer3)) {
          const burstCount = 1 + Math.floor(Math.random() * 14);
          for (let i = 0; i < burstCount; i++) {
            const gx = Math.floor(Math.random() * (canvas.width / GRID)) * GRID;
            const gy = Math.floor(Math.random() * (canvas.height / GRID)) * GRID;
            const posHue = (((gx * 0.5 + gy * 0.7 + state.frameCount * 0.15) % 360) + 360) % 360;
            spawnRandomZip(gx, gy, posHue);
          }
        }
      }

      // Mouse hold: spawn zips while button is down
      if (state.mouseDown && state.mouseDownPos) {
        if (state.mouseDownCooldown === 0) {
          state.mouseDownCooldown = 8; // Every ~8 frames while holding
          spawnRandomZip(state.mouseDownPos[0], state.mouseDownPos[1]);
        }
        if (state.mouseDownCooldown > 0) state.mouseDownCooldown--;
      }

      // Decay mouse zip cooldown
      if (state.mouseZipCooldown > 0) state.mouseZipCooldown--;

      // Update zips and mark grid lines
      const toRemove: Zip[] = [];
      for (const zip of state.zips) {
        if (zip.phase === "active") {
          const oldHeadDist = zip.headDist;
          zip.headDist = Math.min(zip.headDist + configRef.current.speed, zip.totalDist);

          const [hx, hy] = getPositionAlongPath(zip.waypoints, zip.headDist);

          // Mark grid lines traversed
          if (zip.trail.length > 0) {
            const prevTrail = zip.trail[zip.trail.length - 1];
            markGridLineSegment(prevTrail.x, prevTrail.y, hx, hy, state.litLines, state.hue);
          } else {
            // First point
            const [startX, startY] = getPositionAlongPath(zip.waypoints, oldHeadDist);
            markGridLineSegment(startX, startY, hx, hy, state.litLines, state.hue);
          }

          zip.trail.push({ x: hx, y: hy, opacity: 1.0 });

          if (zip.trail.length > configRef.current.trailLength) {
            zip.trail.shift();
          }

          if (zip.headDist >= zip.totalDist) {
            zip.phase = "fading";
          }
        } else {
          // Fading phase
          for (const seg of zip.trail) {
            seg.opacity -= configRef.current.trailDecay;
          }
          while (zip.trail.length > 0 && zip.trail[0].opacity <= 0) {
            zip.trail.shift();
          }
          if (zip.trail.length === 0) {
            toRemove.push(zip);
          }
        }
      }
      state.zips = state.zips.filter((z) => !toRemove.includes(z));

      // Decay lit grid lines
      for (const key in state.litLines) {
        state.litLines[key].opacity -= GRID_LINE_DECAY;
        if (state.litLines[key].opacity <= 0) {
          delete state.litLines[key];
        }
      }

      // Cap total zips at 150
      if (state.zips.length > 150) {
        state.zips = state.zips.slice(state.zips.length - 150);
      }

      // Draw
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLitGridLines(ctx, state.litLines);
        drawZips(ctx, state.zips);
      }

      state.animId = requestAnimationFrame(loop);
    }

    state.animId = requestAnimationFrame(loop);

    // Event handlers
    function toCanvasCoords(clientX: number, clientY: number): CanvasCoords {
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    function handleMouseMove(e: MouseEvent): void {
      const pos = toCanvasCoords(e.clientX, e.clientY);
      const prev = state.lastMouseCanvas;

      state.lastMouseCanvas = pos;

      // Advance hue based on mouse movement
      if (prev) {
        const dist = Math.hypot(pos.x - prev.x, pos.y - prev.y);
        state.hue = (((state.hue + dist * 0.2) % 360) + 360) % 360;
      }

      // Throttled mouse-move zip spawn
      if (state.mouseZipCooldown === 0) {
        state.mouseZipCooldown = configRef.current.mouseZipRate;
        const [sx, sy] = snapToGrid(pos.x, pos.y);
        spawnRandomZip(sx, sy);
      }
    }

    function handleMouseDown(e: MouseEvent): void {
      const pos = toCanvasCoords(e.clientX, e.clientY);
      state.mouseDown = true;
      state.mouseDownPos = snapToGrid(pos.x, pos.y);
      state.mouseDownCooldown = 0;
    }

    function handleMouseUp(_e: MouseEvent): void {
      if (!state.mouseDown || !state.mouseDownPos || !canvas) return;

      const [ax, ay] = state.mouseDownPos;
      const zipCount = (1 + Math.floor(Math.random() * 3)) * 2; // 2x normal count

      // Burst on release: spawn in all directions from click point
      for (let i = 0; i < zipCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = (50 + Math.random() * 350) * 2;
        const [bx, by] = snapToGrid(ax + Math.cos(angle) * dist, ay + Math.sin(angle) * dist);
        if (bx === ax && by === ay) continue;
        if (bx < 0 || by < 0 || bx > canvas.width || by > canvas.height) continue;
        const zip = makeZip(ax, ay, bx, by, state.hue);
        if (zip) state.zips.push(zip);
      }

      state.mouseDown = false;
      state.mouseDownPos = null;
    }

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (state.animId) cancelAnimationFrame(state.animId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", resizeCanvas);
      state.zips = [];
    };
  }, []);

  return { canvasRef };
}
