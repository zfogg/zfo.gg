import { PhysicalBody } from "./PhysicalBody";
import type { Vector2, Vector2Pool } from "../utils/Vector2";

export class PhysicalCursor extends PhysicalBody {
  trackedPosition: Vector2;
  canvasCenter: Vector2;
  isClicked: { left: boolean; middle: boolean; right: boolean };
  canvas: HTMLCanvasElement;

  constructor(
    canvas: HTMLCanvasElement,
    pool: Vector2Pool,
    position: Vector2,
    velocity: Vector2,
  ) {
    super(position, 0, 10, 1, velocity);
    this.canvas = canvas;
    this.trackedPosition = pool.get(0, 0);
    this.canvasCenter = pool.get(canvas.width / 2, canvas.height / 2);
    this.isClicked = { left: false, middle: false, right: false };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    document.body.addEventListener("mouseup", this.handleMouseUpBody);
    this.canvas.addEventListener("mouseup", this.handleMouseUpCanvas);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  onMouseDown?: (isLeft: boolean, isRight: boolean) => void;
  onMouseUp?: () => void;
  onMouseUpCanvas?: (isLeft: boolean) => void;

  private handleMouseDown = (e: MouseEvent): void => {
    this.toggleClicks(e, true);
    if (this.onMouseDown) {
      this.onMouseDown(this.isClicked.left, this.isClicked.right);
    }
  };

  private handleMouseUpBody = (_e: MouseEvent): void => {
    this.mass = 0;
    this.isClicked.left = this.isClicked.middle = this.isClicked.right = false;
    if (this.onMouseUp) {
      this.onMouseUp();
    }
  };

  private handleMouseUpCanvas = (_e: MouseEvent): void => {
    if (this.onMouseUpCanvas) {
      this.onMouseUpCanvas(this.isClicked.left);
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.trackedPosition[0] = e.clientX - rect.left;
    this.trackedPosition[1] = e.clientY - rect.top;
  };

  private toggleClicks(e: MouseEvent, value: boolean): void {
    switch (e.button) {
      case 0:
        this.isClicked.left = value;
        break;
      case 1:
        this.isClicked.middle = value;
        break;
      case 2:
        this.isClicked.right = value;
        break;
    }
  }

  rightHeldDown(gameTime: number): void {
    this.position[0] = this.canvasCenter[0] + Math.sin(gameTime / 14) * 124;
    this.position[1] = this.canvasCenter[1] + Math.cos(gameTime / 14) * 124;
  }

  updatePosition(): void {
    this.position[0] = this.trackedPosition[0];
    this.position[1] = this.trackedPosition[1];
  }

  update(gameTime: number): void {
    if (this.isClicked.right) {
      this.rightHeldDown(gameTime);
    } else {
      this.updatePosition();
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(this.position[0], this.position[1], 10, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }

  cleanup(): void {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    document.body.removeEventListener("mouseup", this.handleMouseUpBody);
    this.canvas.removeEventListener("mouseup", this.handleMouseUpCanvas);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
  }
}
