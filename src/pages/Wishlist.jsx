import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import PropertyCard from "../components/PropertyCard";
import { useAuth } from "../context/AuthContext";
import { SkeletonGrid } from "../components/SkeletonCard";
import { FaHeart } from "react-icons/fa";

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

  if (loading)
    return (
      <div className="bg-paper min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <SkeletonGrid count={6} />
        </div>
      </div>
    );

  if (error)
    return (
      <div className="bg-paper min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <p className="font-eyebrow text-muted mb-2">Your collection</p>
          <h1 className="font-display text-3xl text-ink">Saved Properties</h1>
        </div>

        {wishlist.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-accent-soft flex items-center justify-center mb-5">
              <FaHeart className="text-accent text-2xl" />
            </div>
            <h2 className="font-display text-xl text-ink mb-2">Nothing saved yet</h2>
            <p className="text-muted text-sm max-w-xs mb-6">
              Browse properties and tap the heart icon to save your favourites here.
            </p>
            <Link to="/properties" className="btn-accent">
              Browse Properties
            </Link>
          </div>
        ) : (
          <>
            <p className="font-eyebrow text-muted mb-5">
              {wishlist.length} {wishlist.length === 1 ? "property" : "properties"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((property) => (
                <PropertyCard
                  key={property._id}
                  property={property}
                  wishlistIds={wishlist.map((p) => p._id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
