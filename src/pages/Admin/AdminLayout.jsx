import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import AdminTopbar from "../../components/AdminTopbar";
import API from "../../services/api";
import {
  LayoutGrid,
  Clock,
  ShieldCheck,
  Building2,
  Users as UsersIcon,
  BarChart3,
  LogOut,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", to: "/admin", icon: LayoutGrid },
  { label: "Pending Approval", to: "/admin/pending-approvals", icon: Clock, badgeKey: "pendingApprovals" },
  { label: "Owner Verification", to: "/admin/OwnerVerification", icon: ShieldCheck, badgeKey: "ownersPendingKYC" },
  { label: "All Properties", to: "/admin/all-properties", icon: Building2 },
  { label: "Users", to: "/admin/users", icon: UsersIcon },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
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
    <div className="flex min-h-screen bg-paper">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-ink/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-rule flex flex-col flex-shrink-0 transform transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Brand */}
        <div className="px-6 py-7 flex items-center gap-2.5 border-b border-rule">
          <span className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center text-paper font-display text-[18px] leading-none">R</span>
          <div>
            <div className="font-semibold text-ink text-[15px] leading-none">Rentora</div>
            <div className="font-eyebrow text-[10px] text-[color:var(--muted)] mt-1">Admin console</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-grow p-3 gap-0.5">
          {NAV.map(({ label, to, icon: Icon, badgeKey }) => {
            const count = badgeKey ? (badges[badgeKey] || 0) : 0;
            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium rounded-xl transition ${
                    isActive
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-paper"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className="flex-1 truncate">{label}</span>
                {count > 0 && (
                  <span className="bg-accent text-paper text-[10px] font-semibold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-rule p-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium text-ink hover:bg-paper transition"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
        <main className="flex-1 px-5 py-8 md:px-10 md:py-10 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
