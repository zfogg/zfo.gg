import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Gravity = () => {
  // Update page title
  useEffect(() => {
    document.title = 'Gravity - zfo.gg';
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section id="content" className="flex-1 flex flex-col items-center justify-center w-full">
        <div id="gravity" className="relative w-full min-w-[320px] text-center">
          <h3>
            gravity
            <br />
            <small>a 2d n-body simulation</small>
          </h3>
          <div id="canvas-container" className="relative block max-w-[960px] w-full mx-auto">
            <canvas
              id="canvas"
              width="800"
              height="800"
              className="block mx-auto cursor-none"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gravity;
