import { useEffect } from "react";

/**
 * Custom hook that replicates FlowType.js functionality
 * Provides responsive typography that scales font size based on viewport width
 *
 * @param {Object} options - Configuration options
 * @param {number} options.minimum - Minimum element width (default: 320)
 * @param {number} options.maximum - Maximum element width (default: 960)
 * @param {number} options.minFont - Minimum font size in pixels (default: 20)
 * @param {number} options.maxFont - Maximum font size in pixels (default: 32)
 * @param {number} options.fontRatio - Font ratio divisor (default: 32)
 * @param {number} options.lineRatio - Line height ratio (default: 1.45)
 */
export const useFlowType = (options = {}) => {
  const {
    minimum = 320,
    maximum = 960,
    minFont = 20,
    maxFont = 32,
    fontRatio = 32,
    lineRatio = 1.45,
  } = options;

  useEffect(() => {
    const updateFontSize = () => {
      const width = Math.max(minimum, Math.min(maximum, window.innerWidth));
      const fontSize = Math.max(minFont, Math.min(maxFont, width / fontRatio));

      document.body.style.fontSize = `${fontSize}px`;
      document.body.style.lineHeight = lineRatio;
    };

    updateFontSize();
    window.addEventListener("resize", updateFontSize);

    return () => {
      window.removeEventListener("resize", updateFontSize);
    };
  }, [minimum, maximum, minFont, maxFont, fontRatio, lineRatio]);
};
