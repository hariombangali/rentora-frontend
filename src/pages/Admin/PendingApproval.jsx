import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";

export default function PendingApproval() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchPending = async (p = 1) => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/pending-properties?page=${p}&limit=10`, authHeader);
      const data = res.data;
      if (Array.isArray(data)) {
        setPending(data);
      } else {
        setPending(data.properties || []);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load pending properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(page); }, [page]);

  const setProcessing = (id, state) =>
    setProcessingIds((prev) => {
      const s = new Set(prev);
      state ? s.add(id) : s.delete(id);
      return s;
    });

  const approveProperty = async (propertyId) => {
    setProcessing(propertyId, true);
    try {
      await API.put(`/admin/approve-property/${propertyId}`, {}, authHeader);
      setPending((prev) => prev.filter((p) => p._id !== propertyId));
      closeModal();
      toast.success("Property approved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve property");
    } finally {
      setProcessing(propertyId, false);
    }
  };

  const rejectProperty = async () => {
    if (!rejectReason.trim()) { toast.error("Please enter a reason for rejection."); return; }
    if (!selectedProperty) return;
    setProcessing(selectedProperty._id, true);
    try {
      await API.post(
        `/admin/reject-property/${selectedProperty._id}`,
        { reason: rejectReason },
        authHeader
      );
      setPending((prev) => prev.filter((p) => p._id !== selectedProperty._id));
      closeModal();
      toast.success("Property rejected");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject property");
    } finally {
      setProcessing(selectedProperty._id, false);
      setRejectReason("");
      setShowRejectReason(false);
    }
  };

  const openModal = (property) => { setSelectedProperty(property); setRejectReason(""); setShowRejectReason(false); };
  const closeModal = () => { setSelectedProperty(null); setRejectReason(""); setShowRejectReason(false); };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Property Approvals</h1>

      <ConfirmModal
        isOpen={!!confirmApprove}
        title="Approve Property"
        message="Approve this property? It will become visible to all users."
        confirmLabel="Approve"
        confirmClass="bg-green-600 hover:bg-green-700"
        onConfirm={() => { approveProperty(confirmApprove); setConfirmApprove(null); }}
        onCancel={() => setConfirmApprove(null)}
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse h-16 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No pending properties for approval</div>
      ) : (
        <>
          <div className="space-y-3">
            {pending.map((p) => {
              const isProcessing = processingIds.has(p._id);
              return (
                <div key={p._id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <p className="text-sm text-gray-500">
                      {p.ownerKYC?.ownerName || "N/A"} · {p.location?.city || "N/A"} · ₹{p.price}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openModal(p)} className="px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-gray-50">
                      View Details
                    </button>
                    <button
                      onClick={() => setConfirmApprove(p._id)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100 disabled:opacity-50"
                    >
                      {isProcessing ? "Processing…" : "Approve"}
                    </button>
                    <button
                      onClick={() => { openModal(p); setShowRejectReason(true); }}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {/* Detail / reject modal */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedProperty.title}</h2>

            <section className="mb-5">
              <h3 className="font-semibold text-gray-700 mb-2">Owner KYC</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div><span className="font-medium">Name:</span> {selectedProperty.ownerKYC?.ownerName}</div>
                <div><span className="font-medium">Email:</span> {selectedProperty.ownerKYC?.ownerEmail}</div>
                <div><span className="font-medium">Phone:</span> {selectedProperty.ownerKYC?.ownerPhone}</div>
                <div><span className="font-medium">ID:</span> {selectedProperty.ownerKYC?.ownerIdType} — {selectedProperty.ownerKYC?.ownerIdNumber}</div>
              </div>
            </section>

            <section className="mb-5">
              <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">{selectedProperty.description}</p>
            </section>

            {selectedProperty.images?.length > 0 && (
              <section className="mb-5">
                <h3 className="font-semibold text-gray-700 mb-2">Images</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.images.map((img, i) => (
                    <img key={i} src={img} alt={`img-${i}`} className="h-20 rounded-lg object-cover border" loading="lazy" />
                  ))}
                </div>
              </section>
            )}

            {showRejectReason && (
              <section className="mb-4">
                <h3 className="font-semibold text-gray-700 mb-2">Rejection Reason</h3>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Write reason for rejection…"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-200 resize-none"
                />
                <div className="mt-3 flex gap-2 justify-end">
                  <button onClick={() => { setShowRejectReason(false); setRejectReason(""); }} className="px-4 py-2 rounded-xl border text-sm">Cancel</button>
                  <button
                    onClick={rejectProperty}
                    disabled={processingIds.has(selectedProperty._id)}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
                  >
                    {processingIds.has(selectedProperty._id) ? "Processing…" : "Confirm Reject"}
                  </button>
                </div>
              </section>
            )}

            {!showRejectReason && (
              <button onClick={closeModal} className="mt-2 px-4 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50">
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
