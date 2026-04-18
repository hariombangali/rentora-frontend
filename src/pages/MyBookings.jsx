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

const STEPS = ["Requested", "Reviewed", "Resolved"];

function StatusTimeline({ status }) {
  const activeStep = ["pending"].includes(status) ? 0 : ["approved", "rejected", "rescheduled"].includes(status) ? 1 : 2;
  return (
    <div className="flex items-center gap-2 mt-3">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= activeStep ? "text-blue-600" : "text-gray-400"}`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${i <= activeStep ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i + 1}</span>
            {label}
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < activeStep ? "bg-blue-600" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBookings(res.data || []))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  const handleMessageOwner = async (booking) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/messages/conversations", {
        params: { propertyId: booking.property?._id, partnerId: booking.owner?._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/inbox", { state: { conversation: res.data } });
    } catch {
      toast.error("Could not open chat with owner");
    }
  };

  const handleCancel = async () => {
    const bookingId = cancelTarget;
    setCancelTarget(null);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(`/bookings/${bookingId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data : b)));
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-4"><SkeletonGrid count={3} /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">My Bookings</h2>

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Cancel Booking"
        message="Are you sure you want to cancel this request?"
        confirmLabel="Yes, Cancel"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      {bookings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No bookings yet</p>
          <p className="text-sm mt-1">Browse properties and send a visit or rental request.</p>
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b._id} className="border border-gray-200 rounded-2xl p-5 mb-4 bg-white shadow-sm">
            <div className="flex justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {b.property?.title || "Property"}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-600"}`}>
                    {b.status}
                  </span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{b.type}</span>
                </h3>

                <div className="mt-2 text-sm text-gray-600 space-y-0.5">
                  {b.type === "rental" ? (
                    <>
                      <div>Check-in: {formatDate(b.checkIn)}</div>
                      {b.checkOut && <div>Check-out: {formatDate(b.checkOut)}</div>}
                    </>
                  ) : b.type === "visit" ? (
                    <>
                      <div>Visit: {formatDate(b.visitDate)} — {b.visitSlot || "-"}</div>
                      {b.status === "rescheduled" && b.reschedule && (
                        <div className="text-blue-700 font-medium">
                          Rescheduled to: {formatDate(b.reschedule.date)} — {b.reschedule.slot}
                        </div>
                      )}
                    </>
                  ) : (
                    <div>Enquiry sent</div>
                  )}
                  {b.priceQuoted && <div>Quoted: ₹{b.priceQuoted.toLocaleString("en-IN")}</div>}
                </div>
              </div>

              <div className="text-right text-xs text-gray-400">
                {new Date(b.createdAt).toLocaleString("en-IN")}
              </div>
            </div>

            <StatusTimeline status={b.status} />

            {b.message && (
              <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">{b.message}</div>
            )}

            <div className="mt-4 flex gap-2 flex-wrap">
              {b.status === "pending" && (
                <button
                  onClick={() => setCancelTarget(b._id)}
                  className="px-4 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleMessageOwner(b)}
                className="px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium hover:bg-blue-100"
              >
                Message Owner
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
