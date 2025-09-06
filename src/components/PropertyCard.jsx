import { Link } from "react-router-dom";
import API from "../services/api";
import { BedDouble, Bath, Armchair } from 'lucide-react'; // Optional: for icons. If you don't use lucide-react, you can remove these and the icon components below.

// Helper function to format the date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function PropertyCard({ property }) {
  // Construct the image URL safely
  const firstImage =
    property.images && property.images.length > 0
      ? `${API.defaults.baseURL.replace('/api', '')}/uploads/${property.images[0]}`
      : "/default-property.jpg"; // A default placeholder image

  // Combine all amenities for a quick preview
  const allAmenities = [...(property.commonAreaFacilities || []), ...(property.pgAmenities || [])];

  return (
    <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full border border-gray-100 overflow-hidden">
      
      {/* Image and Price Badge */}
      <div className="relative">
        <img
          src={firstImage}
          alt={property.title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
          {/* Format price with Indian comma style */}
          {`₹${property.price.toLocaleString('en-IN')}`}
          <span className="font-normal text-xs">/mo</span>
        </div>
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
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{property.title}</h3>
        <p className="text-sm text-gray-600 mb-3">
          <span role="img" aria-label="location-pin">📍</span> {property.locality}, {property.city}
        </p>

        {/* Key Features Section with Icons */}
        <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-gray-100 py-3 my-2">
            <div className="flex flex-col items-center">
                <BedDouble className="w-5 h-5 text-blue-500 mb-1" />
                <span className="text-xs font-semibold text-gray-700">{property.bedrooms} BHK</span>
            </div>
            <div className="flex flex-col items-center">
                <Armchair className="w-5 h-5 text-green-500 mb-1" />
                <span className="text-xs font-semibold text-gray-700">{property.furnishing}</span>
            </div>
             <div className="flex flex-col items-center">
                <Bath className="w-5 h-5 text-red-500 mb-1" />
                <span className="text-xs font-semibold text-gray-700">{property.attachedBathroom === 'Yes' ? 'Private Bath' : 'Shared Bath'}</span>
            </div>
        </div>
        
        {/* Amenities Preview */}
        {allAmenities.length > 0 && (
            <div className="my-2">
                <p className="text-xs text-gray-500 line-clamp-2">
                    <span className="font-semibold text-gray-700">Includes:</span> {allAmenities.join(', ')}
                </p>
            </div>
        )}

        {/* Footer with Availability and Details Button */}
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
