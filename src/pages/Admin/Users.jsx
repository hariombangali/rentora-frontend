import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import { Search, Trash2, Inbox } from "lucide-react";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 400);
    return () => clearTimeout(t);
  }, [search, role, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users", { ...authHeader, params: { search, role, page, limit: 10 } });
      setUsers(res.data.users || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally { setLoading(false); }
  };

  const changeUserStatus = async (id, active) => {
    try {
      await API.put(`/admin/users/${id}`, { active }, authHeader);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, active } : u));
    } catch { toast.error("Failed to update user status"); }
  };

  const changeUserRole = async (id, newRole) => {
    try {
      await API.put(`/admin/users/${id}`, { role: newRole }, authHeader);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
    } catch { toast.error("Failed to update user role"); }
  };

  const deleteUser = async (id) => {
    setDeleteTarget(null);
    try {
      await API.delete(`/admin/users/${id}`, authHeader);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch { toast.error("Failed to delete user"); }
  };

  const initials = (n) => (n || "U").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-8">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">People</p>
        <h1 className="font-display text-[36px] md:text-[42px] leading-tight mt-1 text-ink">Manage users</h1>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">Roles, status, and account access.</p>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete user"
        message="This will permanently delete the user and their data. Continue?"
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => deleteUser(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-wrap gap-2.5 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted)]" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="w-full rounded-xl border border-rule bg-card py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-ink transition"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setPage(1); setRole(e.target.value); }}
          className="rounded-xl border border-rule bg-card px-3 py-2.5 text-sm focus:outline-none focus:border-ink transition"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-rule bg-card overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`px-5 py-4 flex items-center gap-4 animate-pulse ${i !== 7 ? "border-b border-rule" : ""}`}>
              <div className="w-9 h-9 rounded-full bg-[#e8e2d3]" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-32 rounded-full bg-[#e8e2d3]" />
                <div className="h-3 w-48 rounded-full bg-[#e8e2d3]" />
              </div>
              <div className="h-7 w-20 rounded-full bg-[#e8e2d3]" />
              <div className="h-7 w-20 rounded-full bg-[#e8e2d3]" />
              <div className="h-7 w-7 rounded-full bg-[#e8e2d3]" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-rule bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-5 h-5 text-[color:var(--muted)]" />
          </div>
          <h3 className="font-display text-[20px] text-ink">No users found</h3>
          <p className="text-[13px] text-[color:var(--muted)] mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-rule bg-card">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-rule">
                <tr>
                  {["User", "Email", "Role", "Status", ""].map((h) => (
                    <th key={h} className="py-3 px-4 text-left font-eyebrow text-[10px] text-[color:var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-paper/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-paper text-ink flex items-center justify-center font-medium text-[12px] uppercase">
                          {initials(user.name)}
                        </div>
                        <span className="font-medium text-ink">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[color:var(--muted)]">{user.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user._id, e.target.value)}
                        className="rounded-full border border-rule bg-card px-3 py-1 text-[12px] focus:outline-none focus:border-ink transition"
                      >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={user.active !== false ? "active" : "inactive"}
                        onChange={(e) => changeUserStatus(user._id, e.target.value === "active")}
                        className="rounded-full border border-rule bg-card px-3 py-1 text-[12px] focus:outline-none focus:border-ink transition"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(user._id)}
                        title="Delete user"
                        className="w-8 h-8 rounded-full bg-card border border-rule hover:border-red-600 hover:text-red-600 flex items-center justify-center transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
