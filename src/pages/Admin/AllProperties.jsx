import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import { Search, X, Eye, Check, Star, Trash2, Inbox } from "lucide-react";

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
      if (Array.isArray(data)) setProperties(data);
      else { setProperties(data.properties || []); setTotalPages(data.pages || 1); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProps(page); }, [page, statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProps(1); };

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
    } finally { setProcessing(id, false); }
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
    } finally { setProcessing(id, false); setRejectReason(""); }
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
    } finally { setProcessing(id, false); }
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
    } finally { setProcessing(id, false); }
  };

  const statusBadge = (p) => {
    if (p.approved) return <span className="inline-flex items-center rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-[11px] font-medium text-[#2e7d32]">Approved</span>;
    if (p.rejected) return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">Rejected</span>;
    return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">Pending</span>;
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-8">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Inventory</p>
        <h1 className="font-display text-[36px] md:text-[42px] leading-tight mt-1 text-ink">All properties</h1>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">Search, filter, and manage every listing.</p>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete property"
        message="This will permanently delete the property. Continue?"
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => deleteProperty(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setRejectModal(null)}>
          <div className="bg-card rounded-3xl w-full max-w-md p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[22px]">Reject property</h3>
              <button onClick={() => setRejectModal(null)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Reason</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection…"
              className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setRejectModal(null)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">Cancel</button>
              <button onClick={submitReject} className="inline-flex items-center px-5 py-2.5 rounded-full bg-red-600 text-paper text-sm font-medium hover:bg-red-700 transition">Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2.5 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or owner…"
            className="w-full rounded-xl border border-rule bg-card py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-ink transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-rule bg-card px-3 py-2.5 text-sm focus:outline-none focus:border-ink transition"
        >
          <option value="">All statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <button type="submit" className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition">Search</button>
      </form>

      {loading ? (
        <div className="rounded-3xl border border-rule bg-card overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`px-5 py-4 flex items-center gap-4 animate-pulse ${i !== 7 ? "border-b border-rule" : ""}`}>
              <div className="h-4 w-1/4 rounded-full bg-[#e8e2d3]" />
              <div className="h-4 w-1/5 rounded-full bg-[#e8e2d3]" />
              <div className="h-5 w-16 rounded-full bg-[#e8e2d3]" />
              <div className="h-4 w-20 rounded-full bg-[#e8e2d3]" />
              <div className="h-4 w-16 rounded-full bg-[#e8e2d3]" />
              <div className="h-4 w-20 rounded-full bg-[#e8e2d3] ml-auto" />
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded-3xl border border-rule bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-5 h-5 text-[color:var(--muted)]" />
          </div>
          <h3 className="font-display text-[20px] text-ink">No properties found</h3>
          <p className="text-[13px] text-[color:var(--muted)] mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-3xl border border-rule bg-card">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-rule">
                <tr>
                  {["Title", "Owner", "Status", "City", "Price", "Featured", "Created", "Actions"].map((h) => (
                    <th key={h} className="py-3 px-4 text-left font-eyebrow text-[10px] text-[color:var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {properties.map((p) => {
                  const isProcessing = processingIds.has(p._id);
                  return (
                    <tr key={p._id} className="hover:bg-paper/60 transition">
                      <td className="py-3 px-4 font-medium text-ink max-w-[180px] truncate">{p.title}</td>
                      <td className="py-3 px-4 text-[color:var(--muted)]">{p.ownerKYC?.ownerName || "N/A"}</td>
                      <td className="py-3 px-4">{statusBadge(p)}</td>
                      <td className="py-3 px-4 text-[color:var(--muted)]">{p.location?.city || "N/A"}</td>
                      <td className="py-3 px-4 text-ink">₹{p.price?.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-center">{p.featured ? <Star className="w-3.5 h-3.5 text-accent fill-accent inline" /> : <span className="text-[color:var(--muted)]">—</span>}</td>
                      <td className="py-3 px-4 text-[color:var(--muted)] text-[12px] whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          <button onClick={() => setSelectedProperty(p)} title="View" className="w-8 h-8 rounded-full bg-card border border-rule hover:border-ink flex items-center justify-center transition">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!p.approved && !p.rejected && (
                            <>
                              <button disabled={isProcessing} onClick={() => approveProperty(p._id)} title="Approve" className="w-8 h-8 rounded-full bg-ink text-paper hover:bg-accent flex items-center justify-center transition disabled:opacity-50">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button disabled={isProcessing} onClick={() => { setRejectReason(""); setRejectModal(p._id); }} title="Reject" className="w-8 h-8 rounded-full bg-card border border-rule hover:border-red-600 hover:text-red-600 flex items-center justify-center transition disabled:opacity-50">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            disabled={isProcessing}
                            onClick={() => toggleFeatured(p._id, !!p.featured, !!p.approved)}
                            title={p.featured ? "Unfeature" : "Feature"}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition disabled:opacity-50 ${p.featured ? "bg-accent text-paper" : "bg-card border border-rule hover:border-ink"}`}
                          >
                            <Star className={`w-3.5 h-3.5 ${p.featured ? "fill-current" : ""}`} />
                          </button>
                          <button disabled={isProcessing} onClick={() => setDeleteTarget(p._id)} title="Delete" className="w-8 h-8 rounded-full bg-card border border-rule hover:border-red-600 hover:text-red-600 flex items-center justify-center transition disabled:opacity-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setSelectedProperty(null)}>
          <div className="bg-card rounded-3xl shadow-card-hover max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-rule">
              <div className="min-w-0">
                <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Property detail</p>
                <h2 className="font-display text-[22px] text-ink truncate mt-0.5">{selectedProperty.title}</h2>
              </div>
              <button onClick={() => setSelectedProperty(null)} className="w-9 h-9 rounded-full hover:bg-paper flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                <div><span className="text-[color:var(--muted)]">City:</span> <span className="text-ink">{selectedProperty.location?.city}</span></div>
                <div><span className="text-[color:var(--muted)]">Price:</span> <span className="text-ink">₹{selectedProperty.price?.toLocaleString("en-IN")}</span></div>
                <div className="flex items-center gap-2"><span className="text-[color:var(--muted)]">Status:</span> {statusBadge(selectedProperty)}</div>
                <div><span className="text-[color:var(--muted)]">Featured:</span> <span className="text-ink">{selectedProperty.featured ? "Yes" : "No"}</span></div>
              </div>
              {selectedProperty.description && (
                <div>
                  <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2">Description</p>
                  <p className="text-[13px] text-ink whitespace-pre-line leading-relaxed">{selectedProperty.description}</p>
                </div>
              )}
              {selectedProperty.images?.length > 0 && (
                <div>
                  <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2">Images</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.images.map((img, i) => (
                      <img key={i} src={img} alt="" className="h-24 w-32 rounded-xl object-cover border border-rule" loading="lazy" />
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
