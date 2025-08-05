import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminTopbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate breadcrumb links for admin area
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);
    return paths.map((part, i) => {
      const linkTo = "/" + paths.slice(0, i + 1).join("/");
      const name = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      return { name, linkTo };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
<header className="bg-white shadow px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
  {/* Sidebar toggle for mobile */}
  <button
    onClick={onToggleSidebar}
    className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-label="Toggle sidebar"
  >
    <svg
      className="w-6 h-6 text-gray-700"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  </button>
  
  {/* Breadcrumbs */}
  <nav
    aria-label="Breadcrumb"
    className="flex items-center gap-1 text-gray-600 text-sm md:text-base truncate min-w-0"
    style={{maxWidth: "70%"}}
  >
    <Link to="/admin" className="hover:text-blue-600 font-semibold">
      Admin
    </Link>
    {breadcrumbs.map(({ name, linkTo }, idx) => (
      <span key={linkTo} className="flex items-center">
        <svg
          className="w-4 h-4 mx-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <Link
          to={linkTo}
          className={`hover:text-blue-600 ${idx === breadcrumbs.length - 1 ? "font-bold text-gray-900" : ""}`}
          aria-current={idx === breadcrumbs.length - 1 ? "page" : undefined}
        >
          {name}
        </Link>
      </span>
    ))}
  </nav>

  {/* User info dropdown */}
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setDropdownOpen(!dropdownOpen)}
      className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
      aria-haspopup="true"
      aria-expanded={dropdownOpen}
    >
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase select-none">
        {user?.name ? user.name.charAt(0) : "A"}
      </div>
      <span className="hidden md:block text-gray-700 font-semibold">{user?.name || "Admin"}</span>
      <svg
        className={`w-4 h-4 text-gray-700 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    {/* (dropdown as before) */}
    {dropdownOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 ring-1 ring-black ring-opacity-5 z-50">
        <Link
          to="/admin/profile"
          className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
          onClick={() => setDropdownOpen(false)}
        >
          Profile
        </Link>
        <button
          onClick={() => {
            logout();
            setDropdownOpen(false);
          }}
          className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    )}
  </div>
</header>

  );
}
