import { useState, useEffect, useRef } from "react";

const CanvasControls = ({
  config,
  onConfigChange,
  onResetSquares,
  onResetDefaults,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  const handleChange = (key, value) => {
    onConfigChange({ ...config, [key]: parseFloat(value) });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      id="canvas-controls-container"
      className="absolute top-[15px] left-[20px] font-bold text-[13.5px]"
    >
      <h4 className="text-[1.61em] cursor-default">
        <a
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(!isVisible);
          }}
          className="cursor-pointer"
        >
          {isVisible ? "hide" : "show"}
        </a>
        {" controls"}
      </h4>

      {isVisible && (
        <div
          id="canvas-controls"
          className="max-w-[501px] bg-black/70 text-white text-[13px] font-bold p-[20px_9px_0] rounded mt-[10px]"
          style={{
            boxShadow:
              "3px 3px 6px rgb(50, 50, 90), -3px -3px 6px rgb(90, 180, 140)",
          }}
        >
          <div className="grid grid-cols-3 gap-2">
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
                onChange={(e) =>
                  handleChange("friction", e.target.value / 100000)
                }
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
                onChange={(e) =>
                  handleChange("cursorFriction", e.target.value / 10)
                }
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
                onChange={(e) =>
                  handleChange("cursorMass", e.target.value / 0.01)
                }
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
                onChange={(e) =>
                  handleChange("cursorForce", e.target.value / 100)
                }
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
                  handleChange(
                    "particlesN",
                    Math.max(1, Math.min(40, e.target.value)),
                  )
                }
                className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px] bg-white/75 text-black border border-[#85b1de] p-1"
              />
            </div>

            <div className="canvas-control text-center relative min-h-[80px]">
              <input
                type="button"
                value="Default Values"
                onClick={onResetDefaults}
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
                onClick={onResetSquares}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px] px-[6px] py-[6px] font-bold rounded-[5px] cursor-pointer bg-white text-black border border-[#85b1de]"
                style={{
                  boxShadow:
                    "inset 2px 2px 4px rgb(50, 50, 90), inset -2px -2px 4px rgb(110, 140, 150)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasControls;
