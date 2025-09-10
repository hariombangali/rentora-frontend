import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Navbar() {
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation(); // 👈 current route check
  const { user, logout } = useAuth();

  const isHome = location.pathname === "/"; // ✅ Home page check

  // ✅ Scroll detection only if on Home page
  useEffect(() => {
    if (!isHome) return; // skip if not home

    const handleScroll = () => {
      const heroHeight = 400;
      if (window.scrollY >= heroHeight) {
        setShowSticky(true);
      } else {
        setShowSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // ✅ Outside click for account dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    navigate("/properties?" + params.toString());
  };

  const handleLogout = () => {
    logout();
    setAccountDropdown(false);
    navigate("/login");
  };

  const NavLinks = ({ linkClass = "" }) => (
    <>
      <Link to="/" className={linkClass}>Home</Link>
      <Link to="/properties" className={linkClass}>Properties</Link>
      <Link to="/about" className={linkClass}>About</Link>
      {user && <Link to="/wishlist" className={linkClass}>Wishlist</Link>}
    </>
  );

  // ✅ If NOT home → always show sticky navbar
  if (!isHome) {
    return (
      <nav className="sticky top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo size={44} variant="full" />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 justify-center mx-4">
            <div className="flex items-center border border-blue-200 rounded-full px-3 py-1.5 w-full max-w-lg">
              <input
                type="search"
                placeholder="Search by city or project"
                className="flex-1 bg-transparent outline-none text-sm text-blue-900 px-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full">🔍</button>
            </div>
          </form>

          {/* Links + Auth */}
          <div className="hidden md:flex gap-6 items-center font-semibold text-blue-900">
            <NavLinks />
            {user ? (
              <>
                <Link to="/postProperty" className="bg-blue-600 text-white px-4 py-1.5 rounded-full">Post Property</Link>
                <button onClick={handleLogout} className="hover:text-yellow-500">Logout</button>
              </>
            ) : (
              <Link to="/login" className="hover:text-yellow-500">Login</Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // ✅ If Home → transparent + sticky logic
  return (
    <>
      {/* Transparent Navbar */}
      {!showSticky && (
        <nav className="absolute top-0 left-0 w-full z-40 bg-transparent text-white transition">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
              <Link to="/" className="flex items-center">
            <Logo size={44} variant="full" />
          </Link>
            <div className="hidden md:flex gap-6 font-semibold">
              <NavLinks linkClass="hover:text-yellow-400" />
            </div>
            <div className="hidden md:flex gap-2 items-center">
              {user ? (
                <>
                  <Link to="/postProperty" className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full">Post Property</Link>
                  <button onClick={handleLogout} className="hover:text-yellow-400">Logout</button>
                </>
              ) : (
                <Link to="/login" className="hover:text-yellow-400">Login</Link>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Sticky Navbar */}
      {showSticky && (
        <nav className="sticky top-0 w-full bg-white shadow-md z-50 transition">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
                <Link to="/" className="flex items-center">
            <Logo size={44} variant="full" />
          </Link>
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 justify-center mx-4">
              <div className="flex items-center border border-blue-200 rounded-full px-3 py-1.5 w-full max-w-lg">
                <input
                  type="search"
                  placeholder="Search by city or project"
                  className="flex-1 bg-transparent outline-none text-sm text-blue-900 px-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full">🔍</button>
              </div>
            </form>
            <div className="hidden md:flex gap-6 items-center font-semibold text-blue-900">
              <NavLinks />
              {user ? (
                <>
                  <Link to="/postProperty" className="bg-blue-600 text-white px-4 py-1.5 rounded-full">Post Property</Link>
                  <button onClick={handleLogout} className="hover:text-yellow-500">Logout</button>
                </>
              ) : (
                <Link to="/login" className="hover:text-yellow-500">Login</Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
