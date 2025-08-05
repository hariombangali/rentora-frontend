import { Link } from "react-router-dom";
import API from "../services/api";

export default function PropertyCard({ property }) {
  // Use the first image from array or a placeholder if empty
const firstImage =
  property.images && property.images.length > 0
    ? `${API.defaults.baseURL.replace('/api', '')}/uploads/${property.images[0]}`
    : "/default-property.jpg";


  return (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition p-4 flex flex-col h-full border border-blue-100">
      <img
        src={firstImage}
        alt={property.title}
        className="rounded-xl w-full h-48 object-cover mb-4"
        loading="lazy"
      />
      <h3 className="font-semibold text-lg text-blue-900 mb-1 line-clamp-1">{property.title}</h3>
      <span className="inline-block bg-yellow-100 text-yellow-700 rounded px-2 py-1 text-xs font-medium mb-2 uppercase">
        {property.type}
      </span>
      <div className="flex flex-wrap gap-2 mb-2 text-gray-600 text-sm">
        <span>📍 {property.location?.locality || property.location?.city || "Location"}</span>
        <span>₹{property.price}/mo</span>
      </div>
      <div className="mt-auto flex justify-between items-end">
        <span className="text-xs text-gray-400">
          Available from: {property.availableFrom || "N/A"}
        </span>
        <Link
          to={`/properties/${property._id}`}
          className="ml-2 px-3 py-1 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-yellow-400 hover:text-blue-900 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
