import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CalendarDays, Home as HomeIcon, ArrowRight, Plus, Wrench } from "lucide-react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    pendingApps: 0,
    totalApps: 0,
    pendingVisits: 0,
    totalBookings: 0,
    listings: 0,
    openIssues: 0,
    totalIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const auth = { headers: { Authorization: `Bearer ${token}` } };

    Promise.allSettled([
      API.get("/applications/owner", auth),
      API.get("/bookings/owner", auth),
      API.get("/properties/my-properties", auth),
      API.get("/issues/owner", auth),
    ]).then(([appsR, bkR, propsR, issR]) => {
      const apps = appsR.status === "fulfilled" ? appsR.value.data || [] : [];
      const bks = bkR.status === "fulfilled" ? bkR.value.data || [] : [];
      const props = propsR.status === "fulfilled"
        ? (Array.isArray(propsR.value.data) ? propsR.value.data : propsR.value.data?.properties || [])
        : [];
      const issues = issR.status === "fulfilled" ? issR.value.data || [] : [];

      setCounts({
        pendingApps: apps.filter((a) => a.status === "pending").length,
        totalApps: apps.length,
        pendingVisits: bks.filter((b) => b.type === "visit" && b.status === "pending").length,
        totalBookings: bks.length,
        listings: props.length,
        openIssues: issues.filter((i) => ["open", "acknowledged", "in_progress"].includes(i.status)).length,
        totalIssues: issues.length,
      });
      setLoading(false);
    });
  }, []);

  const firstName = (user?.name || "").split(" ")[0] || "there";

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1280px] mx-auto px-5 md:px-6 pt-8 pb-24">
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <span>Dashboard</span>
        </div>

        <p className="font-eyebrow text-accent mt-4">Owner control room</p>
        <h1 className="font-display text-[40px] md:text-[56px] leading-[1] mt-2 tracking-[-0.02em]">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-[color:var(--muted)]">
          {loading
            ? "Loading your activity…"
            : counts.pendingApps + counts.pendingVisits + counts.openIssues === 0
            ? "All caught up. When tenants apply, request visits, or raise issues, they'll show up here."
            : `You have ${counts.pendingApps + counts.pendingVisits + counts.openIssues} item${counts.pendingApps + counts.pendingVisits + counts.openIssues === 1 ? "" : "s"} that need your attention.`}
        </p>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-rule rounded-3xl p-6 animate-pulse flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#e8e2d3]" />
                  <div className="h-7 w-16 rounded-full bg-[#e8e2d3]" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-28 rounded-full bg-[#e8e2d3]" />
                  <div className="h-4 w-full rounded-full bg-[#e8e2d3]" />
                  <div className="h-4 w-3/4 rounded-full bg-[#e8e2d3]" />
                </div>
                <div className="h-4 w-16 rounded-full bg-[#e8e2d3] mt-auto" />
              </div>
            ))}
          </div>
        ) : (
        <>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashCard
            to="/owner/applications"
            icon={<FileText className="w-5 h-5" />}
            title="Applications"
            subtitle="Rental applications from prospective tenants"
            badge={counts.pendingApps}
            total={counts.totalApps}
            loading={loading}
            emphasis={counts.pendingApps > 0}
          />
          <DashCard
            to="/owner/bookings"
            icon={<CalendarDays className="w-5 h-5" />}
            title="Visit requests"
            subtitle="Upcoming visits, reschedules, and leads"
            badge={counts.pendingVisits}
            total={counts.totalBookings}
            loading={loading}
            emphasis={counts.pendingVisits > 0}
          />
          <DashCard
            to="/owner/issues"
            icon={<Wrench className="w-5 h-5" />}
            title="Maintenance"
            subtitle="Issues raised by active tenants"
            badge={counts.openIssues}
            total={counts.totalIssues}
            loading={loading}
            emphasis={counts.openIssues > 0}
            badgeLabel="open"
          />
          <DashCard
            to="/my-properties"
            icon={<HomeIcon className="w-5 h-5" />}
            title="Listings"
            subtitle="Homes you've listed on Rentora"
            badge={0}
            total={counts.listings}
            loading={loading}
            emphasis={false}
            badgeLabel="listed"
          />
        </div>

        <div className="mt-10 bg-card border border-rule rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <p className="font-eyebrow text-accent">Grow your portfolio</p>
            <h3 className="font-display text-[24px] mt-1">List another home.</h3>
            <p className="text-[14px] text-[color:var(--muted)] mt-1">
              Free photography, verified tenants, zero brokerage — same calm flow.
            </p>
          </div>
          <Link
            to="/postProperty"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition"
          >
            <Plus className="w-4 h-4" /> List a home
          </Link>
        </div>
        </>
        )}
      </div>
    </div>
  );
}

function DashCard({ to, icon, title, subtitle, badge, total, loading, emphasis, badgeLabel }) {
  return (
    <Link
      to={to}
      className={`group bg-card border rounded-3xl p-6 flex flex-col gap-4 transition hover:-translate-y-1 hover:shadow-card-hover ${
        emphasis ? "border-accent/40" : "border-rule"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-2xl bg-[oklch(0.96_0.02_80)] text-accent flex items-center justify-center">
          {icon}
        </div>
        {badge > 0 ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent text-paper text-[12px] font-medium">
            {badge} new
          </span>
        ) : total > 0 ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-paper border border-rule text-[color:var(--muted)] text-[12px]">
            {total} {badgeLabel || "total"}
          </span>
        ) : null}
      </div>
      <div>
        <div className="font-display text-[22px]">{title}</div>
        <p className="text-[13px] text-[color:var(--muted)] mt-1">{subtitle}</p>
      </div>
      <div className="mt-auto flex items-center gap-2 text-[13px] font-medium text-ink">
        Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
      </div>
    </Link>
  );
}
