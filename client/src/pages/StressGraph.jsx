import { useEffect, useState } from "react";
import { useStressGraph } from "../hooks/useStressGraph";
import CanvasControls from "../components/CanvasControls";

const StressGraph = () => {
  const { glCanvasRef, overlayCanvasRef, togglePause, reset } = useStressGraph();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    document.title = "stressgraph - zfo.gg";
  }, []);

  return (
    <section id="content" className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
      <div id="stressgraph" className="w-full text-center px-4 py-4 flex-shrink-0">
        <h3 className="text-4xl">stressgraph</h3>
        <p className="text-base text-gray-500 mt-1">a voronoi stress simulation</p>
      </div>

      <div className="flex-1 relative w-full min-h-0">
        <div id="canvas-container" className="relative w-full h-full">
          {/* WebGL canvas: bottom layer, receives pointer events */}
          <canvas
            ref={glCanvasRef}
            className="block w-full h-full cursor-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Overlay canvas: top layer, no pointer events */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 block w-full h-full pointer-events-none"
            aria-hidden="true"
          />

          <div className="absolute inset-0 pointer-events-none">
            <div className="pointer-events-auto">
              <CanvasControls>
                <button
                  onClick={() => {
                    const newPaused = togglePause();
                    setPaused(newPaused);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded text-sm transition-colors"
                >
                  {paused ? "Resume" : "Pause"}
                </button>
                <button
                  onClick={() => {
                    const event = new KeyboardEvent("keydown", { code: "Space" });
                    document.dispatchEvent(event);
                  }}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm transition-colors"
                >
                  Randomize Hues
                </button>
                <button
                  onClick={() => {
                    reset();
                  }}
                  className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-sm transition-colors"
                >
                  Reset
                </button>
              </CanvasControls>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StressGraph;
