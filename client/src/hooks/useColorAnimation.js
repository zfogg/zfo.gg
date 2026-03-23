import { useState, useEffect, useRef } from "react";
import { hslToRgb } from "../utils/color";

/**
 * Computes WCAG relative luminance from RGB.
 */
function getRelativeLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes a readable foreground color (dark or light grey) based on background luminance.
 */
function getReadableFgColor(bgColor) {
  // Parse the HSL color and convert to RGB
  const match = bgColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "#222222"; // fallback

  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const l = parseInt(match[3], 10);

  const [r, g, b] = hslToRgb(h, s, l);
  const luminance = getRelativeLuminance(r, g, b);

  // If luminance is high (bright background), use dark text. Otherwise light text.
  return luminance > 0.179 ? "hsl(0, 0%, 12%)" : "hsl(0, 0%, 90%)";
}

/**
 * Hook that manages a color animation based on mouse movement.
 * Returns { bgColor, fgColor } as HSL strings.
 */
export const getDefaultColorAnimationConfig = () => ({
  jerk: 8.0,
  decay: 0.75,
  maxV: 0.5,
  saturation: 70,
  lightness: 55,
  animationSpeed: 250,
});

export function useColorAnimation(config = getDefaultColorAnimationConfig()) {
  const [bgColor, setBgColor] = useState("hsl(180, 70%, 55%)");
  const [fgColor, setFgColor] = useState("hsl(0, 0%, 12%)");
  const [isActive, setIsActive] = useState(false);

  const stateRef = useRef({
    hue: 180,
    velocity: 1.0,
    momentum: 0,
    lastX: null,
    lastY: null,
    rafId: null,
    active: false, // Only start animation after first mouse move
  });

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Animation loop for momentum drift (only runs after first mouse move)
  const animationLoop = () => {
    const state = stateRef.current;
    const cfg = configRef.current;

    if (!state.active) {
      state.rafId = requestAnimationFrame(animationLoop);
      return;
    }

    const dt = 0.016; // ~60fps
    const JERK = cfg.jerk ?? 8.0;
    const DECAY = cfg.decay ?? 0.75;
    const MAX_V = cfg.maxV ?? 0.5;
    const SATURATION = cfg.saturation ?? 70;
    const LIGHTNESS = cfg.lightness ?? 55;

    // Add random jerk to momentum
    state.momentum += (Math.random() - 0.5) * JERK * dt;
    // Clamp momentum to prevent it from accumulating unbounded
    state.momentum = Math.max(-2.0, Math.min(2.0, state.momentum));
    // Apply decay to momentum
    state.momentum *= Math.pow(DECAY, dt);
    // Update velocity based on momentum
    state.velocity += state.momentum * dt;
    // Clamp velocity
    state.velocity = Math.max(-MAX_V, Math.min(MAX_V, state.velocity));

    // Update color
    const newBgColor = `hsl(${Math.round(state.hue)}, ${SATURATION}%, ${LIGHTNESS}%)`;
    setBgColor(newBgColor);
    setFgColor(getReadableFgColor(newBgColor));

    state.rafId = requestAnimationFrame(animationLoop);
  };

  // Mouse move listener
  const handleMouseMove = (e) => {
    const state = stateRef.current;

    // Activate animation on first mouse move
    if (!state.active) {
      state.active = true;
      setIsActive(true);
    }

    const x = e.clientX;
    const y = e.clientY;

    if (state.lastX !== null && state.lastY !== null) {
      const dx = x - state.lastX;
      const dy = y - state.lastY;
      const distance = Math.hypot(dx, dy);

      // Advance hue based on distance and velocity
      state.hue += state.velocity * distance;
      // Wrap hue to [0, 360)
      state.hue = ((state.hue % 360) + 360) % 360;
    }

    state.lastX = x;
    state.lastY = y;
  };

  useEffect(() => {
    const state = stateRef.current;

    // Start animation loop
    state.rafId = requestAnimationFrame(animationLoop);

    // Add mouse listener
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      // Cancel animation frame
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
      // Remove mouse listener
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return { bgColor, fgColor, isActive };
}
