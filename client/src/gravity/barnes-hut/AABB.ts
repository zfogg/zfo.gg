import type { Vector2 } from "../utils/Vector2";

export class AABB {
  center: Vector2;
  half: number;
  _nw: Vector2;
  _ne: Vector2;
  _sw: Vector2;
  _se: Vector2;

  constructor(center: Vector2, half: number) {
    this.center = center;
    this.half = half;
    this._nw = [center[0] - half, center[1] - half];
    this._ne = [center[0] + half, center[1] - half];
    this._sw = [center[0] - half, center[1] + half];
    this._se = [center[0] + half, center[1] + half];
  }

  containsPoint(p: Vector2): boolean {
    return (
      this._nw[0] <= p[0] &&
      p[0] <= this._se[0] &&
      this._ne[1] <= p[1] &&
      p[1] <= this._sw[1]
    );
  }

  intersects(other: AABB): boolean {
    return (
      this.containsPoint(other._nw) ||
      this.containsPoint(other._ne) ||
      this.containsPoint(other._se) ||
      this.containsPoint(other._sw)
    );
  }

  quadrants(): AABB[] {
    const q = this.half / 2;
    return [
      new AABB([this._nw[0] + q, this._nw[1] + q], q),
      new AABB([this._ne[0] - q, this._ne[1] + q], q),
      new AABB([this._sw[0] + q, this._sw[1] - q], q),
      new AABB([this._se[0] - q, this._se[1] - q], q),
    ];
  }
}
