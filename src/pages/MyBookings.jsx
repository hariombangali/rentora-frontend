// src/pages/MyBookings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "N/A");

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/bookings/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleMessageOwner = async (booking) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/messages/conversations", {
        params: {
          propertyId: booking.property?._id,
          partnerId: booking.owner?._id,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      const conversation = res.data;
      navigate("/inbox", { state: { conversation } });
    } catch (err) {
      console.error(err);
      alert("Could not open chat with owner");
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm("Cancel this request?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(
        `/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = res.data;
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? updated : b)));
    } catch (err) {
      console.error(err);
      alert("Failed to cancel");
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const TypeBadge = ({ type }) => (
    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 border">{type}</span>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      {loading ? (
        <div>Loading...</div>
      ) : bookings.length === 0 ? (
        <div>No bookings yet</div>
      ) : (
        bookings.map((b) => (
          <div key={b._id} className="border p-4 rounded mb-3 bg-white">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">
                  {b.property?.title || "Property"}{" "}
                  <span className="ml-2">
                    <TypeBadge type={b.type} />
                  </span>
                </h3>
                <div className="text-sm text-gray-500">{b.property?.address}</div>

                <div className="mt-2 text-sm">
                  {b.type === "rental" ? (
                    <>
                      <div>Check-in: {formatDate(b.checkIn)}</div>
                      {b.checkOut && <div>Check-out: {formatDate(b.checkOut)}</div>}
                    </>
                  ) : b.type === "visit" ? (
                    <>
                      <div>Visit date: {formatDate(b.visitDate)}</div>
                      <div>Time slot: {b.visitSlot || "-"}</div>
                    </>
                  ) : (
                    <div>Enquiry sent</div>
                  )}
                </div>

                {b.priceQuoted && (
                  <div className="mt-1 text-sm text-gray-700">
                    Price: ₹{b.priceQuoted.toLocaleString("en-IN")}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="font-semibold capitalize">{statusLabel(b.status)}</div>
                <div className="text-xs text-gray-400">
                  {new Date(b.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {b.message && (
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{b.message}</div>
            )}

            <div className="mt-3 flex gap-2">
              {b.status === "pending" && (
                <button
                  onClick={() => handleCancel(b._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleMessageOwner(b)}
                className="px-3 py-1 bg-blue-500 text-white rounded"
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
