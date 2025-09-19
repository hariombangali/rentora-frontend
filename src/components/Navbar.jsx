import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useDeferredValue } from "react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import API from "../services/api";

export default function Navbar() {
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const deferredQuery = useDeferredValue(searchQuery);
  const accountRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isHome = location.pathname === "/";
  const isProperties = location.pathname === "/properties";

  // Scroll detection only on Home
  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => {
      const heroHeight = 400;
      setShowSticky(window.scrollY >= heroHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]); // [15]

  // Outside click for account dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // [15]

  // Suggestions only when typing and query length > 1
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      const q = deferredQuery.trim();
      if (q.length > 1 && isHome) {
        try {
          const { data } = await API.get(
            `/home/search/suggest?q=${encodeURIComponent(q)}`,
            { signal: ctrl.signal }
          );
          setSuggestions(data || []);
          setShowSuggestions(true);
        } catch (err) {
          if (!(err && (err.name === "CanceledError" || err.name === "AbortError"))) {
            console.error("Error fetching suggestions:", err);
          }
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [deferredQuery, isHome]); // [1][13]

  // Live navigate ONLY on Properties page so results update as typing
  useEffect(() => {
    const q = deferredQuery.trim();
    if (!isSearchFocused || !isProperties) return;
    const target = q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`;
    const current = `${location.pathname}${location.search}`;
    if (current !== target) {
      navigate(target, { replace: true });
    }
  }, [deferredQuery, isSearchFocused, isProperties, location.pathname, location.search, navigate]); // [1][6]

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (isHome) {
      // On Home, go to Properties once (no live navigate here)
      navigate(q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`);
      setShowSuggestions(false);
      return;
    }
    // On Properties, form submit is redundant (live sync already), but keep it safe
    navigate(q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`);
    setShowSuggestions(false);
  }; // [6][17]

  const handleSuggestionClick = (value) => {
    const v = (value || "").trim();
    // From Home suggestions → go to Properties with the value
    navigate(v ? `/properties?search=${encodeURIComponent(v)}` : `/properties`);
    setSearchQuery(v);
    setShowSuggestions(false);
  }; // [6]

  const handleLogout = () => {
    logout();
    setAccountDropdown(false);
    navigate("/login");
  }; // [15]

  const NavLinks = ({ linkClass = "" }) => (
    <>
      <Link to="/" className={linkClass}>Home</Link>
      <Link to="/properties" className={linkClass}>Properties</Link>
      <Link to="/about" className={linkClass}>About</Link>
      {user && <Link to="/wishlist" className={linkClass}>Wishlist</Link>}
    </>
  );

  // If NOT home → sticky navbar (unchanged design)
  if (!isHome) {
    return (
      <nav className="sticky top-0 w-full bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <Link to="/" className="flex items-center">
            <Logo size={44} variant="full" />
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 justify-center mx-4 relative">
            <div className="flex items-center border border-blue-200 rounded-full px-3 py-1.5 w-full max-w-lg bg-white">
              <input
                ref={inputRef}
                type="search"
                placeholder="Search by city or project"
                className="flex-1 bg-transparent outline-none text-sm text-blue-900 px-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <button type="submit" className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full">🔍</button>
            </div>
            {/* Suggestions not shown on Properties page to keep UI clean */}
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
    );
  }

  // Home → transparent + sticky logic (design unchanged)
  return (
    <>
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

      {showSticky && (
        <nav className="sticky top-0 w-full bg-white shadow-md z-50 transition">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
            <Link to="/" className="flex items-center">
              <Logo size={44} variant="full" />
            </Link>
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 justify-center mx-4 relative">
              <div className="flex items-center border border-blue-200 rounded-full px-3 py-1.5 w-full max-w-lg bg-white">
                <input
                  type="search"
                  placeholder="Search by city or project"
                  className="flex-1 bg-transparent outline-none text-sm text-blue-900 px-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { setIsSearchFocused(true); if (searchQuery) setShowSuggestions(true); }}
                  onBlur={() => setIsSearchFocused(false)}
                />
                <button type="submit" className="bg-yellow-400 text-blue-900 px-3 py-1 rounded-full">🔍</button>
              </div>

              {/* Suggestions shown ONLY on Home */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-full mt-2 w-full max-w-lg bg-white border border-gray-200 rounded-lg shadow-md z-50">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      onClick={() => handleSuggestionClick(s.label)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-blue-900"
                    >
                      {s.label} <span className="text-gray-400 text-xs">({s.type})</span>
                    </li>
                  ))}
                </ul>
              )}
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
