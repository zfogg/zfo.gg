export interface StressGraphConfig {
  seedCount: number;
  maxSeeds: number;
  springK: number;
  damping: number;
  dt: number;
  mouseRepulsionRadius: number;
  mouseRepulsionStrength: number;
  fractureImpulse: number;
  fractureRadius: number;
  gravityWellStrength: number;
  idleHealDelay: number;
  healIntervalMs: number;
  hueVelocityMin: number;
  hueVelocityMax: number;
}

export const getDefaultStressGraphConfig = (): StressGraphConfig => ({
  seedCount: 80,
  maxSeeds: 200,
  springK: 2.0,
  damping: 0.85,
  dt: 1 / 60,
  mouseRepulsionRadius: 120,
  mouseRepulsionStrength: 0.0008,
  fractureImpulse: 8.0,
  fractureRadius: 200,
  gravityWellStrength: 0.15,
  idleHealDelay: 5000,
  healIntervalMs: 800,
  hueVelocityMin: 0.1,
  hueVelocityMax: 0.5,
});
