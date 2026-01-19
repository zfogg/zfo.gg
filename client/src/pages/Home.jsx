import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThingCard from '../components/ThingCard';

const Home = () => {
  // Update page title
  useEffect(() => {
    document.title = 'zfo.gg - Zachary\'s personal website';
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section id="content" className="flex-1 flex justify-center items-center w-full text-center px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h3 className="text-4xl">I make things, like</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <ThingCard href="https://ascii-chat.com" external>
              ascii-chat
            </ThingCard>

            <ThingCard href="/thing/gravity">
              gravity
            </ThingCard>

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
