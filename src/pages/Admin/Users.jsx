import { useEffect, useState } from "react";
import API from "../../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const limit = 10;

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search, role, page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, role, page, limit },
      });
      setUsers(res.data.users);
      setPages(res.data.pages);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const changeUserStatus = async (id, active) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/admin/users/${id}`,
        { active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // refresh list
    } catch (error) {
      alert("Failed to update user status");
    }
  };

  const changeUserRole = async (id, role) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/admin/users/${id}`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // refresh list
    } catch (error) {
      alert("Failed to update user role");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure want to delete this user?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers(); // refresh list
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow max-w-7xl mx-auto">
      <h1 className="text-3xl mb-6 font-bold">Manage Users</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name/email"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="border p-2 rounded w-60"
        />
        <select
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
          className="border p-2 rounded"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {loading ? (
        <div>Loading users...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <>
          <table className="w-full border-collapse border text-left text-sm">
            <thead>
              <tr className="bg-blue-100">
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => (
                <tr key={user._id} className="even:bg-gray-50">
                  <td className="border p-2">{user.name}</td>
                  <td className="border p-2">{user.email}</td>
                  <td className="border p-2">
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user._id, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option value="user">User</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <select
                      value={user.active ? "active" : "inactive"}
                      onChange={(e) => changeUserStatus(user._id, e.target.value === "active")}
                      className="border p-1 rounded"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="border p-2">
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button
              onClick={() => setPage((p) => (p < pages ? p + 1 : p))}
              disabled={page === pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
