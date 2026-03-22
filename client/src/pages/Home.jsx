import { useEffect } from "react";
import { Link } from "react-router-dom";
import ThingCard from "../components/ThingCard";
import { useColorAnimation } from "../hooks/useColorAnimation";

const Home = () => {
  const { bgColor, fgColor, isActive } = useColorAnimation();

  // Update page title
  useEffect(() => {
    document.title = "zfo.gg - Zachary Fogg's personal website";
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

      <p className="sm:text-2xl font-sans tracking-wide relative z-10 mt-8 mb-0">
        Zachary Fogg's personal website
      </p>

      <section
        id="content"
        className="flex-1 flex justify-center items-center w-full text-center px-4 pt-8"
      >
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h3 className="text-4xl">I make things, like</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <ThingCard href="https://ascii-chat.com" external>
              ascii-chat
            </ThingCard>

            <ThingCard href="/thing/gravity">gravity</ThingCard>

            <ThingCard href="https://bit.camp/" external>
              bitcamp
            </ThingCard>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
