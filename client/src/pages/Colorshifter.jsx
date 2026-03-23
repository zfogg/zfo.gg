import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useColorAnimation, getDefaultColorAnimationConfig } from "../hooks/useColorAnimation";
import CanvasControls from "../components/CanvasControls";

const Colorshifter = () => {
  const [config, setConfig] = useState(getDefaultColorAnimationConfig());
  const { bgColor, fgColor, isActive } = useColorAnimation(config);

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  // Update page title
  useEffect(() => {
    document.title = "colorshifter - zfo.gg";
  }, []);

  // Apply background color and CSS variables for animation
  useEffect(() => {
    if (isActive) {
      document.body.style.backgroundColor = bgColor;
      document.documentElement.style.setProperty("--home-fg", fgColor);
      document.body.classList.add("home-active");
    }

    return () => {
      document.body.style.backgroundColor = "";
      document.documentElement.style.removeProperty("--home-fg");
      document.body.classList.remove("home-active");
    };
  }, [bgColor, fgColor, isActive]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full overflow-x-hidden">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section
        id="content"
        className="flex-1 flex justify-center items-center w-full text-center px-4 pt-8 relative"
      >
        <CanvasControls>
          <div className="canvas-control text-center">
            <p className="text-sm mb-1">Jerk</p>
            <input
              type="range"
              min="0.1"
              max="20"
              step="0.5"
              value={config.jerk}
              onChange={(e) => handleChange("jerk", e.target.value)}
              className="w-[100px]"
            />
          </div>

          <div className="canvas-control text-center">
            <p className="text-sm mb-1">Decay</p>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={config.decay}
              onChange={(e) => handleChange("decay", e.target.value)}
              className="w-[100px]"
            />
          </div>

          <div className="canvas-control text-center">
            <p className="text-sm mb-1">Max Velocity</p>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={config.maxV}
              onChange={(e) => handleChange("maxV", e.target.value)}
              className="w-[100px]"
            />
          </div>

          <div className="canvas-control text-center">
            <p className="text-sm mb-1">Saturation</p>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={config.saturation}
              onChange={(e) => handleChange("saturation", e.target.value)}
              className="w-[100px]"
            />
          </div>

          <div className="canvas-control text-center">
            <p className="text-sm mb-1">Lightness</p>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={config.lightness}
              onChange={(e) => handleChange("lightness", e.target.value)}
              className="w-[100px]"
            />
          </div>
        </CanvasControls>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h3 className="text-4xl">colorshifter</h3>
            <p className="sm:text-2xl font-sans tracking-wide relative z-10 mt-4">
              An interactive color animation that drifts with your cursor
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Colorshifter;
