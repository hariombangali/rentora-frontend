import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flatType, setFlatType] = useState("");
  const [budget, setBudget] = useState("");
  const accountRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close dropdown if outside click
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
    if (flatType) params.append("type", flatType);
    if (budget) params.append("budget", budget);
    navigate("/properties?" + params.toString());
  };

  const handleLogout = () => {
    logout();
    setAccountDropdown(false);
    navigate("/login");
  };

  // Search and filter options
  const flatOptions = [
    { label: "Type", value: "" },
    { label: "1BHK", value: "1BHK" },
    { label: "2BHK", value: "2BHK" },
    { label: "3BHK", value: "3BHK" },
    { label: "PG", value: "PG" },
  ];
  const budgetOptions = [
    { label: "Budget", value: "" },
    { label: "Up to ₹5,000", value: "5000" },
    { label: "Up to ₹10,000", value: "10000" },
    { label: "Up to ₹15,000", value: "15000" },
    { label: "Up to ₹20,000", value: "20000" },
    { label: "Above ₹20,000", value: "20001" }
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 md:px-6 py-2">
        {/* Branding Left */}
        <Link
          to="/"
          className="flex items-center gap-2 text-blue-900 font-extrabold text-xl tracking-wider whitespace-nowrap"
        >
          <svg
            className="w-7 h-7 text-yellow-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 10h4l3-3-3-3-4 4zM13 5v14M13 19h4l3-3-3-3h-4z" />
          </svg>
          <span className="leading-none">Room
            <span className="text-yellow-400">4Rent</span>
          </span>
          {/* <span className="text-xs font-bold text-purple-500 tracking-wide ml-1 pt-1">Indore</span> */}
        </Link>

        {/* Search bar - smaller and centered */}
        <form
          onSubmit={handleSearch}
          className="flex-1 justify-center flex"
          style={{ minWidth: 0 }}
        >
          <div className="flex items-center gap-2 bg-blue-20 border border-blue-50 rounded-full shadow px-3 py-2 mx-2 w-full max-w-lg">
            <input
              type="search"
              placeholder="Search by city or project"
              className="flex-1 min-w-0 text-base bg-transparent outline-none px-2 text-blue-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: "15px" }}
            />
            {/* <select
              value={flatType}
              onChange={(e) => setFlatType(e.target.value)}
              className="text-gray-700 px-2 py-1 rounded focus:outline-none bg-white shadow-sm border"
            >
              {flatOptions.map(opt =>
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </select>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="text-gray-700 px-2 py-1 rounded focus:outline-none bg-white shadow-sm border"
            >
              {budgetOptions.map(opt =>
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </select> */}
            <button
              type="submit"
              aria-label="Search"
              className="bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold px-4 py-1.5 rounded-full ml-1 transition shadow flex items-center"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Search
            </button>
          </div>
        </form>

        {/* Buttons and account - right aligned */}
        <div className="flex items-center gap-2 min-w-[170px] ml-2 justify-end">
          {user ? (
            <>
              <Link
                to="/postProperty"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full px-4 py-1.5 transition"
              >
                Post Property
              </Link>
              {user.role === "owner" && (
                <Link
                  to="/my-properties"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-full px-4 py-1.5 transition"
                >
                  My Properties
                </Link>
              )}
                            <div className="relative" ref={accountRef}>
                <button
                  onClick={() => setAccountDropdown((v) => !v)}
                  aria-haspopup="true"
                  aria-expanded={accountDropdown}
                  aria-controls="account-menu"
                  className="flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full text-blue-900 shadow-sm font-semibold transition"
                >
                  <div className="h-7 w-7 rounded-full bg-yellow-400 font-extrabold flex items-center justify-center text-blue-900 uppercase">
                    {user.name ? user.name[0] : "U"}
                  </div>
                  <span className="hidden md:inline font-semibold">{user.name || "User"}</span>
                  <svg
                    className={`w-4 h-4 ml-1 transition-transform ${accountDropdown ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {accountDropdown && (
                  <div
                    id="account-menu"
                    role="menu"
                    aria-label="User account menu"
                    className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 animate-fade-in"
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-blue-50 font-semibold"
                      role="menuitem"
                      onClick={() => setAccountDropdown(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-50 font-semibold"
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 font-semibold whitespace-nowrap">
              <Link
                to="/login"
                className="text-blue-900 hover:text-yellow-500 px-3 py-1.5 rounded transition"
              >
                Login
              </Link>
    
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
