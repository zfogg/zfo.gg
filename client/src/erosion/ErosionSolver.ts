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
    try {
      const particleIndex = particleBodyContact.GetParticleIndex();
      const body = particleBodyContact.GetBody();

      // Check if the body is the terrain
      if (body === terrain.body) {
        // GetPositionBuffer returns a pointer into the WASM heap.
        // Access as flat float pairs: [x0, y0, x1, y1, ...]
        const posPtr = box2d.getPointer(particleSystem.GetPositionBuffer());
        const floats = new Float32Array(
          box2d.HEAPF32.buffer,
          posPtr,
          particleSystem.GetParticleCount() * 2,
        );
        const px = floats[particleIndex * 2];

        // Convert world x-position to terrain index
        const terrainIndex = Math.round((px / worldWidth) * (terrain.heights.length - 1));

        // Accumulate a small impulse
        accumulator.add(terrainIndex, 0.1);
      }

      // Check if the body is the drain body
      if (drainBodyRef?.current && body === drainBodyRef.current) {
        // Mark particle for removal
        particleSystem.SetParticleFlags(
          particleIndex,
          particleSystem.GetParticleFlags(particleIndex) | (box2d.b2_zombieParticle || 0x0020),
        );
      }
    } catch {
      // Contact handling failed — non-fatal, skip this contact
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

  // Powder particle flag for sediment behavior (scatters like sand)
  const b2_powderParticle = box2d.b2_powderParticle || 0x0008;

  for (let i = 0; i < particleCount && i < 10; i++) {
    const offsetX = (Math.random() - 0.5) * 1.0;
    const offsetY = (Math.random() - 0.5) * 0.5;
    const def = new box2d.b2ParticleDef();
    const pos = new b2Vec2(x + offsetX, y + offsetY);
    const vel = new b2Vec2((Math.random() - 0.5) * 2, -1);
    def.set_position(pos);
    def.set_velocity(vel);
    def.set_flags(b2_powderParticle); // Mark as sediment

    particleSystem.CreateParticle(def);

    def.__destroy__();
    pos.__destroy__();
    vel.__destroy__();
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
  const b2_powderParticle = box2d.b2_powderParticle || 0x0008;
  const b2_zombieParticle = box2d.b2_zombieParticle || 0x0020;

  const particleCount = particleSystem.GetParticleCount();
  if (particleCount === 0) return;

  // Access WASM heap buffers for position and velocity
  let positions: Float32Array;
  let velocities: Float32Array;
  try {
    const posPtr = box2d.getPointer(particleSystem.GetPositionBuffer());
    positions = new Float32Array(box2d.HEAPF32.buffer, posPtr, particleCount * 2);
    const velPtr = box2d.getPointer(particleSystem.GetVelocityBuffer());
    velocities = new Float32Array(box2d.HEAPF32.buffer, velPtr, particleCount * 2);
  } catch {
    return; // Buffers not available, skip deposition
  }

  const velocityThreshold = 0.2; // m/s below which particle is considered "at rest"

  // Find sediment particles that are at rest and close to terrain
  const depositionLocations = new Map<number, number>(); // terrainIndex -> total deposition

  for (let i = 0; i < particleCount; i++) {
    // Check if particle is sediment via per-particle flags API
    let isSediment = false;
    try {
      isSediment = (particleSystem.GetParticleFlags(i) & b2_powderParticle) !== 0;
    } catch {
      continue;
    }
    if (!isSediment) continue;

    // Check velocity magnitude
    const vx = velocities[i * 2];
    const vy = velocities[i * 2 + 1];
    const velocityMag = Math.sqrt(vx * vx + vy * vy);

    if (velocityMag < velocityThreshold) {
      // Particle is at rest; find nearest terrain vertex
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];

      const terrainIndex = Math.round((x / worldWidth) * (terrain.heights.length - 1));

      if (terrainIndex >= 0 && terrainIndex < terrain.heights.length) {
        if (y <= terrain.heights[terrainIndex] + 0.5) {
          const deposition = 0.01;
          depositionLocations.set(
            terrainIndex,
            (depositionLocations.get(terrainIndex) || 0) + deposition,
          );

          // Mark particle for removal using the safe per-particle API
          particleSystem.SetParticleFlags(
            i,
            particleSystem.GetParticleFlags(i) | b2_zombieParticle,
          );
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
