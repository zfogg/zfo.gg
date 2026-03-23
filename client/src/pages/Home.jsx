import { useEffect } from "react";
import { Link } from "react-router-dom";
import ThingCard from "../components/ThingCard";
import { useGridZips, getDefaultGridZipsConfig } from "../hooks/useGridZips";

const Home = () => {
  const { canvasRef } = useGridZips(getDefaultGridZipsConfig());

  useEffect(() => {
    document.title = "zfo.gg - Zachary Fogg's personal website";
  }, []);

  return (
    <div className="relative flex-1 w-full flex flex-col overflow-hidden">
      {/* Canvas background - fills entire Home section */}
      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col flex-1">
        <header id="header" className="text-center pt-8">
          <Link to="/">
            <h1>zfogg</h1>
          </Link>
        </header>

        <section
          id="content"
          className="flex-1 flex justify-center items-center w-full text-center px-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h3 className="text-4xl">I make things, like</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <ThingCard href="/thing/colorshifter">colorshifter</ThingCard>

              <ThingCard href="/thing/gravity">gravity</ThingCard>

              <ThingCard href="/thing/gridzips">gridzips</ThingCard>

              <ThingCard href="https://bit.camp/" external>
                bitcamp
              </ThingCard>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
