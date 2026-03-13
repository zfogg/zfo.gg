import { randomBetween } from "../gravity/utils/math";
import type { GravityConfig } from "../hooks/useGravity";

export const getDefaultGravityConfig = (): GravityConfig => ({
  gravity: randomBetween(4, 9) * Math.pow(10, -3) * 2 * 5 * 5,
  friction: randomBetween(2, 6) * Math.pow(10, -4) * 3,
  distance: randomBetween(50, 125),
  cursorFriction: randomBetween(1, 4),
  cursorMass: 5000,
  cursorForce: 0.65,
  particlesN: 13,
});
