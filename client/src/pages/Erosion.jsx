import { useEffect, useState } from "react";
import { useErosion } from "../hooks/useErosion";
import { getDefaultErosionConfig } from "../erosion/config";
import CanvasControls from "../components/CanvasControls";

const Erosion = () => {
  const [config, setConfig] = useState(getDefaultErosionConfig());
  const { canvasRef, resetTerrain } = useErosion(config);

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleResetConfig = () => {
    setConfig(getDefaultErosionConfig());
  };

  // Update page title
  useEffect(() => {
    document.title = "erosion - zfo.gg";
  }, []);

  return (
    <section
      id="content"
      className="flex-1 flex justify-center items-center w-full text-center px-4 pt-8 relative"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-none"
        onContextMenu={(e) => e.preventDefault()}
      />

      <CanvasControls>
        <div className="canvas-control text-center">
          <p className="text-sm mb-1">Erosion Rate</p>
          <input
            type="range"
            min="0.0001"
            max="0.01"
            step="0.0001"
            value={config.erosionRate}
            onChange={(e) => handleChange("erosionRate", e.target.value)}
            className="w-[100px]"
          />
        </div>

        <div className="canvas-control text-center">
          <p className="text-sm mb-1">Rain Intensity</p>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={config.rainRate}
            onChange={(e) => handleChange("rainRate", e.target.value)}
            className="w-[100px]"
          />
        </div>

        <div className="canvas-control text-center">
          <p className="text-sm mb-1">Water Damping</p>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.1"
            value={config.damping}
            onChange={(e) => handleChange("damping", e.target.value)}
            className="w-[100px]"
          />
        </div>

        <div className="canvas-control text-center">
          <p className="text-sm mb-1">Deposition Rate</p>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={config.depositionRate}
            onChange={(e) => handleChange("depositionRate", e.target.value)}
            className="w-[100px]"
          />
        </div>

        <button
          onClick={handleResetConfig}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
        >
          Default Values
        </button>

        <button
          onClick={resetTerrain}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm transition-colors"
        >
          New Terrain
        </button>
      </CanvasControls>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h3 className="text-4xl">erosion</h3>
          <p className="sm:text-2xl font-sans tracking-wide relative z-10 mt-4">
            Hydraulic erosion simulation with water particles
          </p>
        </div>
      </div>
    </section>
  );
};

export default Erosion;
