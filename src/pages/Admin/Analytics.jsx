import { useEffect, useState } from "react";
import API from "../../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];

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
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading analytics…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-red-700 font-semibold text-center">
        {error}
      </div>
    );
  }

  const barData = [
    { name: "Total", value: stats.totalProperties },
    { name: "Pending", value: stats.pendingApprovals },
    { name: "Available", value: stats.availableProperties },
  ];

  const pieData = [
    { name: "Owners", value: stats.owners },
    { name: "Users", value: stats.users },
    { name: "KYC Pending", value: stats.ownersPendingKYC },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-extrabold text-blue-900 tracking-wide">Analytics</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <SummaryCard label="Total Properties" value={stats.totalProperties} color="bg-blue-500" />
        <SummaryCard label="Pending Approvals" value={stats.pendingApprovals} color="bg-yellow-500" />
        <SummaryCard label="Available" value={stats.availableProperties} color="bg-teal-500" />
        <SummaryCard label="Total Deposits (₹)" value={stats.totalDeposit?.toLocaleString("en-IN")} color="bg-indigo-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Bar chart: properties */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">Property Overview</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 13 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart: user breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-700">User Breakdown</h2>
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
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KYC status */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-700">Owner KYC Status</h2>
        <div className="flex flex-wrap gap-6">
          <Stat label="Total Owners" value={stats.owners} />
          <Stat label="KYC Pending" value={stats.ownersPendingKYC} highlight />
          <Stat label="KYC Verified" value={Math.max(0, stats.owners - stats.ownersPendingKYC)} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className={`${color} rounded-xl p-5 text-white shadow-md`}>
      <p className="text-2xl font-extrabold">{value ?? 0}</p>
      <p className="text-sm opacity-90 mt-1">{label}</p>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border px-6 py-4 ${highlight ? "border-yellow-400 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}>
      <p className={`text-2xl font-bold ${highlight ? "text-yellow-700" : "text-gray-800"}`}>{value ?? 0}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
