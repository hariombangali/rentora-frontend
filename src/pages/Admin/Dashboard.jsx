import { useEffect, useState } from "react";
import API from "../../services/api";
import { Link } from "react-router-dom";
import {
  RefreshCw,
  Home as HomeIcon,
  Clock,
  Users,
  User,
  IndianRupee,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Search,
  ListChecks,
  BarChart3,
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    pendingApprovals: 0,
    owners: 0,
    users: 0,
    totalDeposit: 0,
    availableProperties: 0,
    ownersPendingKYC: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (err) {
      setError("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const fmtNumber = (n) => (n ?? 0).toLocaleString("en-IN");

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
        <div>
          <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Overview</p>
          <h1 className="font-display text-[36px] md:text-[44px] leading-tight mt-1 text-ink">Admin Dashboard</h1>
          <p className="mt-2 text-[14px] text-[color:var(--muted)]">A bird&rsquo;s-eye view of the marketplace.</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-card border border-rule px-5 py-2.5 text-[13px] font-medium text-ink hover:border-ink transition disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Stats grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {loading ? (
          [...Array(7)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-rule bg-card p-6 animate-pulse space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#e8e2d3]" />
              <div className="h-7 w-20 rounded-full bg-[#e8e2d3]" />
              <div className="h-3 w-24 rounded-full bg-[#e8e2d3]" />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={HomeIcon} label="Total properties" value={fmtNumber(stats.totalProperties)} />
            <StatCard icon={Clock} label="Pending approvals" value={fmtNumber(stats.pendingApprovals)} accent={stats.pendingApprovals > 0} />
            <StatCard icon={Users} label="Owners" value={fmtNumber(stats.owners)} />
            <StatCard icon={User} label="Users" value={fmtNumber(stats.users)} />
            <StatCard icon={IndianRupee} label="Total deposits" value={`₹${fmtNumber(stats.totalDeposit)}`} />
            <StatCard icon={ShieldCheck} label="KYC pending" value={fmtNumber(stats.ownersPendingKYC)} accent={stats.ownersPendingKYC > 0} />
            <StatCard icon={CheckCircle} label="Available" value={fmtNumber(stats.availableProperties)} />
          </>
        )}
      </section>

      {/* Quick actions */}
      <section className="mb-10">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)] mb-3">Quick actions</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink to="/admin/pending-approvals" icon={Search} title="Review pending" subtitle="Approve or reject new listings" />
          <QuickLink to="/admin/all-properties" icon={ListChecks} title="All properties" subtitle="Manage every listing" />
          <QuickLink to="/admin/users" icon={Users} title="Manage users" subtitle="Roles, status, and access" />
          <QuickLink to="/admin/analytics" icon={BarChart3} title="Analytics" subtitle="Trends and growth metrics" />
        </div>
      </section>

      {/* Footer banner */}
      <div className="rounded-3xl border border-rule bg-card p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-5 justify-between">
        <div>
          <p className="font-eyebrow text-accent text-[11px]">Insights</p>
          <h3 className="font-display text-[24px] mt-1 text-ink">Detailed analytics</h3>
          <p className="text-[14px] text-[color:var(--muted)] mt-1 max-w-md">
            Visualize property trends, user growth, and KYC progress in one place.
          </p>
        </div>
        <Link
          to="/admin/analytics"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition"
        >
          Open analytics <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`rounded-3xl border bg-card p-6 transition hover:-translate-y-0.5 hover:shadow-card-hover ${accent ? "border-accent/40" : "border-rule"}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${accent ? "bg-accent/10 text-accent" : "bg-paper text-ink"}`}>
        <Icon className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <div className="mt-4 font-display text-[28px] leading-none text-ink">{value}</div>
      <div className="mt-1.5 text-[13px] text-[color:var(--muted)]">{label}</div>
    </div>
  );
}

function QuickLink({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-rule bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover flex flex-col gap-3"
    >
      <div className="w-10 h-10 rounded-2xl bg-paper text-ink flex items-center justify-center">
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
      </div>
      <div>
        <div className="font-medium text-[15px] text-ink">{title}</div>
        <div className="text-[12px] text-[color:var(--muted)] mt-0.5">{subtitle}</div>
      </div>
      <div className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-ink">
        Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}
