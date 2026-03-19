import type { AABB } from "./AABB";
import type { PhysicalSquare } from "../bodies/PhysicalSquare";

export class QuadTree {
  boundary: AABB;
  RECUR_LIMIT: number;
  pointp: PhysicalSquare | null = null;
  external: boolean = true;

  protected _nw: QuadTree | null = null;
  protected _ne: QuadTree | null = null;
  protected _sw: QuadTree | null = null;
  protected _se: QuadTree | null = null;
  protected _quadrants: QuadTree[] = [];

  constructor(boundary: AABB, pointPointers: PhysicalSquare[] | null, RECUR_LIMIT: number) {
    this.boundary = boundary;
    this.RECUR_LIMIT = RECUR_LIMIT;

    if (pointPointers != null && pointPointers.length > 0) {
      for (const pp of pointPointers) {
        this.insert(pp);
      }
    }
  }

  getQuadrants(): QuadTree[] {
    if (this._quadrants.length === 0 && this._nw !== null) {
      this._quadrants = [this._nw, this._ne!, this._sw!, this._se!];
    }
    return this._quadrants;
  }

  protected setQuadrants(nw: AABB, ne: AABB, sw: AABB, se: AABB): void {
    this._nw = this.newQuadTree(nw);
    this._ne = this.newQuadTree(ne);
    this._sw = this.newQuadTree(sw);
    this._se = this.newQuadTree(se);
  }

  protected newQuadTree(corner: AABB): QuadTree {
    return new (this.getQT_T())(corner, null, this.RECUR_LIMIT - 1);
  }

  protected getQT_T(): typeof QuadTree {
    return QuadTree;
  }

  insert(pp: PhysicalSquare): boolean {
    if (!this.boundary.containsPoint(pp.position)) {
      return false;
    }

    this.update(pp);

    if (this.pointp === null && this.external) {
      this.pointp = pp;
      return true;
    }

    if (this._nw === null) {
      this.subdivide();
    }

    const qs = this.getQuadrants();

    if (this.external && this.pointp) {
      const inserted = qs.some((q) => q.insert(this.pointp!));
      if (inserted) {
        this.pointp = null;
        this.external = false;
      }
    }

    return qs.some((q) => q.insert(pp));
  }

  update(_pp: PhysicalSquare): void {
    // Override in subclasses
  }

  clear(): void {
    this.pointp = null;
    if (!this.external) {
      for (const qt of this.getQuadrants()) {
        qt.clear();
      }
    }
    this.external = true;
    this._quadrants = [];
  }

  subdivide(): void {
    if (this.RECUR_LIMIT > 0) {
      const quadrants = this.boundary.quadrants();
      this.setQuadrants(quadrants[0], quadrants[1], quadrants[2], quadrants[3]);
    }
  }

  protected _map<T>(f: (qt: QuadTree) => T, acc: T[]): T[] {
    acc.push(f(this));
    if (!this.external) {
      for (const q of this.getQuadrants()) {
        q._map(f, acc);
      }
    }
    return acc;
  }

  map<T>(f: (qt: QuadTree) => T): T[] {
    return this._map(f, []);
  }

  getPointps(): (PhysicalSquare | null)[] {
    const pps = this.map((qt) => qt.pointp);
    return pps.filter((pp) => pp !== null);
  }
}
