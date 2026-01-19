import { PhysicalBody } from './PhysicalBody';
import type { Vector2 } from '../utils/Vector2';

export class PhysicalSquare extends PhysicalBody {
  index: number;
  color: string;
  LIM_W: number;
  LIM_H: number;

  constructor(
    position: Vector2,
    mass: number,
    size: number,
    index: number,
    color: string,
    canvasWidth: number,
    canvasHeight: number,
    velocity: Vector2
  ) {
    super(position, mass, 1.2 * size, 0.95, velocity);
    this.position = position;
    this.mass = mass;
    this.size = size;
    this.index = index;
    this.color = color;
    this.LIM_W = canvasWidth;
    this.LIM_H = canvasHeight;
  }

  update(friction: number, cursorIsPressed: boolean, applyGravityToCursor?: () => void): void {
    if (!cursorIsPressed) {
      this.bounceOffLimits(this.LIM_W, this.LIM_H, this.mass * 2);
    } else if (applyGravityToCursor) {
      applyGravityToCursor();
    }
    this.updatePosition();
    this.decayVelocity(friction);
  }

  decayVelocity(n: number): void {
    this.velocity[0] -= this.velocity[0] * n * this.mass;
    this.velocity[1] -= this.velocity[1] * n * this.mass;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.position[0], this.position[1], this.size, this.size);
  }

  bounceOffLimits(width: number, height: number, offset: number): void {
    const bounce = (dimension: number) => Math.abs(dimension);

    if (this.position[0] > width - offset) {
      this.velocity[0] = -bounce(this.velocity[0]);
    } else if (this.position[0] <= 0) {
      this.velocity[0] = bounce(this.velocity[0]);
    }

    if (this.position[1] > height - offset) {
      this.velocity[1] = -bounce(this.velocity[1]);
    } else if (this.position[1] <= 0) {
      this.velocity[1] = bounce(this.velocity[1]);
    }
  }
}
