import { useState, useEffect, useRef } from "react";

/**
 * Converts HSL to RGB.
 */
function hslToRgb(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

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
export function useColorAnimation() {
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

  // Constants
  const JERK = 8.0; // Extreme jerk to swing velocity direction rapidly
  const DECAY = 0.75; // Very slow decay so momentum builds up strongly
  const MAX_V = 0.5; // Smooth, gradual speed
  const SATURATION = 70;
  const LIGHTNESS = 55;

  // Animation loop for momentum drift (only runs after first mouse move)
  const animationLoop = () => {
    const state = stateRef.current;

    if (!state.active) {
      state.rafId = requestAnimationFrame(animationLoop);
      return;
    }

    const dt = 0.016; // ~60fps

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
