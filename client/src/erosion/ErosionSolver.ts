import type { Terrain } from "./Terrain";
import type { ErosionConfig } from "./config";

/**
 * Accumulator for contact impulses at each terrain segment.
 */
export class ErosionAccumulator {
  private data: Float32Array;

  constructor(terrainResolution: number) {
    this.data = new Float32Array(terrainResolution);
  }

  add(index: number, impulse: number): void {
    if (index >= 0 && index < this.data.length) {
      this.data[index] += impulse;
    }
  }

  get(index: number): number {
    if (index >= 0 && index < this.data.length) {
      return this.data[index];
    }
    return 0;
  }

  reset(): void {
    this.data.fill(0);
  }
}

/**
 * Sets up a contact listener that accumulates particle-terrain interactions
 * and handles particle-drain body interactions.
 */
export function setupContactListener(
  box2d: any,
  world: any,
  terrain: Terrain,
  _particleSystem: any,
  accumulator: ErosionAccumulator,
  worldWidth: number,
  drainBodyRef?: { current: any },
): void {
  const JSContactListener = box2d.JSContactListener;

  const contactListener = new JSContactListener();

  contactListener.BeginContactParticleBodyContact = (
    particleSystem: any,
    particleBodyContact: any,
  ) => {
    const particleIndex = particleBodyContact.GetParticleIndex();
    const body = particleBodyContact.GetBody();

    // Check if the body is the terrain
    if (body === terrain.body) {
      // Get particle position
      const posBuffer = particleSystem.GetPositionBuffer();
      const pos = posBuffer[particleIndex];

      // Convert world position to terrain index
      const terrainIndex = Math.round((pos.x / worldWidth) * (terrain.heights.length - 1));

      // Accumulate a small impulse
      accumulator.add(terrainIndex, 0.1);
    }

    // Check if the body is the drain body
    if (drainBodyRef?.current && body === drainBodyRef.current) {
      // Mark particle as zombie to remove it
      try {
        const flagsBuffer = particleSystem.GetFlagsBuffer();
        const b2_zombieParticle = box2d.b2_zombieParticle || 0x0020;
        flagsBuffer[particleIndex] = flagsBuffer[particleIndex] | b2_zombieParticle;
      } catch {
        // Flags not available, can't mark as zombie
      }
    }
  };

  world.SetContactListener(contactListener);
}

/**
 * Solves the erosion and deposition simulation.
 */
export function solve(
  _dt: number,
  terrain: Terrain,
  particleSystem: any,
  box2d: any,
  world: any,
  accumulator: ErosionAccumulator,
  config: ErosionConfig,
  worldWidth: number,
  _worldHeight: number,
): void {
  const modifiedIndices = new Set<number>();

  // Step 1: Erode terrain based on accumulated contact
  for (let i = 0; i < terrain.heights.length; i++) {
    const impulse = accumulator.get(i);
    if (impulse > config.erosionThreshold) {
      const erosionAmount = impulse * config.erosionRate;
      terrain.erodeAt(i, erosionAmount);
      modifiedIndices.add(i);

      // Step 3: Spawn sediment particles at erosion sites
      spawnSedimentParticles(box2d, particleSystem, terrain, i, erosionAmount, config, worldWidth);
    }
  }

  // Step 2: Smooth modified vertices
  if (modifiedIndices.size > 0) {
    // Expand smoothing window
    const expandedIndices = new Set(modifiedIndices);
    for (const i of modifiedIndices) {
      if (i > 0) expandedIndices.add(i - 1);
      if (i < terrain.heights.length - 1) expandedIndices.add(i + 1);
    }
    terrain.smooth(expandedIndices);
  }

  // Step 4: Convert resting sediment back to terrain (simple approach)
  convertSedimentToTerrain(particleSystem, terrain, box2d, worldWidth);

  // Step 5: Rebuild terrain chain if dirty
  if (terrain.isDirty) {
    terrain.rebuild(box2d, world, worldWidth);
  }

  // Step 6: Reset accumulator
  accumulator.reset();
}

/**
 * Spawns sediment particles at erosion locations with b2_powderParticle flag.
 */
