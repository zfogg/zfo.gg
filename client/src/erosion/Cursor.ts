import { toMeters } from "./ErosionWorld";

export interface CursorState {
  spawnBurst: boolean;
  spawnRain: boolean;
  spawnReleaseBurst: boolean;
  drainActive: boolean;
  worldPos: { x: number; y: number };
}

export class Cursor {
  private mouseDown: boolean = false;
  private mousePos: { x: number; y: number } = { x: 0, y: 0 };
  private isRightClick: boolean = false;
  private frameCount: number = 0;
  private mouseDownCooldown: number = 0;
  private spacebarHeld: boolean = false;
  private canvas: HTMLCanvasElement | null = null;
  private canvasHeight: number = 0;
  private releaseBurstTriggered: boolean = false;

  attach(canvas: HTMLCanvasElement): void {
    this.canvasHeight = canvas.height;
    this.canvas = canvas;

    const handleMouseDown = (e: MouseEvent) => {
      this.mouseDown = true;
      this.isRightClick = e.button === 2;
      this.mouseDownCooldown = 0;
    };

    const handleMouseUp = (_e: MouseEvent) => {
      // Trigger release burst if we were holding for at least a few frames
      if (this.mouseDown && this.mouseDownCooldown > 3) {
        this.releaseBurstTriggered = true;
      }
      this.mouseDown = false;
      this.isRightClick = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousedown", {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
      });
      handleMouseDown(mouseEvent as unknown as MouseEvent);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      handleMouseMove(mouseEvent as unknown as MouseEvent);
    };

    const handleTouchEnd = (_e: TouchEvent) => {
      const mouseEvent = new MouseEvent("mouseup");
      handleMouseUp(mouseEvent as unknown as MouseEvent);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.spacebarHeld = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        this.spacebarHeld = false;
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    // Store references for detach
    this._handlers = {
      mousedown: handleMouseDown,
      mouseup: handleMouseUp,
      mousemove: handleMouseMove,
      touchstart: handleTouchStart,
      touchmove: handleTouchMove,
      touchend: handleTouchEnd,
      contextmenu: handleContextMenu,
      keydown: handleKeyDown,
      keyup: handleKeyUp,
    };
  }

  private _handlers: any = {};

  detach(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener("mousedown", this._handlers.mousedown);
    this.canvas.removeEventListener("mouseup", this._handlers.mouseup);
    this.canvas.removeEventListener("mousemove", this._handlers.mousemove);
    this.canvas.removeEventListener("touchstart", this._handlers.touchstart);
    this.canvas.removeEventListener("touchmove", this._handlers.touchmove);
    this.canvas.removeEventListener("touchend", this._handlers.touchend);
    this.canvas.removeEventListener("contextmenu", this._handlers.contextmenu);
    document.removeEventListener("keydown", this._handlers.keydown);
    document.removeEventListener("keyup", this._handlers.keyup);
  }

  /**
   * Called each frame. Returns state for particle spawning and terrain interaction.
   */
  update(): CursorState {
    this.frameCount++;
    this.mouseDownCooldown++;

    const spawnRain = this.mouseDown && !this.isRightClick;
    const spawnBurst = this.mouseDownCooldown % 3 === 0 && spawnRain;
    const drainActive = this.mouseDown && this.isRightClick;

    // Release burst: triggers once when mouse is released after being held
    const spawnReleaseBurst = this.releaseBurstTriggered;
    if (this.releaseBurstTriggered) {
      this.releaseBurstTriggered = false; // Only trigger once
    }

    // Convert pixel position to world meters (invert y: canvas y-down → world y-up)
    const worldPos = {
      x: toMeters(this.mousePos.x),
      y: toMeters(this.canvasHeight - this.mousePos.y),
    };

    return {
      spawnBurst: spawnBurst || this.spacebarHeld,
      spawnRain: spawnRain || this.spacebarHeld,
      spawnReleaseBurst,
      drainActive,
      worldPos,
    };
  }

  /**
   * Draws the cursor visualization on canvas.
   */
  draw(ctx: CanvasRenderingContext2D): void {
    // Always show a black pointer circle at cursor
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.arc(this.mousePos.x, this.mousePos.y, 40, 0, Math.PI * 2);
    ctx.fill();

    if (this.isRightClick) {
      // Draw drain circle
      ctx.strokeStyle = "rgba(255, 100, 100, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, 30, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.mouseDown) {
      // Draw rain indicator
      ctx.fillStyle = "rgba(100, 150, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(this.mousePos.x, this.mousePos.y, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
