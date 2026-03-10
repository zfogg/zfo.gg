import type { Vector2, Vector2Pool } from "../utils/Vector2";

export class PhysicalBody {
  position: Vector2;
  mass: number;
  size: number;
  restitution: number;
  velocity: Vector2;

  constructor(
    position: Vector2,
    mass: number = 1,
    size: number = 1,
    restitution: number = 1,
    velocity: Vector2,
  ) {
    this.position = position;
    this.mass = mass;
    this.size = size;
    this.restitution = restitution;
    this.velocity = velocity;
  }

  destructor(pool: Vector2Pool): void {
    pool.put(this.position);
    pool.put(this.velocity);
  }

  updatePosition(): void {
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
  }

  applyForce(acceleration: Vector2): void {
    this.velocity[0] += acceleration[0];
    this.velocity[1] += acceleration[1];
  }
}
