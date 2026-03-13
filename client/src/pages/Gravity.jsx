import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  const handleResetDefaults = () => {
    setConfig(getDefaultGravityConfig());
  };

  const handleResetSquares = () => {
    resetSquares();
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section
        id="content"
        className="flex-1 flex flex-col items-center justify-center w-full"
      >
        <div id="gravity" className="relative w-full min-w-[320px] text-center">
          <h3>
            gravity
            <br />
            <small>a 2d n-body simulation</small>
          </h3>
          <div
            id="canvas-container"
            className="relative block max-w-[960px] w-full mx-auto"
          >
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
            <CanvasControls
              config={config}
              onConfigChange={setConfig}
              onResetSquares={handleResetSquares}
              onResetDefaults={handleResetDefaults}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gravity;
