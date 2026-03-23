import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useColorAnimation } from "../hooks/useColorAnimation";
import CanvasControls from "../components/CanvasControls";

const Colorshifter = () => {
  const { bgColor, fgColor, isActive } = useColorAnimation();

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
            <p>Move your mouse to change colors</p>
          </div>

          <div className="canvas-control text-center">
            <p>Colors wander and drift smoothly</p>
          </div>

          <div className="canvas-control text-center">
            <p>Animation starts on first movement</p>
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
