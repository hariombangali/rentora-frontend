import { useEffect, useState } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MyProperties() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchMyProperties = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await API.get("/properties/my-properties", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProperties(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load properties");
      } finally {
        setLoading(false);
      }
    };
    fetchMyProperties();
  }, [user]);

  if (loading) return <p className="text-center mt-10">Loading your properties...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  if (!properties || properties.length === 0)
    return <p className="text-center mt-10 text-gray-700">You have not posted any properties yet.</p>;

  function getStatus(p) {
    if (p.approved) return <span className="text-green-600 font-bold">Approved</span>;
    if (p.rejected) return <span className="text-red-600 font-bold">Rejected</span>;
    return <span className="text-orange-600 font-bold">Pending</span>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h2 className="text-3xl font-bold mb-6">My Properties</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((p) => (
          <div key={p._id} className="border rounded-lg p-4 shadow-md flex flex-col">
            <img
              src={
                p.images && p.images.length > 0
                  ? `${API.defaults.baseURL.replace("/api", "")}/uploads/${p.images[0]}`
                  : "/default-property.jpg"
              }
              alt={p.title}
              className="rounded-lg w-full h-48 object-cover mb-4"
            />
            <h3 className="font-semibold text-xl">{p.title}</h3>
            <p className="text-gray-600 mb-2">{p.type} | ₹{p.price}/month</p>
            <p>Status: {getStatus(p)}</p>
            {p.rejected && (
              <div className="bg-red-50 text-red-700 rounded px-3 py-2 mt-2">
                <b>Rejection Reason:</b>{" "}
                {p.rejectionReason && p.rejectionReason.trim() !== ""
                  ? p.rejectionReason
                  : <span className="italic text-gray-400">No reason specified</span>}
              </div>
            )}
            <Link
              to={`/properties/${p._id}`}
              className="mt-auto inline-block mt-4 w-fit px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
