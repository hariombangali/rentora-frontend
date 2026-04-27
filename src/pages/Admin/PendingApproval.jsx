import { useEffect, useState } from "react";
import API from "../../services/api";
import { toast } from "../../utils/toast";
import ConfirmModal from "../../components/ConfirmModal";
import Pagination from "../../components/Pagination";
import { Eye, Check, X, MapPin, IndianRupee, Inbox } from "lucide-react";

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
      if (Array.isArray(data)) setPending(data);
      else { setPending(data.properties || []); setTotalPages(data.pages || 1); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load pending properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(page); }, [page]);

  const setProcessing = (id, state) =>
    setProcessingIds((prev) => { const s = new Set(prev); state ? s.add(id) : s.delete(id); return s; });

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
      await API.post(`/admin/reject-property/${selectedProperty._id}`, { reason: rejectReason }, authHeader);
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
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-8">
        <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Moderation</p>
        <h1 className="font-display text-[36px] md:text-[42px] leading-tight mt-1 text-ink">Pending approvals</h1>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">Review new listings and approve or reject them.</p>
      </div>

      <ConfirmModal
        isOpen={!!confirmApprove}
        title="Approve property"
        message="This property will become visible to all users."
        confirmLabel="Approve"
        confirmClass="bg-ink hover:bg-accent"
        onConfirm={() => { approveProperty(confirmApprove); setConfirmApprove(null); }}
        onCancel={() => setConfirmApprove(null)}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-rule bg-card p-5 animate-pulse flex justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-2/3 rounded-full bg-[#e8e2d3]" />
                <div className="h-3 w-1/2 rounded-full bg-[#e8e2d3]" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 rounded-full bg-[#e8e2d3]" />
                <div className="h-9 w-20 rounded-full bg-[#e8e2d3]" />
                <div className="h-9 w-20 rounded-full bg-[#e8e2d3]" />
              </div>
            </div>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="rounded-3xl border border-rule bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-paper flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-5 h-5 text-[color:var(--muted)]" />
          </div>
          <h3 className="font-display text-[20px] text-ink">All caught up</h3>
          <p className="text-[13px] text-[color:var(--muted)] mt-1">No pending properties for approval.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {pending.map((p) => {
              const isProcessing = processingIds.has(p._id);
              return (
                <div key={p._id} className="rounded-3xl border border-rule bg-card p-5 flex flex-wrap justify-between items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-[16px] text-ink truncate">{p.title}</h3>
                    <div className="mt-1.5 flex items-center gap-3 text-[12px] text-[color:var(--muted)] flex-wrap">
                      <span>{p.ownerKYC?.ownerName || "N/A"}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {p.location?.city || "N/A"}</span>
                      <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> {p.price?.toLocaleString("en-IN") || "—"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => openModal(p)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-rule text-[13px] font-medium text-ink hover:border-ink transition">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => setConfirmApprove(p._id)}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> {isProcessing ? "Processing…" : "Approve"}
                    </button>
                    <button
                      onClick={() => { openModal(p); setShowRejectReason(true); }}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rule bg-card text-[13px] font-medium text-red-600 hover:border-red-600 transition disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
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
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={closeModal}>
          <div className="bg-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-rule flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Listing review</p>
                <h2 className="font-display text-[22px] text-ink mt-0.5 truncate">{selectedProperty.title}</h2>
              </div>
              <button onClick={closeModal} className="w-9 h-9 rounded-full hover:bg-paper flex items-center justify-center shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <Section title="Owner KYC">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-[13px]">
                  <Row k="Name" v={selectedProperty.ownerKYC?.ownerName} />
                  <Row k="Email" v={selectedProperty.ownerKYC?.ownerEmail} />
                  <Row k="Phone" v={selectedProperty.ownerKYC?.ownerPhone} />
                  <Row k="ID" v={`${selectedProperty.ownerKYC?.ownerIdType || ""} — ${selectedProperty.ownerKYC?.ownerIdNumber || ""}`} />
                </div>
              </Section>

              <Section title="Description">
                <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">{selectedProperty.description || "—"}</p>
              </Section>

              {selectedProperty.images?.length > 0 && (
                <Section title="Images">
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.images.map((img, i) => (
                      <img key={i} src={img} alt={`img-${i}`} className="h-20 w-28 rounded-xl object-cover border border-rule" loading="lazy" />
                    ))}
                  </div>
                </Section>
              )}

              {showRejectReason && (
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Rejection reason</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Write a reason for rejection…"
                    className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-rule flex justify-end gap-2">
              {showRejectReason ? (
                <>
                  <button
                    onClick={() => { setShowRejectReason(false); setRejectReason(""); }}
                    className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={rejectProperty}
                    disabled={processingIds.has(selectedProperty._id)}
                    className="inline-flex items-center px-5 py-2.5 rounded-full bg-red-600 text-paper text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {processingIds.has(selectedProperty._id) ? "Processing…" : "Confirm reject"}
                  </button>
                </>
              ) : (
                <button onClick={closeModal} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2">{title}</p>
      <div className="bg-paper border border-rule rounded-2xl p-4">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-2">
      <span className="text-[color:var(--muted)] w-16 shrink-0">{k}</span>
      <span className="text-ink truncate">{v || "—"}</span>
    </div>
  );
}
