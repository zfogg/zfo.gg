import { Link } from "react-router-dom";

const Header = ({ subtitle }) => {
  return (
    <header id="header" className="text-center pt-8 relative z-10 pointer-events-auto">
      <Link to="/">
        <h1>zfogg</h1>
      </Link>
      {subtitle && <p className="text-2xl">{subtitle}</p>}
    </header>
  );
};

export default Header;
