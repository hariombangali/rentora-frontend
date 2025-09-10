import { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  BoltIcon,
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
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }
  const [confirmState, setConfirmState] = useState(null); // { id, title, message, onConfirm }

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

    if (typeFilter !== "all") {
      list = list.filter((p) => p.type?.toLowerCase() === typeFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "approved") list = list.filter((p) => p.approved && !p.rejected);
      if (statusFilter === "rejected") list = list.filter((p) => p.rejected);
      if (statusFilter === "pending") list = list.filter((p) => !p.approved && !p.rejected);
      if (statusFilter === "active") list = list.filter((p) => p.active);
      if (statusFilter === "inactive") list = list.filter((p) => !p.active);
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "price-asc") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "title") {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    return list;
  }, [properties, query, typeFilter, statusFilter, sortBy]);

  function badge(p) {
    if (p.approved && !p.rejected)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
          <CheckCircleIcon className="h-4 w-4" />
          Approved
        </span>
      );
    if (p.rejected)
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
          <XCircleIcon className="h-4 w-4" />
          Rejected
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
        <ClockIcon className="h-4 w-4" />
        Pending
      </span>
    );
  }

  // Delete (with confirmation modal)
  const requestDelete = (id, title) => {
    setConfirmState({
      id,
      title: "Delete property",
      message: `Are you sure you want to delete “${title || "this property"}”? This action cannot be undone.`,
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/properties/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties((prev) => prev.filter((p) => p._id !== id));
      setToast({ type: "success", message: "Property deleted" });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.message || "Failed to delete property" });
    } finally {
      setConfirmState(null);
    }
  };

  // Toggle Active
  const handleToggle = async (id, active) => {
    const prev = properties;
    // Optimistic UI
    setProperties((prevList) => prevList.map((p) => (p._id === id ? { ...p, active: !active } : p)));

    try {
      const token = localStorage.getItem("token");
      const res = await API.put(
        `/properties/${id}/toggle`,
        { active: !active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProperties((prevList) => prevList.map((p) => (p._id === id ? res.data : p)));
      setToast({ type: "success", message: !active ? "Activated" : "Deactivated" });
    } catch (err) {
      // rollback
      setProperties(prev);
      setToast({ type: "error", message: err.response?.data?.message || "Failed to update status" });
    }
  };

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const uniqueTypes = useMemo(() => {
    const set = new Set((properties || []).map((p) => (p.type || "").toLowerCase()).filter(Boolean));
    return Array.from(set);
  }, [properties]);

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">My Properties</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage listings, update status, and review requests from one place.
          </p>
        </div>
        <Link
          to="/post-property"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          + Post Property
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Total" value={stats.total} />
        <Stat label="Approved" value={stats.approved} color="text-green-600" />
        <Stat label="Pending" value={stats.pending} color="text-amber-600" />
        <Stat label="Rejected" value={stats.rejected} color="text-red-600" />
        <Stat label="Active" value={stats.active} color="text-blue-600" />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, type, or price..."
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm shadow-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <FunnelIcon className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white py-2 pl-8 pr-8 text-sm shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="title">Title A → Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="mx-auto max-w-md rounded-md border border-red-200 bg-red-50 p-4 text-center">
          <p className="font-medium text-red-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-gray-100"></div>
          <h3 className="text-lg font-semibold">No properties found</h3>
          <p className="mt-1 text-sm text-gray-600">
            Try adjusting filters or post a new property to get started.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <button
              onClick={() => {
                setQuery("");
                setTypeFilter("all");
                setStatusFilter("all");
                setSortBy("newest");
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Clear filters
            </button>
            <Link
              to="/post-property"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Post Property
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const firstImage =
              p.images && p.images.length > 0
                ? `${API.defaults.baseURL.replace("/api", "")}/uploads/${p.images[0]}`
                : "/default-property.jpg";

            return (
              <div
                key={p._id}
                className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative">
                  <img
                    src={firstImage}
                    alt={p.title}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/default-property.jpg";
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/0 to-transparent opacity-0 transition group-hover:opacity-100" />

                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    {badge(p)}
                    <Menu as="div" className="relative">
                      <MenuButton className="inline-flex rounded-md bg-white/90 p-1.5 text-gray-700 shadow hover:bg-white focus:outline-none">
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </MenuButton>
                      <MenuItems
                        anchor="bottom end"
                        className="z-20 mt-2 w-48 origin-top-right rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg focus:outline-none"
                      >
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              to={`/properties/${p._id}`}
                              className={`flex items-center gap-2 rounded px-3 py-2 ${active ? "bg-gray-100" : ""}`}
                            >
                              <EyeIcon className="h-4 w-4" />
                              View details
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => navigate(`/edit-property/${p._id}`)}
                              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left ${active ? "bg-gray-100" : ""}`}
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                              Edit
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => handleToggle(p._id, p.active)}
                              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left ${active ? "bg-gray-100" : ""}`}
                            >
                              <BoltIcon className="h-4 w-4" />
                              {p.active ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => navigate(`/properties/${p._id}/requests`)}
                              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left ${active ? "bg-gray-100" : ""}`}
                            >
                              <FunnelIcon className="h-4 w-4" />
                              Requests
                            </button>
                          )}
                        </MenuItem>
                        <div className="my-1 border-t border-gray-100" />
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => requestDelete(p._id, p.title)}
                              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left ${active ? "bg-red-50" : ""} text-red-600`}
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-1 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {p.location?.area || p.location?.city || ""} {p.bhk ? `• ${p.bhk} BHK` : ""}{" "}
                    {p.size ? `• ${p.size} sq.ft.` : ""}
                  </p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    ₹{p.price?.toLocaleString("en-IN")}/month
                  </p>

                  {p.rejected && (
                    <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <b>Rejection Reason:</b>{" "}
                      {p.rejectionReason && p.rejectionReason.trim() !== "" ? (
                        p.rejectionReason
                      ) : (
                        <span className="italic text-gray-500">No reason specified</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 hidden gap-2 sm:flex">
                    <Link
                      to={`/properties/${p._id}`}
                      className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => navigate(`/edit-property/${p._id}`)}
                      className="flex-1 rounded-md bg-yellow-500 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(p._id, p.active)}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium text-white ${p.active ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:hidden">
                    <Link
                      to={`/properties/${p._id}`}
                      className="w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                    >
                      View details
                    </Link>
                    <button
                      onClick={() => navigate(`/edit-property/${p._id}`)}
                      className="w-full rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggle(p._id, p.active)}
                      className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white ${p.active ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"
                        }`}
                    >
                      {p.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => navigate(`/properties/${p._id}/requests`)}
                      className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                    >
                      Requests
                    </button>
                    <button
                      onClick={() => requestDelete(p._id, p.title)}
                      className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 rounded-md px-4 py-2 text-sm text-white shadow-lg ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
        >
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

// Small stat card
function Stat({ label, value, color = "text-gray-900" }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="h-48 w-full bg-gray-200" />
      <div className="space-y-2 p-4">
        <div className="h-5 w-2/3 rounded bg-gray-200" />
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-6 w-1/3 rounded bg-gray-200" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="h-9 rounded bg-gray-200" />
          <div className="h-9 rounded bg-gray-200" />
          <div className="h-9 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// Minimal confirm dialog
function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-gray-700">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
