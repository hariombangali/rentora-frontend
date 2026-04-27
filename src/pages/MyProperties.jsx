import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  BoltIcon,
  InboxArrowDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function MyProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchMyProperties = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await API.get("/properties/my-properties", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProperties(res.data || []);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };
    fetchMyProperties();
  }, [user]);

  const stats = useMemo(() => {
    const total = properties.length;
    const approved = properties.filter((p) => p.approved && !p.rejected).length;
    const rejected = properties.filter((p) => p.rejected).length;
    const pending = properties.filter((p) => !p.approved && !p.rejected).length;
    const active = properties.filter((p) => p.active).length;
    return { total, approved, rejected, pending, active };
  }, [properties]);

  const filtered = useMemo(() => {
    let list = [...properties];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q) ||
          String(p.price || "").includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((p) => p.type?.toLowerCase() === typeFilter);
    if (statusFilter !== "all") {
      if (statusFilter === "approved") list = list.filter((p) => p.approved && !p.rejected);
      if (statusFilter === "rejected") list = list.filter((p) => p.rejected);
      if (statusFilter === "pending") list = list.filter((p) => !p.approved && !p.rejected);
      if (statusFilter === "active") list = list.filter((p) => p.active);
      if (statusFilter === "inactive") list = list.filter((p) => !p.active);
    }
    if (sortBy === "newest") list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    else if (sortBy === "price-asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "title") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return list;
  }, [properties, query, typeFilter, statusFilter, sortBy]);

  function statusBadge(p) {
    if (p.approved && !p.rejected)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-1 text-[11px] font-medium text-[#2e7d32]">
          <CheckCircleIcon className="h-3.5 w-3.5" /> Approved
        </span>
      );
    if (p.rejected)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700">
          <XCircleIcon className="h-3.5 w-3.5" /> Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        <ClockIcon className="h-3.5 w-3.5" /> Pending
      </span>
    );
  }

  const requestDelete = (id, title) => {
    setConfirmState({
      id,
      title: "Delete property",
      message: `Are you sure you want to delete "${title || "this property"}"? This action cannot be undone.`,
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties((prev) => prev.filter((p) => p._id !== id));
      setToast({ type: "success", message: "Property deleted" });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to delete property" });
    } finally {
      setConfirmState(null);
    }
  };

  const handleToggle = async (id, active) => {
    const prev = [...properties];
    setProperties((prevList) => prevList.map((p) => (p._id === id ? { ...p, active: !active } : p)));
    try {
      const token = localStorage.getItem("token");
      const res = await API.put(`/properties/${id}/toggle`, { active: !active }, { headers: { Authorization: `Bearer ${token}` } });
      setProperties((prevList) => prevList.map((p) => (p._id === id ? res.data : p)));
      setToast({ type: "success", message: !active ? "Activated" : "Deactivated" });
    } catch (err) {
      setProperties(prev);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to update status" });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const uniqueTypes = useMemo(() => {
    const set = new Set((properties || []).map((p) => (p.type || "").toLowerCase()).filter(Boolean));
    return Array.from(set);
  }, [properties]);

  const hasFilters = query || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-12">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-eyebrow text-[11px] text-[color:var(--muted)] mb-1">Owner dashboard</p>
            <h1 className="font-display text-[36px] md:text-[42px] leading-tight text-ink">My Properties</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Manage listings, update status, and review requests from one place.
            </p>
          </div>
          <Link
            to="/postProperty"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent transition shrink-0"
          >
            <PlusIcon className="h-4 w-4" />
            Post Property
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total", value: stats.total, accent: false },
            { label: "Approved", value: stats.approved, color: "#2e7d32" },
            { label: "Pending", value: stats.pending, color: "#b45309" },
            { label: "Rejected", value: stats.rejected, color: "#b91c1c" },
            { label: "Active", value: stats.active, color: "var(--accent)" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-rule bg-card px-4 py-4 shadow-sm">
              <p className="font-eyebrow text-[10px] text-[color:var(--muted)]">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: s.color || "var(--ink)" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, type, or price…"
              className="w-full rounded-xl border border-rule bg-card py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-[color:var(--muted)] focus:outline-none focus:border-ink transition"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-rule bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            >
              <option value="all">All types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-rule bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            >
              <option value="all">All status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-rule bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="title">Title A → Z</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-medium text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-accent transition"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-2xl border border-rule bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-paper flex items-center justify-center">
              <InboxArrowDownIcon className="h-7 w-7 text-[color:var(--muted)]" />
            </div>
            <h3 className="font-display text-xl text-ink">No properties found</h3>
            <p className="mt-1.5 text-sm text-[color:var(--muted)]">
              {hasFilters ? "Try adjusting your filters." : "Post a property to get started."}
            </p>
            <div className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              {hasFilters && (
                <button
                  onClick={() => { setQuery(""); setTypeFilter("all"); setStatusFilter("all"); setSortBy("newest"); }}
                  className="rounded-full border border-rule bg-card px-5 py-2 text-sm font-medium text-ink hover:border-ink transition"
                >
                  Clear filters
                </button>
              )}
              <Link
                to="/postProperty"
                className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-accent transition"
              >
                Post Property
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const firstImage = p.images?.length > 0 ? p.images[0] : "/default-property.jpg";
              return (
                <div
                  key={p._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-rule bg-card shadow-sm hover:shadow-md transition"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={firstImage}
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = "/default-property.jpg"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                    {/* Status badge */}
                    <div className="absolute left-3 top-3">{statusBadge(p)}</div>

                    {/* Active pill */}
                    <div className="absolute left-3 bottom-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${p.active ? "bg-ink/80 text-paper" : "bg-black/40 text-paper/70"}`}>
                        {p.active ? "Live" : "Inactive"}
                      </span>
                    </div>

                    {/* Menu */}
                    <div className="absolute right-3 top-3">
                      <Menu as="div" className="relative">
                        <MenuButton className="inline-flex rounded-full bg-white/90 p-1.5 text-ink shadow hover:bg-white focus:outline-none transition">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </MenuButton>
                        <MenuItems
                          anchor="bottom end"
                          className="z-20 mt-2 w-48 origin-top-right rounded-xl border border-rule bg-card p-1 text-sm shadow-lg focus:outline-none"
                        >
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                to={`/properties/${p._id}`}
                                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-ink transition ${active ? "bg-paper" : ""}`}
                              >
                                <EyeIcon className="h-4 w-4 text-[color:var(--muted)]" /> View details
                              </Link>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={() => navigate(`/edit-property/${p._id}`)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-ink transition ${active ? "bg-paper" : ""}`}
                              >
                                <PencilSquareIcon className="h-4 w-4 text-[color:var(--muted)]" /> Edit
                              </button>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={() => handleToggle(p._id, p.active)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-ink transition ${active ? "bg-paper" : ""}`}
                              >
                                <BoltIcon className="h-4 w-4 text-[color:var(--muted)]" /> {p.active ? "Deactivate" : "Activate"}
                              </button>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={() => navigate(`/properties/${p._id}/requests`)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-ink transition ${active ? "bg-paper" : ""}`}
                              >
                                <InboxArrowDownIcon className="h-4 w-4 text-[color:var(--muted)]" /> Requests
                              </button>
                            )}
                          </MenuItem>
                          <div className="my-1 border-t border-rule" />
                          <MenuItem>
                            {({ active }) => (
                              <button
                                onClick={() => requestDelete(p._id, p.title)}
                                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-600 transition ${active ? "bg-red-50" : ""}`}
                              >
                                <TrashIcon className="h-4 w-4" /> Delete
                              </button>
                            )}
                          </MenuItem>
                        </MenuItems>
                      </Menu>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-1 text-[15px] font-semibold text-ink">{p.title}</h3>
                    <p className="mt-1 text-[13px] text-[color:var(--muted)]">
                      {[p.location?.area || p.location?.city, p.bhk ? `${p.bhk} BHK` : null, p.size ? `${p.size} sq.ft.` : null]
                        .filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-2 text-base font-semibold text-ink">
                      ₹{p.price?.toLocaleString("en-IN")}
                      <span className="text-[13px] font-normal text-[color:var(--muted)]">/month</span>
                    </p>

                    {p.rejected && (
                      <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-700">
                        <span className="font-medium">Rejection reason: </span>
                        {p.rejectionReason?.trim() || <span className="italic text-[color:var(--muted)]">No reason specified</span>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex items-center gap-2">
                      <Link
                        to={`/properties/${p._id}`}
                        className="flex-1 rounded-full border border-rule bg-paper px-3 py-2 text-center text-[13px] font-medium text-ink hover:border-ink transition"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => navigate(`/edit-property/${p._id}`)}
                        className="flex-1 rounded-full border border-rule bg-paper px-3 py-2 text-[13px] font-medium text-ink hover:border-ink transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(p._id, p.active)}
                        className={`flex-1 rounded-full px-3 py-2 text-[13px] font-medium transition ${
                          p.active
                            ? "border border-rule bg-paper text-ink hover:border-ink"
                            : "bg-ink text-paper hover:bg-accent"
                        }`}
                      >
                        {p.active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-paper shadow-lg transition ${
            toast.type === "success" ? "bg-ink" : "bg-red-600"
          }`}
        >
          {toast.type === "success"
            ? <CheckCircleIcon className="h-4 w-4" />
            : <XCircleIcon className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          onCancel={() => setConfirmState(null)}
          onConfirm={confirmState.onConfirm}
        />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-rule bg-card overflow-hidden">
      <div className="h-48 w-full bg-[#e8e2d3]" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded-full bg-[#e8e2d3]" />
        <div className="h-3 w-1/2 rounded-full bg-[#e8e2d3]" />
        <div className="h-5 w-1/3 rounded-full bg-[#e8e2d3]" />
        <div className="mt-4 flex gap-2">
          <div className="h-9 flex-1 rounded-full bg-[#e8e2d3]" />
          <div className="h-9 flex-1 rounded-full bg-[#e8e2d3]" />
          <div className="h-9 flex-1 rounded-full bg-[#e8e2d3]" />
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
        <h4 className="font-display text-xl text-ink">{title}</h4>
        <p className="mt-2 text-sm text-[color:var(--muted)] leading-relaxed">{message}</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-full border border-rule bg-paper px-5 py-2 text-sm font-medium text-ink hover:border-ink transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-paper hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
