import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, ChevronRight, ChevronDown } from "lucide-react";

export default function AdminTopbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const breadcrumbs = location.pathname
    .split("/")
    .filter(Boolean)
    .map((part, i, arr) => {
      const linkTo = "/" + arr.slice(0, i + 1).join("/");
      const name = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      return { name, linkTo };
    });

  return (
    <header className="bg-card border-b border-rule px-5 md:px-10 h-16 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl hover:bg-paper text-ink transition"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] truncate min-w-0">
          <Link to="/admin" className="text-[color:var(--muted)] hover:text-ink transition">Admin</Link>
          {breadcrumbs.slice(1).map(({ name, linkTo }, idx, arr) => {
            const isLast = idx === arr.length - 1;
            return (
              <span key={linkTo} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3.5 h-3.5 text-[color:var(--muted)] shrink-0" />
                <Link
                  to={linkTo}
                  className={`truncate transition ${isLast ? "text-ink font-medium" : "text-[color:var(--muted)] hover:text-ink"}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {name}
                </Link>
              </span>
            );
          })}
        </nav>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-paper transition"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
        >
          <div className="w-9 h-9 rounded-full bg-ink text-paper flex items-center justify-center font-medium text-[13px] uppercase">
            {user?.name ? user.name.charAt(0) : "A"}
          </div>
          <span className="hidden md:block text-ink font-medium text-[13px]">{user?.name || "Admin"}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[color:var(--muted)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-card border border-rule p-1 z-50">
            <Link
              to="/admin/profile"
              className="block px-3 py-2 text-[13px] text-ink rounded-lg hover:bg-paper transition"
              onClick={() => setDropdownOpen(false)}
            >
              Profile
            </Link>
            <button
              onClick={() => { logout(); setDropdownOpen(false); }}
              className="w-full text-left px-3 py-2 text-[13px] text-ink rounded-lg hover:bg-paper transition"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
