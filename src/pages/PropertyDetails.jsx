import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";

export default function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/properties/${id}`);
        setProperty(res.data);
        setError("");
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load property");
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-lg text-gray-700">
        Loading property details...
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-red-600 font-bold text-xl">
          {error || "Property not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-10 px-4 min-h-[80vh]">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden lg:flex lg:gap-10">
        {/* Left: Image gallery */}
        <div className="lg:w-1/2 p-6 bg-gray-50">
          <h2 className="mb-4 font-semibold text-gray-700">Photo Gallery</h2>
          <div className="flex overflow-x-auto space-x-4 scroll-smooth py-2">
            {property.images && property.images.length > 0 ? (
              property.images.map((img, idx) => (
                <img
                  key={idx}
                  src={`${API.defaults.baseURL.replace('/api', '')}/uploads/${img}`}
                  alt={`${property.title} - photo ${idx + 1}`}
                  className="h-48 w-auto rounded-xl border border-gray-200 shadow-md flex-shrink-0"
                  loading="lazy"
                />
              ))
            ) : (
              <img
                src="/default-property.jpg"
                alt="No images"
                className="h-48 w-auto rounded-xl border border-gray-200 shadow-md"
              />
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="lg:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-blue-900 mb-4">
              {property.title}
            </h1>
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="bg-yellow-100 text-yellow-700 rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                {property.type}
              </span>
              <span className="bg-blue-100 text-blue-800 rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                {property.location?.locality || property.location?.city}
              </span>
              <span className="bg-green-100 text-green-700 rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                {property.furnishing}
              </span>
              <span className="bg-gray-200 text-gray-700 rounded-full px-4 py-1 text-sm font-semibold uppercase tracking-wider">
                Deposit: ₹{property.deposit || "N/A"}
              </span>
            </div>

            {/* Price & Availability */}
            <div className="text-xl font-semibold mb-6">
              <p>
                <span className="text-blue-700">Rent:</span> ₹{property.price}/month
              </p>
              <p>
                <span className="text-blue-700">Available from:</span>{" "}
                {property.availableFrom || "N/A"}
              </p>
            </div>

            {/* Description */}
            {property.description && (
              <div className="mb-6 text-gray-700 leading-relaxed border-l-4 border-blue-200 pl-4">
                {property.description.split("\n").map((line, idx) => (
                  <p key={idx} className="mb-2">{line}</p>
                ))}
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-blue-700 font-semibold mb-2">Amenities</h3>
                <ul className="grid grid-cols-2 gap-2 max-w-sm text-gray-700">
                  {property.amenities.map((amenity, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-yellow-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 5.707 10.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                      </svg>
                      <span>{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Owner Info */}
          <div className="bg-blue-50 p-6 rounded-xl shadow-inner">
            <h3 className="text-blue-700 font-semibold mb-3">Owner Information</h3>
            <p>
              <b>Name:</b> {property.ownerKYC?.ownerName || "N/A"}
            </p>
            <p>
              <b>Email:</b> {property.ownerKYC?.ownerEmail || "N/A"}
            </p>
            <p>
              <b>Phone:</b> {property.ownerKYC?.ownerPhone || "N/A"}
            </p>
          </div>

          {/* Contact Button */}
          <button
            className="mt-8 bg-gradient-to-r from-yellow-400 to-yellow-300 text-blue-900 font-bold px-8 py-3 rounded-xl shadow-md hover:from-yellow-300 hover:to-yellow-500 transition"
            onClick={() => alert("Owner contact feature coming soon!")}
          >
            Contact Owner
          </button>
        </div>
      </div>
    </div>
  );
}
