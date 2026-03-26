import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  // Update page title
  useEffect(() => {
    document.title = "404 - zfo.gg";
  }, []);

  return (
    <section id="content" className="flex-1 flex justify-center items-center w-full px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2>404 :/</h2>
          <h3>
            Are you lost?
            <br />
            You should <Link to="/">head back</Link> to safety.
          </h3>
        </div>
      </section>
  );
};

export default NotFound;
