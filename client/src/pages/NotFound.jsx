import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  // Update page title
  useEffect(() => {
    document.title = "404 - zfo.gg";
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full">
      <header id="header" className="text-center">
        <Link to="/">
          <h1>zfogg</h1>
        </Link>
      </header>

      <section
        id="content"
        className="flex-1 flex justify-center items-center w-full px-4"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2>404 :/</h2>
          <h3>
            Are you lost?
            <br />
            You should <Link to="/">head back</Link> to safety.
          </h3>
        </div>
      </section>
    </div>
  );
};

export default NotFound;
