// src/pages/OwnerBookings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

export default function OwnerBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reschedule modal state (for visit)
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
    const fetch = async () => {
      try {
        const res = await API.get("/bookings/owner", authHeader);
        setBookings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const refreshOne = (updated) => {
    setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
  };

  const approve = async (id) => {
    if (!confirm("Approve this request?")) return;
    try {
      const res = await API.patch(`/bookings/${id}/approve`, {}, authHeader);
      refreshOne(res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to approve");
    }
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection (optional)") || "";
    try {
      const res = await API.patch(`/bookings/${id}/reject`, { reason }, authHeader);
      refreshOne(res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reject");
    }
  };

  const cancel = async (id) => {
    if (!confirm("Cancel this request?")) return;
    try {
      const res = await API.patch(`/bookings/${id}/cancel`, {}, authHeader);
      refreshOne(res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to cancel");
    }
  };

  // Open chat with seeker for this property
  const messageSeeker = async (b) => {
    try {
      const res = await API.get("/messages/conversations", {
        params: { propertyId: b.property?._id, partnerId: b.user?._id },
        ...authHeader,
      });
      navigate("/inbox", { state: { conversation: res.data } });
    } catch (e) {
      alert("Could not open chat");
    }
  };

  // Reschedule flow (visit only)
  const openReschedule = (b) => {
    setCurrentVisitId(b._id);
    setResDate("");
    setResSlot("");
    setResReason("");
    setSlots([]);
    setShowReschedule(true);
  };

  const loadSlots = async (dateStr, propertyId) => {
    if (!dateStr) return;
    try {
      setLoadingSlots(true);
      const res = await API.get("/visits/availability", {
        params: { propertyId, date: dateStr },
      });
      setSlots(res.data?.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (!showReschedule || !resDate || !currentVisitId) return;
    const b = bookings.find((x) => x._id === currentVisitId);
    if (b?.property?._id) loadSlots(resDate, b.property._id);
  }, [showReschedule, resDate, currentVisitId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReschedule = async () => {
    if (!currentVisitId || !resDate || !resSlot) return;
    try {
      setRescheduling(true);
      const res = await API.patch(
        `/bookings/${currentVisitId}/reschedule`,
        { date: resDate, slot: resSlot, reason: resReason },
        authHeader
      );
      refreshOne(res.data);
      setShowReschedule(false);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to reschedule");
    } finally {
      setRescheduling(false);
    }
  };

  const TypeBadge = ({ type }) => (
    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 border">{type}</span>
  );

  const StatusBadge = ({ status }) => (
    <span className="px-2 py-0.5 rounded text-xs border capitalize">
      {status}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Booking Requests</h2>

      {loading ? (
        <div>Loading...</div>
      ) : bookings.length === 0 ? (
        <div>No booking requests</div>
      ) : (
        bookings.map((b) => (
          <div key={b._id} className="border p-4 rounded mb-3 bg-white">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">
                  {b.property?.title} <span className="ml-2"><TypeBadge type={b.type} /></span>
                </h3>
                <div className="text-sm text-gray-500">
                  {b.user?.name} • {b.user?.email}
                </div>

                {/* Details by type */}
                <div className="mt-2 text-sm">
                  {b.type === "visit" && (
                    <>
                      <div>Visit date: {formatDate(b.visitDate)}</div>
                      <div>Time slot: {b.visitSlot || "-"}</div>
                    </>
                  )}
                  {b.type === "rental" && (
                    <>
                      <div>Check-in: {formatDate(b.checkIn)}</div>
                      {b.checkOut && <div>Check-out: {formatDate(b.checkOut)}</div>}
                    </>
                  )}
                  {b.type === "lead" && (
                    <div>Enquiry received</div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold"><StatusBadge status={b.status} /></div>
                <div className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString()}</div>
              </div>
            </div>

            {b.message && <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{b.message}</div>}

            <div className="mt-3 flex gap-2 flex-wrap">
              {/* Primary actions by type and status */}
              {b.status === "pending" && (
                <>
                  <button onClick={() => approve(b._id)} className="px-3 py-1 bg-green-600 text-white rounded">
                    Approve
                  </button>
                  <button onClick={() => reject(b._id)} className="px-3 py-1 bg-red-500 text-white rounded">
                    Reject
                  </button>
                </>
              )}

              {/* Visit-specific owner tools */}
              {b.type === "visit" && b.status !== "cancelled" && (
                <button onClick={() => openReschedule(b)} className="px-3 py-1 border rounded">
                  Reschedule
                </button>
              )}

              {/* Cancel option */}
              {b.status !== "cancelled" && (
                <button onClick={() => cancel(b._id)} className="px-3 py-1 border rounded">
                  Cancel
                </button>
              )}

              <button onClick={() => messageSeeker(b)} className="px-3 py-1 bg-blue-500 text-white rounded">
                Message
              </button>
            </div>
          </div>
        ))
      )}

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center">
          <div className="bg-white w-full max-w-md rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-3">Reschedule Visit</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium">New date</label>
              <input
                type="date"
                value={resDate}
                onChange={(e) => setResDate(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Available time slots</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {loadingSlots ? (
                  <span className="text-sm text-gray-500">Loading slots…</span>
                ) : slots.length ? (
                  slots.map((s) => (
                    <button
                      key={s.id || s.time}
                      disabled={s.full}
                      onClick={() => setResSlot(s.time)}
                      className={`px-3 py-1 rounded border ${resSlot === s.time ? "bg-blue-600 text-white" : "bg-white"} ${s.full ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {s.time}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Select a date to view slots</span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Reason (optional)</label>
              <input
                type="text"
                value={resReason}
                onChange={(e) => setResReason(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Reason for reschedule"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowReschedule(false)} className="px-4 py-2 rounded bg-gray-200">Close</button>
              <button
                onClick={submitReschedule}
                disabled={rescheduling || !resDate || !resSlot}
                className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
              >
                {rescheduling ? "Rescheduling…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
