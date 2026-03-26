import { useEffect, useRef } from "react";

/**
 * Reusable animation hook that handles frame-rate independent animation
 * by providing actual elapsed time (deltaTime) to the callback.
 *
 * @param callback - Function called each frame with deltaTime (0-2, clamped to prevent huge jumps)
 * @param targetFps - Target FPS for deltaTime calculation (default: 60)
 */
export function useAnimationLoop(
  callback: (deltaTime: number) => void,
  targetFps: number = 60,
): { animId: React.MutableRefObject<number | null> } {
  const animId = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const targetFrameTimeRef = useRef<number>(1000 / targetFps);

  useEffect(() => {
    targetFrameTimeRef.current = 1000 / targetFps;
  }, [targetFps]);

  useEffect(() => {
    const loop = () => {
      const now = performance.now();
      const deltaTime = Math.min(
        (now - lastFrameTimeRef.current) / targetFrameTimeRef.current,
        2, // Clamp to 2x speed max to prevent huge jumps
      );
      lastFrameTimeRef.current = now;

      callback(deltaTime);

      animId.current = requestAnimationFrame(loop);
    };

    animId.current = requestAnimationFrame(loop);

    return () => {
      if (animId.current) {
        cancelAnimationFrame(animId.current);
      }
    };
  }, [callback]);

  return { animId };
}
