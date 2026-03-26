import { useEffect } from "react";
import Header from "../components/Header";
import ThingCard from "../components/ThingCard";
import { useGridZips, getDefaultGridZipsConfig } from "../hooks/useGridZips";

const Home = () => {
  const { canvasRef } = useGridZips(getDefaultGridZipsConfig());

  useEffect(() => {
    document.title = "zfo.gg - Zachary Fogg's personal website";
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
        <Header subtitle="Zachary Fogg's personal website" />

        <section
          id="content"
          className="flex-1 flex justify-center items-center w-full text-center px-4"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="mb-8">
              <h3 className="text-4xl">I make things, like</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <ThingCard href="https://ascii-chat.com" external>
                ascii-chat
              </ThingCard>

              <ThingCard href="https://bit.camp/" external>
                bitcamp
              </ThingCard>

              <ThingCard href="/thing/gravity">gravity</ThingCard>

              <ThingCard href="/thing/colorshifter">colorshifter</ThingCard>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
