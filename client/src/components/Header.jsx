import { Link } from "react-router-dom";

const Header = ({ subtitle }) => {
  return (
    <header id="header" className="text-center pt-8">
      <Link to="/">
        <h1>zfogg</h1>
      </Link>
      {subtitle && <p className="text-2xl pointer-events-auto">{subtitle}</p>}
    </header>
  );
};

export default Header;
