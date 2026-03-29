import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="brand">
        <span className="brand__mark">SS</span>
        <div>
          <Link className="brand__name" to="/">
            SeatSync
          </Link>
          <p className="brand__tagline">Verified digital seat swaps for shared journeys.</p>
        </div>
      </div>

      <nav className="navbar__links">
        <a href="#how-it-works">How it works</a>
        <a href="#features">Why SeatSync</a>
        <NavLink to="/login">Login</NavLink>
        <Link className="button button--brand" to="/register">
          Get Started
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;
