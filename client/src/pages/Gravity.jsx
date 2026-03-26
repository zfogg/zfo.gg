import { useEffect, useState } from "react";
import { useGravity } from "../hooks/useGravity";
import CanvasControls from "../components/CanvasControls";
import { getDefaultGravityConfig } from "../gravity/config";

const Gravity = () => {
  const [config, setConfig] = useState(getDefaultGravityConfig());
  const { canvasRef, resetSquares } = useGravity(config);

  // Update page title
  useEffect(() => {
    document.title = "Gravity - zfo.gg";
  }, []);

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleResetDefaults = () => {
    setConfig(getDefaultGravityConfig());
  };

  const handleResetSquares = () => {
    resetSquares();
  };

  return (
    <section id="content" className="flex-1 flex flex-col items-center justify-center w-full">
        <div id="gravity" className="relative w-full min-w-[320px] text-center">
          <h3>
            gravity
            <br />
            <small>a 2d n-body simulation</small>
          </h3>
          <div id="canvas-container" className="relative block max-w-[960px] w-full mx-auto">
            <a
              href="https://arborjs.org/docs/barnes-hut"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-0 right-0 text-sm hover:underline z-10 p-2"
            >
              📝 barnes-hut algorithm
            </a>
            <canvas
              ref={canvasRef}
              id="canvas"
              className="block mx-auto cursor-none"
              onContextMenu={(e) => e.preventDefault()}
            />
            <CanvasControls>
              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Gravitational Attraction</p>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="3"
                  value={config.gravity * 100}
                  onChange={(e) => handleChange("gravity", e.target.value / 100)}
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Atmospheric Friction</p>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="3"
                  value={config.friction * 100000}
                  onChange={(e) => handleChange("friction", e.target.value / 100000)}
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Gravity Deadzone Radius</p>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="3"
                  value={config.distance}
                  onChange={(e) => handleChange("distance", e.target.value)}
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Cursor Friction Coefficient</p>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="3"
                  value={config.cursorFriction * 10}
                  onChange={(e) => handleChange("cursorFriction", e.target.value / 10)}
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Cursor Body Mass</p>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="3"
                  value={config.cursorMass * 0.01}
                  onChange={(e) => handleChange("cursorMass", e.target.value / 0.01)}
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Cursor Release Force</p>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="3"
                  value={config.cursorForce * 100}
                  onChange={(e) => handleChange("cursorForce", e.target.value / 100)}
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Rows of Squares</p>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={config.particlesN}
                  onChange={(e) =>
                    handleChange("particlesN", Math.max(1, Math.min(40, e.target.value)))
                  }
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px] bg-white/75 text-black border border-[#85b1de] p-1"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <input
                  type="button"
                  value="Default Values"
                  onClick={handleResetDefaults}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px] px-[6px] py-[6px] font-bold rounded-[5px] cursor-pointer bg-white text-black border border-[#85b1de]"
                  style={{
                    boxShadow:
                      "inset 2px 2px 4px rgb(50, 50, 90), inset -2px -2px 4px rgb(110, 140, 150)",
                  }}
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <input
                  type="button"
                  value="Reset Squares"
                  onClick={handleResetSquares}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px] px-[6px] py-[6px] font-bold rounded-[5px] cursor-pointer bg-white text-black border border-[#85b1de]"
                  style={{
                    boxShadow:
                      "inset 2px 2px 4px rgb(50, 50, 90), inset -2px -2px 4px rgb(110, 140, 150)",
                  }}
                />
              </div>
            </CanvasControls>
          </div>
        </div>
      </section>
  );
};

export default Gravity;
