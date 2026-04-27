import { useEffect, useState } from "react";
import API from "../../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#8b6f47", "#a08768", "#c4a584", "#dbc4a8"];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/admin/dashboard-stats", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setStats(res.data))
      .catch(() => setError("Failed to load analytics data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8 space-y-2">
          <div className="h-3 w-20 rounded-full bg-[#e8e2d3] animate-pulse" />
          <div className="h-10 w-48 rounded-full bg-[#e8e2d3] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-rule bg-card p-6 animate-pulse space-y-3">
              <div className="h-7 w-20 rounded-full bg-[#e8e2d3]" />
              <div className="h-3 w-24 rounded-full bg-[#e8e2d3]" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-rule bg-card p-6 h-[340px] animate-pulse" />
          <div className="rounded-3xl border border-rule bg-card p-6 h-[340px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 font-medium text-center">
        {error}
      </div>
    );
  }

  const fmt = (n) => (n ?? 0).toLocaleString("en-IN");

  const barData = [
    { name: "Total", value: stats.totalProperties || 0 },
    { name: "Pending", value: stats.pendingApprovals || 0 },
    { name: "Available", value: stats.availableProperties || 0 },
  ];

  const pieData = [
    { name: "Owners", value: stats.owners || 0 },
    { name: "Users", value: stats.users || 0 },
    { name: "KYC Pending", value: stats.ownersPendingKYC || 0 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-8">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Insights</p>
        <h1 className="font-display text-[36px] md:text-[42px] leading-tight mt-1 text-ink">Analytics</h1>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">Trends and growth metrics across the marketplace.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <SummaryCard label="Total properties" value={fmt(stats.totalProperties)} />
        <SummaryCard label="Pending approvals" value={fmt(stats.pendingApprovals)} accent={stats.pendingApprovals > 0} />
        <SummaryCard label="Available" value={fmt(stats.availableProperties)} />
        <SummaryCard label="Total deposits" value={`₹${fmt(stats.totalDeposit)}`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        <ChartCard title="Property overview" subtitle="Counts by status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D3" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8A8880" }} stroke="#E8E2D3" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#8A8880" }} stroke="#E8E2D3" />
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E8E2D3", borderRadius: "12px", fontSize: "13px" }}
                labelStyle={{ color: "#1F2420" }}
              />
              <Bar dataKey="value" fill="#8b6f47" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="User breakdown" subtitle="Owners, renters, and KYC status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#FFFFFF", border: "1px solid #E8E2D3", borderRadius: "12px", fontSize: "13px" }}
                labelStyle={{ color: "#1F2420" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#8A8880" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* KYC status */}
      <div className="rounded-3xl border border-rule bg-card p-6 md:p-8">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">KYC progress</p>
        <h2 className="font-display text-[24px] mt-1 text-ink">Owner verification status</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat label="Total owners" value={fmt(stats.owners)} />
          <Stat label="KYC pending" value={fmt(stats.ownersPendingKYC)} highlight />
          <Stat label="KYC verified" value={fmt(Math.max(0, (stats.owners || 0) - (stats.ownersPendingKYC || 0)))} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className={`rounded-3xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover ${accent ? "border-accent/40" : "border-rule"}`}>
      <p className="font-display text-[26px] text-ink leading-none">{value}</p>
      <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mt-2">{label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-rule bg-card p-6">
      <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">{subtitle}</p>
      <h2 className="font-display text-[20px] text-ink mt-1 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl border px-5 py-4 ${highlight ? "border-accent/40 bg-accent/5" : "border-rule bg-paper"}`}>
      <p className={`font-display text-[24px] leading-none ${highlight ? "text-accent" : "text-ink"}`}>{value}</p>
      <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mt-2">{label}</p>
    </div>
  );
}
