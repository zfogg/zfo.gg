export interface ErosionConfig {
  terrainSeed: number;
  terrainResolution: number;
  baseHeight: number;
  particleRadius: number;
  maxParticles: number;
  damping: number;
  erosionRate: number;
  erosionThreshold: number;
  depositionRate: number;
  smoothingStrength: number;
  burstSize: number;
  rainRate: number;
  rainSpreadRadius: number;
  waterHue: number;
  sedimentHue: number;
}

export const getDefaultErosionConfig = (): ErosionConfig => ({
  terrainSeed: Math.random() * 1000,
  terrainResolution: 200,
  baseHeight: 0.4,
  particleRadius: 0.12,
  maxParticles: 4000,
  damping: 0.3,
  erosionRate: 0.002,
  erosionThreshold: 0.5,
  depositionRate: 0.6,
  smoothingStrength: 0.25,
  burstSize: 45,
  rainRate: 8,
  rainSpreadRadius: 1.5,
  waterHue: 210,
  sedimentHue: 30,
});
