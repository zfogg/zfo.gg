import { useEffect, useState, ReactElement, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useGridZips, getDefaultGridZipsConfig } from "../hooks/useGridZips";
import CanvasControls from "../components/CanvasControls";

interface GridZipsConfig {
  speed: number;
  frequency: number;
  trailLength: number;
  trailDecay: number;
  mouseZipRate: number;
}

const GridZips = (): ReactElement => {
  const [config, setConfig] = useState<GridZipsConfig>(getDefaultGridZipsConfig());
  const { canvasRef } = useGridZips(config);

  useEffect(() => {
    document.title = "GridZips - zfo.gg";
  }, []);

  const handleChange = (key: keyof GridZipsConfig, value: string): void => {
    setConfig((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section id="content" className="flex-1 flex flex-col items-center justify-center w-full">
        <div
          id="gridzips"
          className="relative w-full min-w-[320px] text-center flex-1 flex flex-col"
        >
          <h3>
            gridzips
            <br />
            <small>an animated grid of electric arcs</small>
          </h3>
          <div id="canvas-container" className="relative block w-full mx-auto flex-1">
            <canvas
              ref={canvasRef}
              id="canvas"
              className="block w-full h-full cursor-crosshair"
              onContextMenu={(e) => e.preventDefault()}
            />
            <CanvasControls>
              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Zip Speed</p>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={config.speed}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange("speed", e.target.value)
                  }
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Zip Frequency</p>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={config.frequency}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange("frequency", e.target.value)
                  }
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>

              <div className="canvas-control text-center relative min-h-[80px]">
                <p className="mb-2">Trail Length</p>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={config.trailLength}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleChange("trailLength", e.target.value)
                  }
                  className="w-[130px] absolute bottom-0 left-1/2 -translate-x-1/2 mb-[29px]"
                />
              </div>
            </CanvasControls>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GridZips;
