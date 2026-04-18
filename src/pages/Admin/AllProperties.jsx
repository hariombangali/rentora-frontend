import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

export default function AllProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchProps = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await API.get(`/admin/all-properties?${params}`, authHeader);
      const data = res.data;
      if (Array.isArray(data)) {
        setProperties(data);
      } else {
        setProperties(data.properties || []);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProps(page); }, [page, statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProps(1);
  };

  const setProcessing = (id, state) =>
    setProcessingIds((prev) => { const s = new Set(prev); state ? s.add(id) : s.delete(id); return s; });

  const approveProperty = async (id) => {
    setProcessing(id, true);
    try {
      await API.put(`/admin/approve-property/${id}`, {}, authHeader);
      setProperties((prev) => prev.map((p) => p._id === id ? { ...p, approved: true, rejected: false } : p));
      toast.success("Property approved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to approve");
    } finally {
      setProcessing(id, false);
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) { toast.error("Rejection reason is required."); return; }
    const id = rejectModal;
    setRejectModal(null);
    setProcessing(id, true);
    try {
      await API.post(`/admin/reject-property/${id}`, { reason: rejectReason }, authHeader);
      setProperties((prev) => prev.map((p) => p._id === id ? { ...p, approved: false, rejected: true, rejectionReason: rejectReason } : p));
      if (selectedProperty?._id === id) setSelectedProperty(null);
      toast.success("Property rejected");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(id, false);
      setRejectReason("");
    }
  };

  const deleteProperty = async (id) => {
    setDeleteTarget(null);
    setProcessing(id, true);
    try {
      await API.delete(`/admin/delete-property/${id}`, authHeader);
      setProperties((prev) => prev.filter((p) => p._id !== id));
      if (selectedProperty?._id === id) setSelectedProperty(null);
      toast.success("Property deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete");
    } finally {
      setProcessing(id, false);
    }
  };

  const toggleFeatured = async (id, currentFeatured, isApproved) => {
    if (!isApproved) { toast.error("Only approved properties can be featured."); return; }
    setProcessing(id, true);
    try {
      await API.put(`/admin/properties/${id}/feature`, { featured: !currentFeatured }, authHeader);
      setProperties((prev) => prev.map((p) => p._id === id ? { ...p, featured: !currentFeatured } : p));
      if (selectedProperty?._id === id) setSelectedProperty((prev) => ({ ...prev, featured: !currentFeatured }));
      toast.success(!currentFeatured ? "Property featured on home" : "Removed from featured");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to update featured status");
    } finally {
      setProcessing(id, false);
    }
  };

  const statusBadgeClass = (p) =>
    p.approved ? "bg-green-100 text-green-800" : p.rejected ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-700";
  const statusLabel = (p) => p.approved ? "Approved" : p.rejected ? "Rejected" : "Pending";

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">All Properties</h2>

      {/* Confirm modals */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Property"
        message="This will permanently delete the property. Continue?"
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => deleteProperty(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Reject Property</h3>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection…"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-red-200"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
              <button onClick={submitReject} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or owner…"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1 min-w-[200px]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Search</button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-10 rounded-lg bg-gray-100" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No properties found.</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  {["Title", "Owner", "Status", "City", "Price", "Featured", "Created", "Actions"].map((h) => (
                    <th key={h} className="py-2 px-3 text-left font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((p) => {
                  const isProcessing = processingIds.has(p._id);
                  return (
                    <tr key={p._id} className="hover:bg-blue-50/40 transition">
                      <td className="py-2 px-3 font-medium text-gray-900 max-w-[180px] truncate">{p.title}</td>
                      <td className="py-2 px-3 text-gray-600">{p.ownerKYC?.ownerName || "N/A"}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(p)}`}>{statusLabel(p)}</span>
                      </td>
                      <td className="py-2 px-3 text-gray-600">{p.location?.city || "N/A"}</td>
                      <td className="py-2 px-3 text-gray-600">₹{p.price?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">{p.featured ? "⭐" : "—"}</td>
                      <td className="py-2 px-3 text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          <button onClick={() => setSelectedProperty(p)} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100">View</button>
                          {!p.approved && !p.rejected && (
                            <>
                              <button disabled={isProcessing} onClick={() => approveProperty(p._id)} className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 disabled:opacity-50">Approve</button>
                              <button disabled={isProcessing} onClick={() => { setRejectReason(""); setRejectModal(p._id); }} className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 disabled:opacity-50">Reject</button>
                            </>
                          )}
                          <button
                            disabled={isProcessing}
                            onClick={() => toggleFeatured(p._id, !!p.featured, !!p.approved)}
                            className={`text-xs px-2 py-1 rounded border disabled:opacity-50 ${p.featured ? "bg-purple-600 text-white border-purple-600" : "bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100"}`}
                          >
                            {p.featured ? "Unfeature" : "Feature"}
                          </button>
                          <button disabled={isProcessing} onClick={() => setDeleteTarget(p._id)} className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 disabled:opacity-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Detail modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedProperty(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-xl font-bold text-gray-900 truncate">{selectedProperty.title}</h2>
              <button onClick={() => setSelectedProperty(null)} className="p-2 rounded-full hover:bg-gray-100">✕</button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div><span className="font-medium">City:</span> {selectedProperty.location?.city}</div>
                <div><span className="font-medium">Price:</span> ₹{selectedProperty.price?.toLocaleString()}</div>
                <div><span className="font-medium">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(selectedProperty)}`}>{statusLabel(selectedProperty)}</span></div>
                <div><span className="font-medium">Featured:</span> {selectedProperty.featured ? "Yes ⭐" : "No"}</div>
              </div>
              {selectedProperty.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{selectedProperty.description}</p>
                </div>
              )}
              {selectedProperty.images?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Images</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="h-20 rounded-lg object-cover border" loading="lazy" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
