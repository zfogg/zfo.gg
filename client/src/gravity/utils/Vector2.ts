export type Vector2 = [number, number];

export class Vector2Pool {
  private pool: Vector2[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(x: number = 0, y: number = 0): Vector2 {
    const vector = this.pool.pop() || [0, 0];
    vector[0] = x;
    vector[1] = y;
    return vector;
  }

  put(vector: Vector2): void {
    if (this.pool.length < this.maxSize) {
      this.pool.push(vector);
    }
  }

  clear(): void {
    this.pool = [];
  }
}

export const normalize = (v: Vector2, magnitude?: number): Vector2 => {
  const mag = magnitude ?? Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  if (mag !== 0) {
    v[0] = v[0] / mag;
    v[1] = v[1] / mag;
  }
  return v;
};

export const hypotenuse = (x: number, y: number): number => {
  return Math.sqrt(x * x + y * y);
};

export const direction = (p1: Vector2, p2: Vector2, pool: Vector2Pool): Vector2 => {
  return pool.get(p1[0] - p2[0], p1[1] - p2[1]);
};

export const distance = (p1: Vector2, p2: Vector2, pool: Vector2Pool): number => {
  const d = direction(p1, p2, pool);
  const r = hypotenuse(d[0], d[1]);
  pool.put(d);
  return r;
};
