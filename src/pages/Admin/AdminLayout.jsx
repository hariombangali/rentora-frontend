import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import AdminTopbar from "../../components/AdminTopbar";

const sidebarItems = [
  { label: "Dashboard", to: "/admin", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 12l2-2 4 4 8-8 3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ) },
  { label: "Pending Approval", to: "/admin/pending-approvals", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ) },
  { label: "OwnerVerification", to: "/admin/OwnerVerification", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ) },
  { label: "All Properties", to: "/admin/all-properties", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ) },
  { label: "Users", to: "/admin/users", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ) },
  { label: "Analytics", to: "/admin/analytics", icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M12 4v16" />
      <path d="M4 12h8" />
    </svg>
  ) },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };


    const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
  return (
    <div className="flex min-h-screen bg-gray-100">
  
       {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
  
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col shadow-xl">
        <div className="px-6 py-8 flex items-center gap-2 border-b border-blue-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h4l3-3-3-3-4 4zM13 5v14m0 0h4l3-3-3-3h-4z" />
          </svg>
          <span className="font-extrabold text-xl tracking-wide select-none">
            Room4Rent <span className="text-yellow-300">Admin</span>
          </span>
        </div>
        {/* Menu Items */}
        <nav className="flex flex-col flex-grow mt-6">
          {sidebarItems.map(({ label, to, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin"} 
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-r-full mx-3 my-1 transition-colors
                 ${
                   isActive
                     ? "bg-yellow-400 text-blue-900 shadow-lg"
                     : "text-yellow-200 hover:bg-blue-700 hover:text-white"
                 }`
              }
            >
              <span className="flex-shrink-0">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        {/* Logout Button */}
        <div className="border-t border-blue-700 px-6 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-full px-4 py-2 font-semibold text-white shadow-lg transition"
            aria-label="Logout"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16v-1a4 4 0 014-4h10" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1">
        <AdminTopbar onToggleSidebar={toggleSidebar} />
      {/* Main content */}
      <main className="flex-1 p-10 overflow-auto">
        <Outlet />
      </main>
    </div>
     </div>
  );
}
