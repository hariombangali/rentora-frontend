import { Link } from "react-router-dom";
import API from "../services/api";
import { BedDouble, Bath, Armchair, Heart } from "lucide-react";
import { useState, useEffect } from "react";

// Helper function to format the date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function PropertyCard({ property, wishlistIds = [] }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Sync state with wishlistIds prop
  useEffect(() => {
    if (wishlistIds.includes(property._id)) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [wishlistIds, property._id]);

  const toggleSave = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("token"); // or from AuthContext
      if (!token) {
        console.error("User not logged in");
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (!isSaved) {
        await API.post(`/wishlist/${property._id}`, {}, config);
        setIsSaved(true);
      } else {
        await API.delete(`/wishlist/${property._id}`, config);
        setIsSaved(false);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    } finally {
      setLoading(false);
    }
  };

  // Construct the image URL safely
// Construct the image URL safely
const firstImage =
  property.images && property.images.length > 0
    ? property.images[0] // Cloudinary URL
    : "/default-property.jpg";


  // Combine amenities
  const allAmenities = [
    ...(property.commonAreaFacilities || []),
    ...(property.pgAmenities || []),
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full border border-gray-100 overflow-hidden">
      {/* Image and Save Button */}
      <div className="relative">
        <img
          src={firstImage}
          alt={property.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
          ₹{property.price.toLocaleString("en-IN")}
          <span className="font-normal text-xs">/mo</span>
        </div>

        <button
          onClick={toggleSave}
          className="absolute top-3 left-3 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition"
          disabled={loading}
        >
          {isSaved ? (
            <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
          ) : (
            <Heart className="w-5 h-5 text-gray-500" fill="none" />
          )}

        </button>

      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Tenant Preference Tags */}
        <div className="flex justify-between items-center mb-2">
          <span className="inline-block bg-sky-100 text-sky-800 rounded-full px-3 py-1 text-xs font-semibold">
            For {property.availableFor}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            Prefers: {property.preferredTenants}
          </span>
        </div>

        {/* Title and Location */}
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
          {property.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          <span role="img" aria-label="location-pin">
            📍
          </span>{" "}
          {property.locality}, {property.city}
        </p>

        {/* Key Features */}
        <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-gray-100 py-3 my-2">
          <div className="flex flex-col items-center">
            <BedDouble className="w-5 h-5 text-blue-500 mb-1" />
            <span className="text-xs font-semibold text-gray-700">
              {property.bedrooms} BHK
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Armchair className="w-5 h-5 text-green-500 mb-1" />
            <span className="text-xs font-semibold text-gray-700">
              {property.furnishing}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <Bath className="w-5 h-5 text-red-500 mb-1" />
            <span className="text-xs font-semibold text-gray-700">
              {property.attachedBathroom === "Yes"
                ? "Private Bath"
                : "Shared Bath"}
            </span>
          </div>
        </div>

        {/* Amenities */}
        {allAmenities.length > 0 && (
          <div className="my-2">
            <p className="text-xs text-gray-500 line-clamp-2">
              <span className="font-semibold text-gray-700">Includes:</span>{" "}
              {allAmenities.join(", ")}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex justify-between items-center pt-2">
          <span className="text-xs text-gray-500">
            Available: <strong>{formatDate(property.availableFrom)}</strong>
          </span>
          <Link
            to={`/properties/${property._id}`}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
