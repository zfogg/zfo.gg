import { perlinNoise } from "./noise";
import type { ErosionConfig } from "./config";

/**
 * Generates a heightmap using Perlin noise with 3 octaves.
 */
export function generateHeightmap(
  config: ErosionConfig,
  worldWidth: number,
  worldHeight: number,
): number[] {
  const resolution = config.terrainResolution;
  const heights: number[] = [];

  // Three octaves of Perlin noise with doubling frequencies
  // (higher frequencies provide needed terrain variation)
  const octaves = [
    { freq: 0.5, amp: 0.35 }, // broad hills
    { freq: 1.0, amp: 0.15 }, // medium ridges
    { freq: 2.0, amp: 0.05 }, // fine detail
  ];

  for (let i = 0; i < resolution; i++) {
    const x = (i / resolution) * worldWidth;
    let value = 0;

    for (const octave of octaves) {
      value += perlinNoise(x * octave.freq, config.terrainSeed) * octave.amp;
    }

    // Normalize to [0, 1] and scale by baseHeight
    const normalized = (value + 1) / 2; // from [-1, 1] to [0, 1]
    heights.push(normalized * config.baseHeight * worldHeight);
  }

  return heights;
}

/**
 * Builds a closed basin vertex array from heightmap values.
 * Returns array: [(0,0), (0,h[0]), (dx,h[1]), ...samples..., (W,h[N]), (W,0)]
 */
export function buildChainVertices(
  heights: number[],
  worldWidth: number,
): Array<{ x: number; y: number }> {
  const vertices: Array<{ x: number; y: number }> = [];
  const step = worldWidth / (heights.length - 1);

  // Left edge bottom
  vertices.push({ x: 0, y: 0 });

  // Left edge up to first height
  vertices.push({ x: 0, y: heights[0] });

  // Terrain surface (start from i=1 to avoid duplicate of h[0])
  for (let i = 1; i < heights.length; i++) {
    const x = i * step;
    const y = heights[i];
    vertices.push({ x, y });
  }

  // Right edge down from last height
  vertices.push({ x: worldWidth, y: 0 });

  return vertices;
}

export class Terrain {
  heights: number[];
  body: any; // b2Body
  fixture: any; // b2Fixture
  isDirty: boolean = false;

  constructor(heights: number[], body: any, fixture: any) {
    this.heights = heights;
    this.body = body;
    this.fixture = fixture;
  }

  /**
   * Rebuilds the chain shape from current heights.
   * Call after terrain modification to update physics.
   */
  rebuild(box2d: any, _world: any, worldWidth: number): void {
    // Destroy old fixture
    if (this.fixture) {
      this.body.DestroyFixture(this.fixture);
    }

    // Build new chain shape
    const vertices = buildChainVertices(this.heights, worldWidth);
    const b2Vec2 = box2d.b2Vec2;
    const b2ChainShape = box2d.b2ChainShape;

    const chainShape = new b2ChainShape();
    const verts: any[] = [];

    for (const v of vertices) {
      verts.push(new b2Vec2(v.x, v.y));
    }

    chainShape.CreateChain(verts);

    // Create new fixture
    const fixtureDef = new box2d.b2FixtureDef();
    fixtureDef.shape = chainShape;
    fixtureDef.density = 0;
    fixtureDef.friction = 0.3;
    fixtureDef.restitution = 0.1;

    this.fixture = this.body.CreateFixture(fixtureDef);
    this.isDirty = false;
  }

  /**
   * Erodes the terrain at a given index by lowering its height.
   */
  erodeAt(index: number, amount: number): void {
    if (index < 0 || index >= this.heights.length) return;
    this.heights[index] = Math.max(0, this.heights[index] - amount);
    this.isDirty = true;
  }

  /**
   * Smooths the terrain at specified indices using a simple weighted average.
   * Formula: 0.25*h[i-1] + 0.5*h[i] + 0.25*h[i+1]
   */
  smooth(indices: Set<number>): void {
    const newHeights = [...this.heights];

    for (const i of indices) {
      if (i <= 0 || i >= this.heights.length - 1) continue;

      const prev = this.heights[i - 1];
      const curr = this.heights[i];
      const next = this.heights[i + 1];

      newHeights[i] = 0.25 * prev + 0.5 * curr + 0.25 * next;
    }

    this.heights = newHeights;
    this.isDirty = true;
  }
}
