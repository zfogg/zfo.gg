/**
 * Perlin noise implementation using a classic permutation table approach.
 * Returns values in the range [-1, 1].
 */

function hash(x: number): number {
  x = Math.sin(x) * 43758.5453123;
  return x - Math.floor(x);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generates Perlin-like noise at a given x coordinate with a seed.
 * Uses a 1D implementation with smoothstep interpolation.
 * Returns a value in the range [-1, 1].
 */
export function perlinNoise(x: number, seed: number): number {
  const xi = Math.floor(x);
  const xf = x - xi;

  // Hash the integer and neighboring parts using the seed
  const n0 = hash(xi + seed);
  const n1 = hash(xi + 1.0 + seed);

  // Smooth interpolation
  const u = smoothstep(xf);
  const result = lerp(n0, n1, u);

  // Scale from [0, 1] to [-1, 1]
  return (result - 0.5) * 2;
}
