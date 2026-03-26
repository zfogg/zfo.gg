import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useGridZips, getDefaultGridZipsConfig } from "../hooks/useGridZips";

const NotFound = () => {
  const { canvasRef } = useGridZips(getDefaultGridZipsConfig());

  // Update page title
  useEffect(() => {
    document.title = "404 - zfo.gg";
  }, []);

  return (
    <div className="relative flex-1 w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        id="canvas"
        className="fixed inset-0 w-screen h-screen cursor-crosshair"
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute inset-0 flex flex-col pointer-events-none">
        <section id="content" className="flex-1 flex justify-center items-center w-full px-4">
          <div className="max-w-4xl mx-auto text-center pointer-events-auto">
            <h2>404 :/</h2>
            <h3>
              Are you lost?
              <br />
              You should <Link to="/">head back</Link> to safety.
            </h3>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotFound;
