import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  // Update page title
  useEffect(() => {
    document.title = '404 - zfo.gg';
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center w-full px-4">
        <h1 className="text-8xl md:text-9xl font-light mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl font-light mb-8">Page not found</h2>
        <Link
          to="/"
          className="text-xl hover:underline border-2 border-current px-6 py-3 hover:bg-current hover:text-white transition-all"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
