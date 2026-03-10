import { QuadTree } from "./QuadTree";
import type { AABB } from "./AABB";
import type { PhysicalSquare } from "../bodies/PhysicalSquare";
import type { Vector2, Vector2Pool } from "../utils/Vector2";
import { distance } from "../utils/Vector2";
import { PHI } from "../utils/math";

export class SquareTree extends QuadTree {
  color: string = "#000000";
  mass: number = 0;
  massx: number = 0;
  massy: number = 0;
  theta: number = 1 - PHI;
  private _barycenter: Float64Array;

  constructor(
    boundary: AABB,
    pointPointers: PhysicalSquare[] | null,
    RECUR_LIMIT: number,
  ) {
    super(boundary, pointPointers, RECUR_LIMIT);
    this._barycenter = new Float64Array(2);
  }

  protected getQT_T(): typeof QuadTree {
    return SquareTree;
  }

  clear(): void {
    this.mass = 0;
    this.massx = 0;
    this.massy = 0;
    this._barycenter[0] = 0;
    this._barycenter[1] = 0;
    super.clear();
  }

  getBarycenter(): Vector2 {
    if (
      this._barycenter[0] === 0 &&
      this._barycenter[1] === 0 &&
      this.mass !== 0
    ) {
      this._barycenter[0] = this.massx / this.mass;
      this._barycenter[1] = this.massy / this.mass;
    }
    return [this._barycenter[0], this._barycenter[1]];
  }

  ratio(s: PhysicalSquare, pool: Vector2Pool): number {
    return (
      (this.boundary.half * 2) /
      distance(s.position, this.getBarycenter(), pool)
    );
  }

  applyForceTo(
    s: PhysicalSquare,
    pool: Vector2Pool,
    attractionOfGravity: (
      b1: PhysicalSquare | { position: Vector2; mass: number },
      b2: PhysicalSquare | { position: Vector2; mass: number },
    ) => Vector2,
  ): void {
    const netForce = pool.get();
    this._accNetForce(s, netForce, pool, attractionOfGravity);
    s.applyForce(netForce);
    pool.put(netForce);
  }

  private _accNetForce(
    s: PhysicalSquare,
    acc: Vector2,
    pool: Vector2Pool,
    attractionOfGravity: (
      b1: PhysicalSquare | { position: Vector2; mass: number },
      b2: PhysicalSquare | { position: Vector2; mass: number },
    ) => Vector2,
  ): void {
    if (this.external) {
      if (this.pointp === null) {
        return;
      } else if (s !== this.pointp) {
        const g = attractionOfGravity(s, this.pointp);
        acc[0] += g[0];
        acc[1] += g[1];
        pool.put(g);
      }
    } else if (this.ratio(s, pool) < this.theta) {
      const bc = this.getBarycenter();
      const g = attractionOfGravity(s, { position: bc, mass: this.mass });
      acc[0] += g[0];
      acc[1] += g[1];
      pool.put(g);
    } else {
      for (const q of this.getQuadrants() as SquareTree[]) {
        q._accNetForce(s, acc, pool, attractionOfGravity);
      }
    }
  }

  update(s: PhysicalSquare): void {
    this.color = s.color;
    this.massx += s.position[0] * s.mass;
    this.massy += s.position[1] * s.mass;
    this.mass += s.mass;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.external && this.pointp !== null) {
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      this._drawBoundary(ctx);
    } else if (this.mass > 0) {
      this._drawBarycenter(ctx);
      this._drawMass(ctx);
    }
  }

  private _drawBoundary(ctx: CanvasRenderingContext2D): void {
    ctx.strokeRect(
      this.boundary.center[0] - this.boundary.half,
      this.boundary.center[1] - this.boundary.half,
      this.boundary.half * 2,
      this.boundary.half * 2,
    );
  }

  private _drawBarycenter(ctx: CanvasRenderingContext2D): void {
    const bc = this.getBarycenter();
    ctx.moveTo(bc[0] + 2, bc[1] + 2);
    ctx.arc(bc[0] + 2, bc[1] + 2, 4, 0, Math.PI * 2, true);
  }

  private _drawMass(ctx: CanvasRenderingContext2D): void {
    ctx.fillText(
      this.mass.toFixed(2),
      this.boundary.center[0],
      this.boundary.center[1] - 2,
    );
  }
}
