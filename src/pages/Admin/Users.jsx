import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

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
      const res = await API.get("/admin/users", {
        ...authHeader,
        params: { search, role, page, limit: 10 },
      });
      setUsers(res.data.users || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const changeUserStatus = async (id, active) => {
    try {
      await API.put(`/admin/users/${id}`, { active }, authHeader);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, active } : u));
    } catch {
      toast.error("Failed to update user status");
    }
  };

  const changeUserRole = async (id, newRole) => {
    try {
      await API.put(`/admin/users/${id}`, { role: newRole }, authHeader);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role: newRole } : u));
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const deleteUser = async (id) => {
    setDeleteTarget(null);
    try {
      await API.delete(`/admin/users/${id}`, authHeader);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User"
        message="This will permanently delete the user and their data. Continue?"
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => deleteUser(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[200px]"
        />
        <select
          value={role}
          onChange={(e) => { setPage(1); setRole(e.target.value); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-10 rounded-lg bg-gray-100" />)}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Email", "Role", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-2 px-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500">No users found.</td></tr>
                ) : users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/60 transition">
                    <td className="py-2 px-3 font-medium text-gray-900">{user.name}</td>
                    <td className="py-2 px-3 text-gray-600">{user.email}</td>
                    <td className="py-2 px-3">
                      <select
                        value={user.role}
                        onChange={(e) => changeUserRole(user._id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={user.active !== false ? "active" : "inactive"}
                        onChange={(e) => changeUserStatus(user._id, e.target.value === "active")}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => setDeleteTarget(user._id)}
                        className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100 hover:bg-red-100"
                      >
                        Delete
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
