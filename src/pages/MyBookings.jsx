// src/pages/MyBookings.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

  const handleMessageOwner = async (booking) => {
    try {
      const token = localStorage.getItem("token");

      // ✅ Ensure conversation (same pattern as Inbox.jsx expects)
      const res = await API.get(
        "/messages/conversations",
        {
          propertyId: booking.property?._id,
          partnerId: booking.owner?._id || booking.property?.owner?._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const conversation = res.data;

      // ✅ Navigate to inbox with conversation object
      navigate("/inbox", { state: { conversation } });
    } catch (err) {
      console.error("Failed to start conversation", err);
      alert("Could not open chat with owner");
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm("Cancel request?")) return;
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(
        bookings.map((x) =>
          x._id === bookingId ? { ...x, status: "cancelled" } : x
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

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
                <h3 className="font-semibold">{b.property?.title || "Property"}</h3>
                <div className="text-sm text-gray-500">{b.property?.address}</div>
                <div className="mt-2 text-sm">
                  Check-in: {new Date(b.checkIn).toLocaleDateString()}
                </div>
                {b.checkOut && (
                  <div className="text-sm">
                    Check-out: {new Date(b.checkOut).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-semibold capitalize">{b.status}</div>
                <div className="text-xs text-gray-400">
                  {new Date(b.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            {b.message && (
              <div className="mt-3 text-sm text-gray-700">{b.message}</div>
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
