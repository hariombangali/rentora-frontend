import { useEffect, useState } from "react";
import API from "../services/api"; // your axios instance
import PropertyCard from "../components/PropertyCard"; // reuse existing card UI

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  
useEffect(() => {
  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("token"); // AuthContext se bhi le sakte ho

      if (!token) {
        setError("User not logged in");
        setLoading(false);
        return;
      }

      const { data } = await API.get("/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWishlist(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  fetchWishlist();
}, []);

  if (loading) return <div className="text-center py-6">Loading...</div>;
  if (error) return <div className="text-center py-6 text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <p className="text-gray-600">No properties saved in your wishlist.</p>
      ) : (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {wishlist.map((property) => (
    <PropertyCard
      key={property._id}
      property={property}
      wishlistIds={wishlist.map((p) => p._id)}   // ✅ pass all IDs
    />
  ))}
</div>

      )}
    </div>
  );
}
