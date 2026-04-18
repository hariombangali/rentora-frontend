import { useEffect, useState } from "react";
import API from "../services/api";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import { SkeletonGrid } from "../components/SkeletonCard";

export default function Wishlist() {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setError("Please log in to view your wishlist");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    API.get("/wishlist", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setWishlist(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load wishlist"))
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-6"><SkeletonGrid count={6} /></div>;

  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="text-center py-16 text-red-500">{error}</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">No saved properties</p>
          <p className="text-sm mt-1">Browse properties and click the heart icon to save them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((property) => (
            <PropertyCard
              key={property._id}
              property={property}
              wishlistIds={wishlist.map((p) => p._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
