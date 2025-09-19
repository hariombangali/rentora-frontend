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

  // Derived user info with fallbacks
  const displayName =
    user?.name ||
    user?.username ||
    user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Account");

  const avatarUrl =
    user?.avatar || user?.photoURL || user?.profilePic || user?.image || "";

  // Scroll detection only on Home
  useEffect(() => {
    if (!isHome) return;
    const handleScroll = () => {
      const heroHeight = 400;
      setShowSticky(window.scrollY >= heroHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  // Outside click for account dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close account dropdown on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setAccountDropdown(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
  }, [deferredQuery, isHome]);

  // Live navigate ONLY on Properties page so results update as typing
  useEffect(() => {
    const q = deferredQuery.trim();
    if (!isSearchFocused || !isProperties) return;
    const target = q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`;
    const current = `${location.pathname}${location.search}`;
    if (current !== target) {
      navigate(target, { replace: true });
    }
  }, [deferredQuery, isSearchFocused, isProperties, location.pathname, location.search, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (isHome) {
      navigate(q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`);
      setShowSuggestions(false);
      setMobileMenu(false);
      return;
    }
    navigate(q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`);
    setShowSuggestions(false);
    setMobileMenu(false);
  };

  const handleSuggestionClick = (value) => {
    const v = (value || "").trim();
    navigate(v ? `/properties?search=${encodeURIComponent(v)}` : `/properties`);
    setSearchQuery(v);
    setShowSuggestions(false);
    setMobileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setAccountDropdown(false);
    setMobileMenu(false);
    navigate("/login");
  };

  // Close mobile menu when route changes
  useEffect(() => {
    if (mobileMenu) setMobileMenu(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenu) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
  }, [mobileMenu]);

  const NavLinks = ({ linkClass = "", onClick }) => (
    <>
      {/* <Link to="/" className={linkClass} onClick={onClick}>Home</Link> */}
      <Link to="/properties" className={linkClass} onClick={onClick}>Properties</Link>
      {/* <Link to="/about" className={linkClass} onClick={onClick}>About</Link> */}
      {user && <Link to="/wishlist" className={linkClass} onClick={onClick}>Saved</Link>}
    </>
  );

  const MobileToggle = ({ btnClass = "" }) => (
    <button
      type="button"
      aria-label="Open menu"
      className={`md:hidden inline-flex items-center justify-center rounded-md p-2 ${btnClass}`}
      onClick={() => setMobileMenu(true)}
    >
      ☰
    </button>
  );

  // User menu trigger (desktop)
  const UserMenu = ({ textColor = "text-blue-900" }) => (
    <div className="relative" ref={accountRef}>
      <button
        type="button"
        className={`flex items-center gap-2 rounded-full px-2 py-1 hover:bg-blue-50 ${textColor}`}
        aria-haspopup="menu"
        aria-expanded={accountDropdown ? "true" : "false"}
        onClick={() => setAccountDropdown((s) => !s)}
      >
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E5E7EB&color=1F2937`}
          alt="Profile"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="text-sm font-semibold truncate max-w-[120px]">{displayName}</span>
        <span aria-hidden="true">▾</span>
      </button>

      {accountDropdown && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg z-[70]"
        >
          <div className="flex items-center gap-3 p-3">
            <img
              src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E5E7EB&color=1F2937`}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="h-px bg-gray-200" />
          <ul className="py-1 text-sm text-blue-900">
            <li>
              <Link to="/profile" role="menuitem" className="block px-4 py-2 hover:bg-blue-50">
                Profile
              </Link>
            </li>
            <li>
              <Link to="/wishlist" role="menuitem" className="block px-4 py-2 hover:bg-blue-50">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/about" role="menuitem" className="block px-4 py-2 hover:bg-blue-50">
                About
              </Link>
            </li>
            <li>
              <Link to="/help" role="menuitem" className="block px-4 py-2 hover:bg-blue-50">
                Help Center
              </Link>
            </li>
          </ul>
          <div className="h-px bg-gray-200" />
          <div className="p-2">
            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If NOT home → sticky navbar
  if (!isHome) {
    return (
      <>
        <nav className="sticky top-0 w-full bg-white shadow-md z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
            <Link to="/" className="flex items-center">
              <Logo size={44} variant="full" />
            </Link>

            {/* Desktop search */}
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
            </form>

            {/* Desktop links + user menu */}
            <div className="hidden md:flex gap-6 items-center font-semibold text-blue-900">
              <NavLinks />
              {user ? (
                <>
                  <Link to="/postProperty" className="bg-blue-600 text-white px-4 py-1.5 rounded-full">
                    Post Property
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <Link to="/login" className="hover:text-yellow-500">Login</Link>
              )}
            </div>

            {/* Mobile toggle */}
            <MobileToggle btnClass="text-blue-900 hover:bg-blue-50" />
          </div>
        </nav>

        {/* Mobile overlay menu */}
        {mobileMenu && (
          <div className="fixed inset-0 z-[60] bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <Logo size={44} variant="full" />
              <button
                aria-label="Close menu"
                className="p-2 rounded-md text-blue-900 hover:bg-blue-50"
                onClick={() => setMobileMenu(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center border border-blue-200 rounded-full px-3 py-2 bg-white">
                  <input
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
              </form>

              {/* Mobile account section */}
              {user && (
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E5E7EB&color=1F2937`}
                      alt="Profile"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || "—"}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <Link to="/profile" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                      Profile
                    </Link>
                    <Link to="/wishlist" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                      Wishlist
                    </Link>
                    <Link to="/about" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                      About
                    </Link>
                    <Link to="/help" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                      Help
                    </Link>
                  </div>
                  <button onClick={handleLogout} className="mt-3 w-full px-3 py-2 rounded-md text-red-600 bg-red-50">
                    Logout
                  </button>
                </div>
              )}

              {/* Mobile nav links */}
              <div className="flex flex-col gap-4 font-semibold text-blue-900">
                <NavLinks linkClass="px-2 py-2 rounded hover:bg-blue-50" onClick={() => setMobileMenu(false)} />
                {user ? (
                  <Link
                    to="/postProperty"
                    className="text-center bg-blue-600 text-white px-4 py-2 rounded-full"
                    onClick={() => setMobileMenu(false)}
                  >
                    Post Property
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="text-center bg-yellow-400 text-blue-900 px-4 py-2 rounded-full"
                    onClick={() => setMobileMenu(false)}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Home → transparent + sticky logic
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
                  <Link to="/postProperty" className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full">
                    Post Property
                  </Link>
                  <UserMenu textColor="text-white" />
                </>
              ) : (
                <Link to="/login" className="hover:text-yellow-400">Login</Link>
              )}
            </div>

            {/* Mobile toggle (white for transparent header) */}
            <MobileToggle btnClass="text-white hover:bg-white/10" />
          </div>
        </nav>
      )}

      {showSticky && (
        <nav className="sticky top-0 w-full bg-white shadow-md z-50 transition">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
            <Link to="/" className="flex items-center">
              <Logo size={44} variant="full" />
            </Link>

            {/* Desktop search with suggestions (Home only) */}
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

            {/* Desktop links + user menu */}
            <div className="hidden md:flex gap-6 items-center font-semibold text-blue-900">
              <NavLinks />
              {user ? (
                <>
                  <Link to="/postProperty" className="bg-blue-600 text-white px-4 py-1.5 rounded-full">
                    Post Property
                  </Link>
                  <UserMenu />
                </>
              ) : (
                <Link to="/login" className="hover:text-yellow-500">Login</Link>
              )}
            </div>

            {/* Mobile toggle */}
            <MobileToggle btnClass="text-blue-900 hover:bg-blue-50" />
          </div>
        </nav>
      )}

      {/* Mobile overlay menu (Home) */}
      {mobileMenu && (
        <div className="fixed inset-0 z-[60] bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Logo size={44} variant="full" />
            <button
              aria-label="Close menu"
              className="p-2 rounded-md text-blue-900 hover:bg-blue-50"
              onClick={() => setMobileMenu(false)}
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Mobile search with suggestions on Home */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex items-center border border-blue-200 rounded-full px-3 py-2 bg-white">
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

              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-md z-50">
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

            {/* Mobile account section */}
            {user && (
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=E5E7EB&color=1F2937`}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || "—"}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Link to="/profile" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                    Profile
                  </Link>
                  <Link to="/wishlist" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                    Wishlist
                  </Link>
                  <Link to="/about" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                    About
                  </Link>
                  <Link to="/help" className="px-3 py-2 rounded-md bg-blue-50 text-blue-900 text-center" onClick={() => setMobileMenu(false)}>
                    Help
                  </Link>
                </div>
                <button onClick={handleLogout} className="mt-3 w-full px-3 py-2 rounded-md text-red-600 bg-red-50">
                  Logout
                </button>
              </div>
            )}

            {/* Mobile nav links */}
            <div className="flex flex-col gap-4 font-semibold text-blue-900">
              <NavLinks linkClass="px-2 py-2 rounded hover:bg-blue-50" onClick={() => setMobileMenu(false)} />
              {user ? (
                <Link
                  to="/postProperty"
                  className="text-center bg-blue-600 text-white px-4 py-2 rounded-full"
                  onClick={() => setMobileMenu(false)}
                >
                  Post Property
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-center bg-yellow-400 text-blue-900 px-4 py-2 rounded-full"
                  onClick={() => setMobileMenu(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
