import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const accountRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const displayName =
    user?.name || user?.username || user?.displayName ||
    (user?.email ? user.email.split("@")[0] : "Account");

  const avatarUrl = user?.avatar || user?.photoURL || user?.profilePic || user?.image || "";

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target))
        setAccountDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setAccountDropdown(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (mobileMenu) setMobileMenu(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (mobileMenu) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev || ""; };
    }
  }, [mobileMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/properties?search=${encodeURIComponent(q)}` : `/properties`);
    setMobileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setAccountDropdown(false);
    setMobileMenu(false);
    navigate("/login");
  };

  const navItems = [
    { to: "/", label: "Homes", match: (p) => p === "/" },
    { to: "/properties", label: "Properties", match: (p) => p.startsWith("/properties") },
    { to: "/#how-it-works", label: "How it works", match: () => false, hash: true },
    { to: "/postProperty", label: "For owners", match: (p) => p.startsWith("/postProperty") || p.startsWith("/my-properties") },
  ];

  const PillNav = ({ onClick }) => (
    <nav className="hidden md:flex items-center gap-1 text-[14px] p-1 rounded-full bg-card border border-rule">
      {navItems.map((it) => {
        const active = it.match(location.pathname);
        return (
          <Link
            key={it.label}
            to={it.to}
            onClick={onClick}
            className={`px-4 py-2 rounded-full transition ${
              active
                ? "bg-ink text-paper"
                : "text-ink/75 hover:text-ink"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );

  const MobileNavLinks = ({ onClick }) => (
    <>
      {navItems.map((it) => (
        <Link
          key={it.label}
          to={it.to}
          onClick={onClick}
          className="px-3 py-2 rounded-xl text-sm font-medium text-ink/80 hover:bg-paper hover:text-ink transition"
        >
          {it.label}
        </Link>
      ))}
      {user && (
        <Link
          to="/wishlist"
          onClick={onClick}
          className="px-3 py-2 rounded-xl text-sm font-medium text-ink/80 hover:bg-paper hover:text-ink transition"
        >
          Saved
        </Link>
      )}
    </>
  );

  const UserMenu = () => (
    <div className="relative" ref={accountRef}>
      <button
        type="button"
        aria-label="Account menu"
        className="flex items-center rounded-full transition hover:ring-2 hover:ring-rule"
        onClick={() => setAccountDropdown((s) => !s)}
      >
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4B896&color=1F2420`}
          alt="Profile"
          className="h-9 w-9 rounded-full object-cover border border-rule"
        />
      </button>

      {accountDropdown && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-rule bg-card shadow-card-hover z-[70] overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-paper">
            <img
              src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4B896&color=1F2420`}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="h-px bg-rule" />
          <nav className="py-1">
            {[
              { to: "/profile", label: "Profile" },
              { to: "/wishlist", label: "Saved" },
              { to: "/my-bookings", label: "My Bookings" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setAccountDropdown(false)}
                className="block px-4 py-2.5 text-sm text-ink/80 hover:bg-paper hover:text-ink transition"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="h-px bg-rule" />
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav className="sticky top-0 w-full z-50 bg-paper/85 backdrop-blur-md border-b border-rule">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4 px-6 py-3.5">
          <Link to="/" className="shrink-0 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center text-paper font-display text-lg leading-none">R</span>
            <span className="font-semibold text-ink text-[17px] leading-none">Rentora</span>
          </Link>

          <PillNav />

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to="/postProperty"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition"
                >
                  List a home
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="text-[14px] text-ink/80 hover:text-ink transition px-2">
                  Sign in
                </Link>
                <Link
                  to="/postProperty"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition"
                >
                  List a home
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label="Open menu"
            className="md:hidden ml-auto p-2 rounded-xl text-ink hover:bg-ink/5"
            onClick={() => setMobileMenu(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      <MobileDrawer
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        user={user}
        displayName={displayName}
        avatarUrl={avatarUrl}
        handleSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleLogout={handleLogout}
        NavLinks={MobileNavLinks}
      />
    </>
  );
}

function MobileDrawer({ open, onClose, user, displayName, avatarUrl, handleSearch, searchQuery, setSearchQuery, handleLogout, NavLinks }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-72 max-w-full h-full bg-paper shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-rule">
          <Link to="/" onClick={onClose} className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-bold font-display text-sm">R</span>
            <span className="font-display font-semibold text-ink text-lg">Rentora</span>
          </Link>
          <button onClick={onClose} className="p-2 rounded-xl text-ink hover:bg-ink/5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <form onSubmit={(e) => { handleSearch(e); onClose(); }} className="flex items-center gap-2 bg-white border border-rule rounded-full px-3 py-2">
            <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="search"
              placeholder="City, locality…"
              className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="flex flex-col gap-1">
            <NavLinks onClick={onClose} />
          </nav>

          {user && (
            <div className="rounded-2xl border border-rule bg-white p-3">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=D4B896&color=1F2420`}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{displayName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: "/profile", label: "Profile" },
                  { to: "/wishlist", label: "Saved" },
                  { to: "/my-bookings", label: "Bookings" },
                  { to: "/postProperty", label: "List Property" },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="px-3 py-2 rounded-xl bg-paper text-ink text-sm text-center font-medium hover:bg-rule transition"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <button onClick={() => { handleLogout(); onClose(); }} className="mt-3 w-full px-3 py-2 rounded-xl text-sm text-red-600 bg-red-50 hover:bg-red-100 transition">
                Sign out
              </button>
            </div>
          )}

          {!user && (
            <Link to="/login" onClick={onClose} className="btn-accent w-full text-center">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