function spawnSedimentParticles(
  box2d: any,
  particleSystem: any,
  terrain: Terrain,
  terrainIndex: number,
  erosionAmount: number,
  config: ErosionConfig,
  worldWidth: number,
): void {
  const particleCount = Math.max(1, Math.floor(erosionAmount * config.burstSize));
  const step = worldWidth / (terrain.heights.length - 1);
  const x = terrainIndex * step;
  const y = terrain.heights[terrainIndex] + 0.5;

  const b2Vec2 = box2d.b2Vec2;
  const b2ParticleGroupDef = box2d.b2ParticleGroupDef;

  // Powder particle flag for sediment behavior (scatters like sand)
  const b2_powderParticle = box2d.b2_powderParticle || 0x0008;

  for (let i = 0; i < particleCount && i < 10; i++) {
    const offsetX = (Math.random() - 0.5) * 1.0;
    const offsetY = (Math.random() - 0.5) * 0.5;
    const def = new b2ParticleGroupDef();
    def.position = new b2Vec2(x + offsetX, y + offsetY);
    def.particleCount = 1;
    def.flags = b2_powderParticle; // Mark as sediment
    def.linearVelocity = new b2Vec2((Math.random() - 0.5) * 2, -1);

    particleSystem.CreateParticleGroup(def);
  }
}

/**
 * Converts particles flagged as sediment that are at rest back into terrain height.
 * Checks velocity of sediment particles; if velocity < threshold for N frames, convert to terrain.
 */
function convertSedimentToTerrain(
  particleSystem: any,
  terrain: Terrain,
  box2d: any,
  worldWidth: number,
): void {
  // Try to get flags and velocity buffers
  let flagsBuffer: Uint32Array | null = null;
  let velocityBuffer: Float32Array | null = null;
  let posBuffer: Float32Array | null = null;

  try {
    flagsBuffer = particleSystem.GetFlagsBuffer();
    velocityBuffer = particleSystem.GetVelocityBuffer();
    posBuffer = particleSystem.GetPositionBuffer();
  } catch {
    // Buffers not available, skip deposition
    return;
  }

  const b2_powderParticle = box2d.b2_powderParticle || 0x0008;
  const b2_zombieParticle = box2d.b2_zombieParticle || 0x0020;

  const particleCount = particleSystem.GetParticleCount();
  const velocityThreshold = 0.2; // m/s below which particle is considered "at rest"

  // Find sediment particles that are at rest and close to terrain
  const depositionLocations = new Map<number, number>(); // terrainIndex -> total deposition

  for (let i = 0; i < particleCount; i++) {
    if (!flagsBuffer || !velocityBuffer || !posBuffer) continue;

    // Check if particle is sediment
    const isSediment = (flagsBuffer[i] & b2_powderParticle) !== 0;
    if (!isSediment) continue;

    // Check velocity magnitude
    const vx = velocityBuffer[i * 2];
    const vy = velocityBuffer[i * 2 + 1];
    const velocityMag = Math.sqrt(vx * vx + vy * vy);

    if (velocityMag < velocityThreshold) {
      // Particle is at rest; find nearest terrain vertex
      const x = posBuffer[i * 2];
      const y = posBuffer[i * 2 + 1];

      // Find nearest terrain index
      const terrainIndex = Math.round((x / worldWidth) * (terrain.heights.length - 1));

      if (terrainIndex >= 0 && terrainIndex < terrain.heights.length) {
        // Check if particle is at or near the surface
        if (y <= terrain.heights[terrainIndex] + 0.5) {
          const deposition = 0.01; // small height increase per deposited particle
          if (!depositionLocations.has(terrainIndex)) {
            depositionLocations.set(terrainIndex, 0);
          }
          depositionLocations.set(
            terrainIndex,
            (depositionLocations.get(terrainIndex) || 0) + deposition,
          );

          // Mark particle for removal
          flagsBuffer[i] = flagsBuffer[i] | b2_zombieParticle;
        }
      }
    }
  }

  // Apply deposition to terrain
  if (depositionLocations.size > 0) {
    for (const [terrainIndex, amount] of depositionLocations) {
      terrain.heights[terrainIndex] += amount;
    }
    terrain.isDirty = true;
  }
}
