import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonGrid } from "../components/SkeletonCard";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "N/A");

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
  rescheduled: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
};

export default function OwnerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState(null); // { action, id, label, message }
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);

  // Reschedule modal state
  const [showReschedule, setShowReschedule] = useState(false);
  const [currentVisitId, setCurrentVisitId] = useState(null);
  const [resDate, setResDate] = useState("");
  const [resSlot, setResSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [resReason, setResReason] = useState("");

  const token = localStorage.getItem("token");
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    API.get("/bookings/owner", authHeader)
      .then((res) => setBookings(res.data || []))
      .catch(() => toast.error("Failed to load booking requests"))
      .finally(() => setLoading(false));
  }, []);

  const refreshOne = (updated) => setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));

  const approve = async (id) => {
    try {
      const res = await API.patch(`/bookings/${id}/approve`, {}, authHeader);
      refreshOne(res.data);
      toast.success("Booking approved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to approve");
    }
  };

  const openReject = (id) => { setRejectTargetId(id); setRejectReason(""); setShowRejectModal(true); };

  const submitReject = async () => {
    setShowRejectModal(false);
    try {
      const res = await API.patch(`/bookings/${rejectTargetId}/reject`, { reason: rejectReason }, authHeader);
      refreshOne(res.data);
      toast.success("Booking rejected");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reject");
    }
  };

  const cancel = async (id) => {
    setConfirmState(null);
    try {
      const res = await API.patch(`/bookings/${id}/cancel`, {}, authHeader);
      refreshOne(res.data);
      toast.success("Booking cancelled");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to cancel");
    }
  };

  const messageSeeker = async (b) => {
    try {
      const res = await API.get("/messages/conversations", {
        params: { propertyId: b.property?._id, partnerId: b.user?._id },
        ...authHeader,
      });
      navigate("/inbox", { state: { conversation: res.data } });
    } catch {
      toast.error("Could not open chat");
    }
  };

  const openReschedule = (b) => {
    setCurrentVisitId(b._id);
    setResDate(""); setResSlot(""); setResReason(""); setSlots([]);
    setShowReschedule(true);
  };

  const loadSlots = async (dateStr, propertyId) => {
    if (!dateStr) return;
    setLoadingSlots(true);
    try {
      const res = await API.get("/visits/availability", { params: { propertyId, date: dateStr } });
      setSlots(res.data?.slots || []);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); }
  };

  useEffect(() => {
    if (!showReschedule || !resDate || !currentVisitId) return;
    const b = bookings.find((x) => x._id === currentVisitId);
    if (b?.property?._id) loadSlots(resDate, b.property._id);
  }, [showReschedule, resDate, currentVisitId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReschedule = async () => {
    if (!currentVisitId || !resDate || !resSlot) return;
    setRescheduling(true);
    try {
      const res = await API.patch(`/bookings/${currentVisitId}/reschedule`, { date: resDate, slot: resSlot, reason: resReason }, authHeader);
      refreshOne(res.data);
      setShowReschedule(false);
      toast.success("Visit rescheduled");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reschedule");
    } finally { setRescheduling(false); }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-4"><SkeletonGrid count={3} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Booking Requests</h2>

      {/* Approve confirm */}
      <ConfirmModal
        isOpen={confirmState?.action === "approve"}
        title="Approve Booking"
        message="Approve this request? The seeker will be notified by email."
        confirmLabel="Approve"
        confirmClass="bg-green-600 hover:bg-green-700"
        onConfirm={() => { approve(confirmState.id); setConfirmState(null); }}
        onCancel={() => setConfirmState(null)}
      />

      {/* Cancel confirm */}
      <ConfirmModal
        isOpen={confirmState?.action === "cancel"}
        title="Cancel Booking"
        message="Cancel this booking request?"
        confirmLabel="Yes, Cancel"
        onConfirm={() => cancel(confirmState.id)}
        onCancel={() => setConfirmState(null)}
      />

      {/* Reject modal with reason */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowRejectModal(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reject Booking</h3>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-200 resize-none"
              rows={3}
              placeholder="Let the seeker know why…"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submitReject} className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700">Reject</button>
            </div>
          </div>
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No booking requests yet</p>
          <p className="text-sm mt-1">When tenants request your property, they'll appear here.</p>
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b._id} className="border border-gray-200 rounded-2xl p-5 mb-4 bg-white shadow-sm">
            <div className="flex justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {b.property?.title}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || "bg-gray-100"}`}>{b.status}</span>
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{b.type}</span>
                </h3>
                <div className="text-sm text-gray-500 mt-0.5">{b.user?.name} • {b.user?.email}</div>
                <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                  {b.type === "visit" && <><div>Visit: {formatDate(b.visitDate)} — {b.visitSlot || "-"}</div></>}
                  {b.type === "rental" && <><div>Check-in: {formatDate(b.checkIn)}</div>{b.checkOut && <div>Check-out: {formatDate(b.checkOut)}</div>}</>}
                  {b.type === "lead" && <div>Enquiry</div>}
                </div>
              </div>
              <div className="text-xs text-gray-400 text-right">{new Date(b.createdAt).toLocaleString("en-IN")}</div>
            </div>

            {b.message && <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{b.message}</div>}

            <div className="mt-4 flex gap-2 flex-wrap">
              {b.status === "pending" && (
                <>
                  <button onClick={() => setConfirmState({ action: "approve", id: b._id })} className="px-4 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-sm font-medium hover:bg-green-100">Approve</button>
                  <button onClick={() => openReject(b._id)} className="px-4 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100">Reject</button>
                </>
              )}
              {b.type === "visit" && !["cancelled", "completed"].includes(b.status) && (
                <button onClick={() => openReschedule(b)} className="px-4 py-1.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Reschedule</button>
              )}
              {!["cancelled", "completed"].includes(b.status) && (
                <button onClick={() => setConfirmState({ action: "cancel", id: b._id })} className="px-4 py-1.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Cancel</button>
              )}
              <button onClick={() => messageSeeker(b)} className="px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium hover:bg-blue-100">Message</button>
            </div>
          </div>
        ))
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center px-4" onClick={() => setShowReschedule(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Reschedule Visit</h3>

            <label className="block text-sm font-medium mb-1">New date</label>
            <input
              type="date"
              value={resDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setResDate(e.target.value)}
              className="w-full border rounded-xl p-2 mb-4"
            />

            <label className="block text-sm font-medium mb-1">Available time slots</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {loadingSlots ? (
                <span className="text-sm text-gray-500">Loading…</span>
              ) : slots.length ? (
                slots.map((s) => (
                  <button key={s.id || s.time} disabled={s.full} onClick={() => setResSlot(s.time)}
                    className={`px-3 py-1 rounded-xl border text-sm ${resSlot === s.time ? "bg-blue-600 text-white border-blue-600" : "bg-white"} ${s.full ? "opacity-40 cursor-not-allowed" : ""}`}>
                    {s.time}
                  </button>
                ))
              ) : (
                <span className="text-sm text-gray-500">Select a date above</span>
              )}
            </div>

            <label className="block text-sm font-medium mb-1">Reason (optional)</label>
            <input type="text" value={resReason} onChange={(e) => setResReason(e.target.value)}
              className="w-full border rounded-xl p-2 mb-4" placeholder="Reason for reschedule" />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReschedule(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm">Close</button>
              <button onClick={submitReschedule} disabled={rescheduling || !resDate || !resSlot}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-50">
                {rescheduling ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
