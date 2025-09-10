// src/pages/OwnerBookings.jsx
import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function OwnerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get("/bookings/owner", { headers: { Authorization: `Bearer ${token}` } });
        setBookings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const approve = async (id) => {
    if(!confirm("Approve this booking?")) return;
    const token = localStorage.getItem("token");
    const res = await API.put(`/bookings/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
    setBookings(bookings.map(b => b._id === id ? res.data : b));
  };

  const reject = async (id) => {
    const reason = prompt("Reason for rejection (optional)");
    const token = localStorage.getItem("token");
    const res = await API.put(`/bookings/${id}/reject`, { reason }, { headers: { Authorization: `Bearer ${token}` } });
    setBookings(bookings.map(b => b._id === id ? res.data : b));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Booking Requests</h2>
      {loading ? <div>Loading...</div> :
        bookings.length === 0 ? <div>No booking requests</div> :
        bookings.map(b => (
          <div key={b._id} className="border p-4 rounded mb-3 bg-white">
            <div className="flex justify-between">
              <div>
                <h3 className="font-semibold">{b.property?.title}</h3>
                <div className="text-sm text-gray-500">{b.user?.name} • {b.user?.email}</div>
                <div className="mt-2 text-sm">Check-in: {new Date(b.checkIn).toLocaleDateString()}</div>
                {b.checkOut && <div className="text-sm">Check-out: {new Date(b.checkOut).toLocaleDateString()}</div>}
              </div>
              <div className="text-right">
                <div className="font-semibold">{b.status}</div>
                <div className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-700">{b.message}</div>
            <div className="mt-3 flex gap-2">
              {b.status === "pending" && (
                <>
                  <button onClick={() => approve(b._id)} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                  <button onClick={() => reject(b._id)} className="px-3 py-1 bg-red-500 text-white rounded">Reject</button>
                </>
              )}
              <button onClick={() => {/* open chat */}} className="px-3 py-1 bg-blue-500 text-white rounded">Message</button>
            </div>
          </div>
        ))
      }
    </div>
  );
}
