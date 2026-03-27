import { useEffect, useRef, useCallback } from "react";
import { useAnimationLoop } from "./useAnimationLoop";
import type { StressGraphConfig } from "../stressgraph/config";
import { getDefaultStressGraphConfig } from "../stressgraph/config";
import { SeedField } from "../stressgraph/SeedField";
import { StressModel } from "../stressgraph/StressModel";
import { FractureSystem } from "../stressgraph/FractureSystem";
import { GLRenderer } from "../stressgraph/GLRenderer";
import { OverlayRenderer } from "../stressgraph/OverlayRenderer";

export const useStressGraph = (externalConfig?: StressGraphConfig) => {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const randomizeHuesCallbackRef = useRef<(() => void) | null>(null);

  const stateRef = useRef<{
    glRenderer: GLRenderer | null;
    overlayRenderer: OverlayRenderer | null;
    seedField: SeedField | null;
    stressModel: StressModel | null;
    fractureSystem: FractureSystem | null;
    config: StressGraphConfig;
    canvasSize: number;
    initialized: boolean;
  }>({
    glRenderer: null,
    overlayRenderer: null,
    seedField: null,
    stressModel: null,
    fractureSystem: null,
    config: getDefaultStressGraphConfig(),
    canvasSize: 0,
    initialized: false,
  });

  // Animation callback at top level - not in useEffect
  const animationCallback = useCallback((deltaTime: number) => {
    const state = stateRef.current;
    if (!state.initialized) return;

    const cursor = state.stressModel!.update();

    // Apply forces based on right-click state
    if (!cursor.isRightHeld) {
      state.stressModel!.applyRepulsion(state.seedField!);
    } else {
      state.stressModel!.applyGravityWell(state.seedField!);
    }

    // Physics step
    state.seedField!.step(deltaTime);

    // Update cracks
    state.fractureSystem!.updateCracks(deltaTime);

    // Try healing idle fractured seeds
    state.fractureSystem!.tryHeal(state.seedField!, state.stressModel!.isIdle());

    // Render
    const glData = state.seedField!.packForGL();
    state.glRenderer!.render(glData);

    state.overlayRenderer!.render(
      cursor.x,
      cursor.y,
      cursor.isRightHeld,
      state.fractureSystem!.crackLines,
      state.canvasSize,
    );
  }, []);

  // Call hook at top level
  useAnimationLoop(animationCallback);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!glCanvas || !overlayCanvas) return;

    // Determine canvas size from container
    const container = glCanvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set canvas sizes to match container
    glCanvas.width = width;
    glCanvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    // Use smaller dimension for physics simulation (square Voronoi)
    const canvasSize = Math.min(width, height);

    const config = externalConfig || getDefaultStressGraphConfig();
    const state = stateRef.current;

    // Initialize renderers
    try {
      state.glRenderer = new GLRenderer(glCanvas);
      state.overlayRenderer = new OverlayRenderer(overlayCanvas);
    } catch (error) {
      console.error("[useStressGraph] Failed to initialize renderers:", error);
      return;
    }

    // Initialize physics
    state.seedField = new SeedField(config, canvasSize);
    state.seedField.initialize();

    state.stressModel = new StressModel(glCanvas, config);
    state.stressModel.attach();

    state.fractureSystem = new FractureSystem(config, config.seedCount);

    state.config = config;
    state.canvasSize = canvasSize;

    // Click handler for fracturing (left-click only)
    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left-click only

      const rect = glCanvas.getBoundingClientRect();
      const scaleX = glCanvas.width / rect.width;
      const scaleY = glCanvas.height / rect.height;

      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      state.fractureSystem!.fracture(mx, my, state.seedField!);
      state.fractureSystem!.touch();
    };

    glCanvas.addEventListener("click", handleClick);

    // Spacebar handler for randomizing hues
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        state.seedField!.randomizeHues();
        state.fractureSystem!.touch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Resize handler
    const handleWindowResize = () => {
      const state = stateRef.current;
      if (!state.glRenderer || !state.overlayRenderer) return;

      const container = glCanvas.parentElement;
      if (!container) return;

      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      if (newWidth !== glCanvas.width || newHeight !== glCanvas.height) {
        glCanvas.width = newWidth;
        glCanvas.height = newHeight;
        overlayCanvas.width = newWidth;
        overlayCanvas.height = newHeight;

        state.glRenderer.resize(newWidth, newHeight);
      }
    };

    window.addEventListener("resize", handleWindowResize);

    // Expose randomizeHues callback
    randomizeHuesCallbackRef.current = () => {
      state.seedField?.randomizeHues();
      state.fractureSystem?.touch();
    };

    // Mark as initialized
    state.initialized = true;

    // Cleanup
    return () => {
      glCanvas.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleWindowResize);

      state.stressModel?.detach();
      state.glRenderer?.destroy();

      state.initialized = false;
    };
  }, [externalConfig]);

  return {
    glCanvasRef,
    overlayCanvasRef,
    randomizeHues: () => randomizeHuesCallbackRef.current?.(),
  };
};
