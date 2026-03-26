import { useEffect, useRef, useCallback } from "react";
import { useAnimationLoop } from "./useAnimationLoop";
import type { ErosionConfig } from "../erosion/config";
import { getDefaultErosionConfig } from "../erosion/config";
import { generateHeightmap, Terrain, buildChainVertices } from "../erosion/Terrain";
import { createWorld, createParticleSystem, stepWorld, toMeters } from "../erosion/ErosionWorld";
import { Cursor, type CursorState } from "../erosion/Cursor";
import { ErosionAccumulator, setupContactListener, solve } from "../erosion/ErosionSolver";
import { TerrainRenderer } from "../erosion/TerrainRenderer";
import { ParticleRenderer } from "../erosion/ParticleRenderer";

export const useErosion = (externalConfig?: ErosionConfig) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resetTerrainCallbackRef = useRef<(() => void) | null>(null);
  const stateRef = useRef<{
    drainBody: any;
    world: any;
    cursor: any;
    Box2D: any;
    terrain: any;
    particleSystem: any;
    terrainRenderer: any;
    particleRenderer: any;
    accumulator: any;
    frameCount: number;
    initialized: boolean;
    canvas: HTMLCanvasElement | null;
    ctx: CanvasRenderingContext2D | null;
    config: ErosionConfig;
    worldWidth: number;
    worldHeight: number;
    drainBodyRef: { current: any };
  }>({
    drainBody: null,
    world: null,
    cursor: null,
    Box2D: null,
    terrain: null,
    particleSystem: null,
    terrainRenderer: null,
    particleRenderer: null,
    accumulator: null,
    frameCount: 0,
    initialized: false,
    canvas: null,
    ctx: null,
    config: getDefaultErosionConfig(),
    worldWidth: 0,
    worldHeight: 0,
    drainBodyRef: { current: null },
  });

  // Animation callback at top level - not in useEffect
  const animationCallback = useCallback((deltaTime: number) => {
    const state = stateRef.current;
    if (!state.initialized || !state.canvas || !state.ctx) return;

    const { config, ctx, worldWidth, worldHeight, drainBodyRef } = state;
    const { w, h } = {
      w: state.canvas.width,
      h: state.canvas.height,
    };

    state.frameCount += deltaTime;
    const cursorState: CursorState = state.cursor.update();

    // Spawn rain particles at cursor
    if (cursorState.spawnRain) {
      const x = cursorState.worldPos.x;
      const y = cursorState.worldPos.y;

      for (let i = 0; i < config.rainRate; i++) {
        const offsetX = (Math.random() - 0.5) * config.rainSpreadRadius;
        const offsetY = (Math.random() - 0.5) * config.rainSpreadRadius;

        const def = new state.Box2D.b2ParticleGroupDef();
        def.position = new state.Box2D.b2Vec2(x + offsetX, y + offsetY);
        def.particleCount = 1;
        def.linearVelocity = new state.Box2D.b2Vec2((Math.random() - 0.5) * 2, -2);

        state.particleSystem.CreateParticleGroup(def);
      }
    }

    // Spawn release burst (2x normal burst on mouse release)
    if (cursorState.spawnReleaseBurst) {
      const x = cursorState.worldPos.x;
      const y = cursorState.worldPos.y;
      const burstCount = Math.floor(config.burstSize * 2);

      for (let i = 0; i < burstCount; i++) {
        const offsetX = (Math.random() - 0.5) * config.rainSpreadRadius;
        const offsetY = (Math.random() - 0.5) * config.rainSpreadRadius;

        const def = new state.Box2D.b2ParticleGroupDef();
        def.position = new state.Box2D.b2Vec2(x + offsetX, y + offsetY);
        def.particleCount = 1;
        def.linearVelocity = new state.Box2D.b2Vec2((Math.random() - 0.5) * 3, -3);

        state.particleSystem.CreateParticleGroup(def);
      }
    }

    // Drain particles at cursor (right-click)
    if (cursorState.drainActive) {
      if (!state.drainBody) {
        const b2BodyDef = state.Box2D.b2BodyDef;
        const bodyDef = new b2BodyDef();
        bodyDef.type = 2;
        bodyDef.position = new state.Box2D.b2Vec2(cursorState.worldPos.x, cursorState.worldPos.y);
        state.drainBody = state.world.CreateBody(bodyDef);
        drainBodyRef.current = state.drainBody;

        const b2PolygonShape = state.Box2D.b2PolygonShape;
        const shape = new b2PolygonShape();
        shape.SetAsBox(0.3, 0.3);

        const fixtureDef = new state.Box2D.b2FixtureDef();
        fixtureDef.shape = shape;
        fixtureDef.density = 0;
        state.drainBody.CreateFixture(fixtureDef);
      } else {
        state.drainBody.SetPosition(
          new state.Box2D.b2Vec2(cursorState.worldPos.x, cursorState.worldPos.y),
        );
      }
    } else if (state.drainBody) {
      state.world.DestroyBody(state.drainBody);
      state.drainBody = null;
      drainBodyRef.current = null;
    }

    stepWorld(state.world, state.particleSystem, deltaTime * 0.016);

    solve(
      deltaTime * 0.016,
      state.terrain,
      state.particleSystem,
      state.Box2D,
      state.world,
      state.accumulator,
      config,
      worldWidth,
      worldHeight,
    );

    const particleCount = state.particleSystem.GetParticleCount();
    if (particleCount > config.maxParticles) {
      try {
        const flagsBuffer = state.particleSystem.GetFlagsBuffer();
        const b2_zombieParticle = state.Box2D.b2_zombieParticle || 0x0020;

        const toRemove = Math.floor(particleCount * 0.1);
        for (let i = 0; i < toRemove && i < particleCount; i++) {
          flagsBuffer[i] = flagsBuffer[i] | b2_zombieParticle;
        }
      } catch {
        // Flags not available
      }
    }

    ctx.clearRect(0, 0, w, h);
    state.terrainRenderer.draw(ctx, state.terrain, state.canvas);
    state.particleRenderer.draw(ctx, state.particleSystem, config, state.frameCount, state.Box2D);
    state.cursor.draw(ctx);
  }, []);

  // Call hook at top level
  useAnimationLoop(animationCallback);

  useEffect(() => {
    let destroyed = false;
    const canvas = canvasRef.current;

    if (!canvas) return;

    const config = externalConfig || getDefaultErosionConfig();
    const parentElement = canvas.parentElement;
    if (!parentElement) return;

    const w = parentElement.clientWidth;
    const h = parentElement.clientHeight || Math.floor(w * 0.6);

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const worldWidth = toMeters(w);
    const worldHeight = toMeters(h);

    const drainBodyRef = { current: null as any };
    const state = stateRef.current;

    // Store context in state for animation callback
    state.canvas = canvas;
    state.ctx = ctx;
    state.config = config;
    state.worldWidth = worldWidth;
    state.worldHeight = worldHeight;
    state.drainBodyRef = drainBodyRef;

    const init = async () => {
      try {
        // Import LiquidFun WASM from explicit entry point
        // @ts-ignore - liquidfun-wasm has incorrect type definitions
        const Box2DModule = await import("liquidfun-wasm/dist/es/entry.js");
        const Box2D = await Box2DModule.default();

        if (destroyed) return;

        // Declare local variables for initialization
        let world: ReturnType<typeof createWorld>;
        let cursor: Cursor;
        let terrain: Terrain;
        let particleSystem: ReturnType<typeof createParticleSystem>;
        let terrainRenderer: TerrainRenderer;
        let particleRenderer: ParticleRenderer;
        let accumulator: ErosionAccumulator;

        // Create physics world
        world = createWorld(Box2D);

        // Create terrain ground body
        const b2BodyDef = Box2D.b2BodyDef;
        const bodyDef = new b2BodyDef();
        bodyDef.type = 1; // Static body
        const terrainBody = world.CreateBody(bodyDef);

        // Generate heightmap and build terrain
        const heights = generateHeightmap(config, worldWidth, worldHeight);

        const vertices = buildChainVertices(heights, worldWidth);
        const b2Vec2 = Box2D.b2Vec2;
        const b2ChainShape = Box2D.b2ChainShape;

        const chainShape = new b2ChainShape();
        const verts: any[] = [];
        for (const v of vertices) {
          verts.push(new b2Vec2(v.x, v.y));
        }
        chainShape.CreateChain(verts);

        const fixtureDef = new Box2D.b2FixtureDef();
        fixtureDef.shape = chainShape;
        fixtureDef.density = 0;
        fixtureDef.friction = 0.3;
        fixtureDef.restitution = 0.1;

        const fixture = terrainBody.CreateFixture(fixtureDef);
        terrain = new Terrain(heights, terrainBody, fixture);

        // Create particle system
        particleSystem = createParticleSystem(Box2D, world, config);

        // Create cursor
        cursor = new Cursor();
        cursor.attach(canvas);

        // Create renderers
        terrainRenderer = new TerrainRenderer();
        particleRenderer = new ParticleRenderer();

        // Create erosion solver
        accumulator = new ErosionAccumulator(config.terrainResolution);
        setupContactListener(
          Box2D,
          world,
          terrain,
          particleSystem,
          accumulator,
          worldWidth,
          drainBodyRef,
        );

        // Populate state ref with initialized values
        state.Box2D = Box2D;
        state.world = world;
        state.terrain = terrain;
        state.particleSystem = particleSystem;
        state.cursor = cursor;
        state.terrainRenderer = terrainRenderer;
        state.particleRenderer = particleRenderer;
        state.accumulator = accumulator;
        state.frameCount = 0;
        state.drainBody = null;

        // Reset callback
        resetTerrainCallbackRef.current = () => {
          const newHeights = generateHeightmap(
            { ...config, terrainSeed: Math.random() * 1000 },
            worldWidth,
            worldHeight,
          );
          state.terrain.heights = newHeights;
          state.terrain.isDirty = true;
          state.terrain.rebuild(state.Box2D, state.world, worldWidth);
        };

        // Mark as initialized - this allows the top-level animation callback to run
        state.initialized = true;
      } catch (error) {
        console.error("Failed to initialize erosion simulation:", error);
      }
    };

    void init();

    return () => {
      destroyed = true;
      // Cleanup drain body if it exists
      if (stateRef.current.drainBody && stateRef.current.world) {
        stateRef.current.world.DestroyBody(stateRef.current.drainBody);
      }
      // Cleanup cursor listeners
      if (stateRef.current.cursor) {
        stateRef.current.cursor.detach();
      }
    };
  }, [externalConfig]);

  return { canvasRef, resetTerrain: () => resetTerrainCallbackRef.current?.() };
};
