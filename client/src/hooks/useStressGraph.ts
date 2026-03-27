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
  const isPausedRef = useRef(false);

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
    if (!state.initialized || isPausedRef.current) return;

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
    let destroyed = false;
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!glCanvas || !overlayCanvas) return;

    const config = externalConfig || getDefaultStressGraphConfig();

    // Wait for layout to settle before reading canvas dimensions
    const measureAndInit = () => {
      if (destroyed) return;

      const container = glCanvas.parentElement;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (width === 0 || height === 0) {
        // Layout not ready, try again next frame
        requestAnimationFrame(measureAndInit);
        return;
      }

      // Set canvas to full container dimensions
      glCanvas.width = width;
      glCanvas.height = height;
      overlayCanvas.width = width;
      overlayCanvas.height = height;

      const state = stateRef.current;

      // Initialize renderers
      try {
        state.glRenderer = new GLRenderer(glCanvas);
        state.overlayRenderer = new OverlayRenderer(overlayCanvas);
      } catch (error) {
        console.error("[useStressGraph] Failed to initialize renderers:", error);
        return;
      }

      // Initialize physics with actual canvas dimensions
      state.seedField = new SeedField(config, width, height);
      state.seedField.initialize();

      state.stressModel = new StressModel(glCanvas, config);
      state.stressModel.attach();

      state.fractureSystem = new FractureSystem(config, config.seedCount);

      state.config = config;
      state.canvasSize = Math.max(width, height);

      // Mark as initialized
      state.initialized = true;
    };

    // Click handler for fracturing (left-click only)
    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left-click only

      const state = stateRef.current;
      if (!state.seedField || !state.fractureSystem) return;

      const rect = glCanvas.getBoundingClientRect();
      const scaleX = glCanvas.width / rect.width;
      const scaleY = glCanvas.height / rect.height;

      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      state.fractureSystem.fracture(mx, my, state.seedField);
      state.fractureSystem.touch();
    };

    glCanvas.addEventListener("click", handleClick);

    // Touch handler for fracturing (tap only)
    const handleTouchEnd = (e: TouchEvent) => {
      // Only fracture on tap if it wasn't a long press (gravity well)
      if (e.changedTouches.length === 0) return;

      const state = stateRef.current;
      if (!state.stressModel || !state.seedField || !state.fractureSystem) return;

      // If gravity well is active (long press), don't fracture
      if (state.stressModel.cursor.isRightHeld) return;

      const rect = glCanvas.getBoundingClientRect();
      const scaleX = glCanvas.width / rect.width;
      const scaleY = glCanvas.height / rect.height;

      const mx = (e.changedTouches[0].clientX - rect.left) * scaleX;
      const my = (e.changedTouches[0].clientY - rect.top) * scaleY;

      state.fractureSystem.fracture(mx, my, state.seedField);
      state.fractureSystem.touch();
    };

    glCanvas.addEventListener("touchend", handleTouchEnd);

    // Spacebar handler for randomizing hues
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        stateRef.current.seedField?.randomizeHues();
        stateRef.current.fractureSystem?.touch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Resize handler with debounce
    let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleWindowResize = () => {
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);

      resizeTimeoutId = setTimeout(() => {
        const state = stateRef.current;
        if (!state.glRenderer || !state.overlayRenderer || !state.seedField) return;

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
          state.canvasSize = Math.max(newWidth, newHeight);

          // Reset seeds on resize with new dimensions
          state.seedField.setDimensions(newWidth, newHeight);
          state.seedField.seeds = [];
          state.seedField.resetId();
          state.seedField.initialize();
          state.fractureSystem!.crackLines = [];
        }
      }, 200);
    };

    window.addEventListener("resize", handleWindowResize);

    // Expose randomizeHues callback
    randomizeHuesCallbackRef.current = () => {
      stateRef.current.seedField?.randomizeHues();
      stateRef.current.fractureSystem?.touch();
    };

    // Measure layout and initialize
    requestAnimationFrame(measureAndInit);

    // Cleanup
    return () => {
      destroyed = true;
      if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
      glCanvas.removeEventListener("click", handleClick);
      glCanvas.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleWindowResize);

      stateRef.current.stressModel?.detach();
      stateRef.current.glRenderer?.destroy();

      stateRef.current.initialized = false;
    };
  }, [externalConfig]);

  return {
    glCanvasRef,
    overlayCanvasRef,
    randomizeHues: () => randomizeHuesCallbackRef.current?.(),
    togglePause: () => {
      isPausedRef.current = !isPausedRef.current;
      return isPausedRef.current;
    },
    isPaused: () => isPausedRef.current,
    reset: () => {
      const state = stateRef.current;
      if (!state.seedField || !state.fractureSystem || !state.glRenderer || !state.overlayRenderer)
        return;
      state.seedField.seeds = [];
      state.seedField.resetId();
      state.seedField.initialize();
      state.fractureSystem.crackLines = [];

      // Force a render even if paused
      const glData = state.seedField.packForGL();
      state.glRenderer.render(glData);
      state.overlayRenderer.render(0, 0, false, [], state.canvasSize);
    },
  };
};
