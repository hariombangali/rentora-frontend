import { Link } from "react-router-dom";
import API from "../services/api";
import { BedDouble, Bath, Armchair, Heart, MapPin } from "lucide-react";
import { useState, useEffect } from "react";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function PropertyCard({ property, wishlistIds = [] }) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSaved(wishlistIds.includes(property._id));
  }, [wishlistIds, property._id]);

  const toggleSave = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const config = { headers: { Authorization: `Bearer ${token}` } };
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

  const firstImage =
    property.images?.length > 0 ? property.images[0] : "/default-property.jpg";

  const allAmenities = [
    ...(property.commonAreaFacilities || []),
    ...(property.pgAmenities || []),
  ];

  return (
    <div className="bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col h-full overflow-hidden group">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={firstImage}
          alt={property.title}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 bg-ink/80 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1 rounded-full">
          ₹{property.price.toLocaleString("en-IN")}
          <span className="font-normal text-white/70 text-xs">/mo</span>
        </div>

        {/* Save button */}
        <button
          onClick={toggleSave}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-soft hover:bg-white transition disabled:opacity-60"
          disabled={loading}
          aria-label={isSaved ? "Remove from saved" : "Save property"}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${isSaved ? "text-red-500 fill-red-500" : "text-ink/50"}`}
          />
        </button>

        {/* Type badge */}
        <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-sm text-white text-[11px] font-eyebrow px-2.5 py-1 rounded-full">
          {property.availableFor}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Title + location */}
        <h3 className="font-display font-semibold text-ink text-base leading-snug line-clamp-1 mb-1">
          {property.title}
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {property.locality}, {property.city}
        </p>

        {/* Features */}
        <div className="flex items-center gap-3 py-3 border-t border-b border-rule text-xs text-ink/70 mb-3">
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5 text-accent" />
            {property.bedrooms} BHK
          </span>
          <span className="w-px h-3 bg-rule" />
          <span className="flex items-center gap-1">
            <Armchair className="w-3.5 h-3.5 text-sage" />
            {property.furnishing}
          </span>
          <span className="w-px h-3 bg-rule" />
          <span className="flex items-center gap-1">
            <Bath className="w-3.5 h-3.5 text-accent/70" />
            {property.attachedBathroom === "Yes" ? "Private" : "Shared"}
          </span>
        </div>

        {/* Amenities */}
        {allAmenities.length > 0 && (
          <p className="text-xs text-muted line-clamp-1 mb-3">
            {allAmenities.slice(0, 4).join(" · ")}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted font-mono">
            From {formatDate(property.availableFrom)}
          </span>
          <Link
            to={`/properties/${property._id}`}
            className="px-4 py-1.5 rounded-full bg-ink text-paper text-xs font-semibold hover:bg-accent transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
