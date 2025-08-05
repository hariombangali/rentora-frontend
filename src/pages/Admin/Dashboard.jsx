import { useEffect, useState } from "react";
import API from "../../services/api";
import { Link } from "react-router-dom";
import {
  ArrowPathIcon,
  HomeIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  CurrencyRupeeIcon,
  DocumentCheckIcon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";

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

  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-wide">Admin Dashboard</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          className={`inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
        >
          <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ display: loading ? "inline" : "none" }} />
          {!loading && "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded bg-red-100 p-4 text-red-700 font-semibold text-center">{error}</div>
      )}

      {/* Stats Grid */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <StatCard
          icon={<HomeIcon className="h-10 w-10 text-blue-200" />}
          label="Total Properties"
          value={stats.totalProperties}
          colorClass="from-blue-500 to-blue-700"
        />
        <StatCard
          icon={<ClockIcon className="h-10 w-10 text-yellow-200" />}
          label="Pending Approvals"
          value={stats.pendingApprovals}
          colorClass="from-yellow-400 to-yellow-600"
        />
        <StatCard
          icon={<UserGroupIcon className="h-10 w-10 text-green-200" />}
          label="Owners"
          value={stats.owners}
          colorClass="from-green-500 to-green-700"
        />
        <StatCard
          icon={<UserIcon className="h-10 w-10 text-purple-200" />}
          label="Users"
          value={stats.users}
          colorClass="from-purple-500 to-purple-700"
        />
        <StatCard
          icon={<CurrencyRupeeIcon className="h-10 w-10 text-indigo-200" />}
          label="Total Deposits (₹)"
          value={stats.totalDeposit}
          colorClass="from-indigo-500 to-indigo-700"
        />
        <StatCard
          icon={<DocumentCheckIcon className="h-10 w-10 text-red-200" />}
          label="Owners Pending KYC"
          value={stats.ownersPendingKYC}
          colorClass="from-red-400 to-red-600"
        />
        <StatCard
          icon={<ClockIcon className="h-10 w-10 text-teal-200" />}
          label="Available Properties"
          value={stats.availableProperties}
          colorClass="from-teal-500 to-teal-700"
        />
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold text-gray-700">Quick Links</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <QuickLink title="Review Pending Properties" to="/admin/pending-approvals" icon="🔍" />
          <QuickLink title="All Properties" to="/admin/all-properties" icon="📋" />
          <QuickLink title="Manage Users" to="/admin/users" icon="👥" />
          <QuickLink title="Analytics" to="/admin/analytics" icon="📊" />
          {/* Add more as needed */}
        </div>
      </section>

      {/* Analytics Placeholder */}
      <section className="mt-12">
        <div className="rounded-xl bg-white p-6 shadow-xl text-center text-gray-500">
          <ChartBarSquareIcon className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <p className="text-xl font-semibold">Analytics coming soon</p>
          <p className="mt-2 max-w-md mx-auto">
            Visualize property trends, user growth, and other key metrics here using charts.
          </p>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${colorClass} shadow-lg p-6 flex items-center space-x-4 cursor-default`}
      title={`${label}: ${value}`}
    >
      <div className="p-4 rounded-lg bg-white bg-opacity-20">{icon}</div>
      <div>
        <p className="text-3xl font-extrabold text-white">{value ?? 0}</p>
        <p className="text-sm text-white/90">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ title, to, icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800 shadow-md hover:bg-blue-100 transition"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold tracking-wide">{title}</span>
    </Link>
  );
}
