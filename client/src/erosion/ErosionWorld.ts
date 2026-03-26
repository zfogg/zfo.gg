import type { ErosionConfig } from "./config";

export const PIXELS_PER_METER = 20;

export function toPixels(meters: number): number {
  return meters * PIXELS_PER_METER;
}

export function toMeters(pixels: number): number {
  return pixels / PIXELS_PER_METER;
}

/**
 * Creates a Box2D world with appropriate gravity for erosion simulation.
 */
export function createWorld(box2d: any): any {
  const b2Vec2 = box2d.b2Vec2;
  const b2World = box2d.b2World;

  const gravity = new b2Vec2(0, -9.8);
  const world = new b2World(gravity);

  return world;
}

/**
 * Creates and configures a particle system for water/sediment simulation.
 */
export function createParticleSystem(box2d: any, world: any, config: ErosionConfig): any {
  const b2ParticleSystemDef = box2d.b2ParticleSystemDef;

  const def = new b2ParticleSystemDef();
  def.radius = config.particleRadius;
  def.dampingStrength = config.damping;
  def.gravityScale = 1.0;
  def.elasticStrength = 0.3;
  def.viscousStrength = 0.5;
  def.surfaceTension = 0.0;
  def.pressureStrength = 1.0;

  const particleSystem = world.CreateParticleSystem(def);

  return particleSystem;
}

/**
 * Steps the physics world forward by dt seconds.
 * Calculates appropriate particle iterations based on dt.
 */
export function stepWorld(world: any, _particleSystem: any, dt: number): void {
  const particleIterations = world.CalculateReasonableParticleIterations(dt);

  // velocityIterations, positionIterations, particleIterations
  world.Step(dt, 6, 2, particleIterations);
}
