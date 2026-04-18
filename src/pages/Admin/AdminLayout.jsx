import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import AdminTopbar from "../../components/AdminTopbar";
import API from "../../services/api";

const NAV = [
  {
    label: "Dashboard", to: "/admin",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>,
  },
  {
    label: "Pending Approval", to: "/admin/pending-approvals", badgeKey: "pendingApprovals",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>,
  },
  {
    label: "Owner Verification", to: "/admin/OwnerVerification", badgeKey: "ownersPendingKYC",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
  {
    label: "All Properties", to: "/admin/all-properties",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  },
  {
    label: "Users", to: "/admin/users",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-3-3.87" /><path d="M7 21v-2a4 4 0 0 1 3-3.87" /><circle cx="12" cy="7" r="4" /></svg>,
  },
  {
    label: "Analytics", to: "/admin/analytics",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/admin/dashboard-stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBadges(res.data || {}))
      .catch(() => {});
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className="w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white flex flex-col shadow-xl flex-shrink-0">
        <div className="px-6 py-8 flex items-center gap-2 border-b border-blue-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="font-extrabold text-xl tracking-wide select-none">
            Room4Rent <span className="text-yellow-300">Admin</span>
          </span>
        </div>

        <nav className="flex flex-col flex-grow mt-6">
          {NAV.map(({ label, to, icon, badgeKey }) => {
            const count = badgeKey ? (badges[badgeKey] || 0) : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-r-full mx-3 my-1 transition-colors ${
                    isActive
                      ? "bg-yellow-400 text-blue-900 shadow-lg"
                      : "text-yellow-200 hover:bg-blue-700 hover:text-white"
                  }`
                }
              >
                <span className="flex-shrink-0">{icon}</span>
                <span className="flex-1">{label}</span>
                {count > 0 && (
                  <span className="bg-yellow-400 text-blue-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-blue-700 px-6 py-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 rounded-full px-4 py-2 font-semibold text-white shadow-lg transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
