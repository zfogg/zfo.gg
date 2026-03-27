import { useEffect } from "react";
import { useStressGraph } from "../hooks/useStressGraph";
import CanvasControls from "../components/CanvasControls";

const StressGraph = () => {
  const { glCanvasRef, overlayCanvasRef } = useStressGraph();

  useEffect(() => {
    document.title = "stressgraph - zfo.gg";
  }, []);

  return (
    <section id="content" className="flex-1 flex flex-col items-center justify-center w-full">
      <div id="stressgraph" className="relative w-full min-w-[320px] text-center">
        <h3 className="text-4xl">stressgraph</h3>
        <p className="text-base text-gray-500 mt-1">a voronoi stress simulation</p>

        <div
          id="canvas-container"
          className="relative block max-w-[960px] w-full mx-auto mt-4"
          style={{ aspectRatio: "1 / 1" }}
        >
          {/* WebGL canvas: bottom layer, receives pointer events */}
          <canvas
            ref={glCanvasRef}
            className="absolute inset-0 block w-full h-full cursor-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Overlay canvas: top layer, no pointer events */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 block w-full h-full pointer-events-none"
            aria-hidden="true"
          />

          <CanvasControls>
            <div className="canvas-control text-center">
              <p className="text-sm">Left click: fracture</p>
            </div>
            <div className="canvas-control text-center">
              <p className="text-sm">Right hold: gravity well</p>
            </div>
            <div className="canvas-control text-center">
              <p className="text-sm">Space: randomize hues</p>
            </div>
          </CanvasControls>
        </div>
      </div>
    </section>
  );
};

export default StressGraph;
