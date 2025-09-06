import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { BedDouble, Bath, Armchair, FileText, CalendarDays, Phone, Mail, MessageCircle } from 'lucide-react'; // Optional: for icons
import { useAuth } from "../context/AuthContext";

// Helper function to format the date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper function to format price
const formatPrice = (price) => {
  if (price === undefined || price === null) return "N/A";
  return `₹${price.toLocaleString('en-IN')}`;
}

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  console.log(user);
  

  const handleSendMessage = async () => {
    try {
      setSending(true);

      // Token localStorage ya context se le lo
      const token = localStorage.getItem("token");

      await API.post(
        "/messages",
        {
          propertyId: property._id,
          receiverId: property.user._id,
          content: message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // 👈 yaha token bhejna zaroori hai
          },
        }
      );

      setMessage("");
      setShowModal(false);
      alert("Message sent successfully!");
      navigate("/inbox", { state: { partner: property.user._id } });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };


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
    return <div className="flex items-center justify-center h-[60vh] text-lg text-gray-700">Loading property details...</div>;
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-red-600 font-bold text-xl">{error || "Property not found."}</p>
      </div>
    );
  }

  const allAmenities = [...(property.commonAreaFacilities || []), ...(property.pgAmenities || [])];
  const mainImage = property.images?.[activeImage] ? `${API.defaults.baseURL.replace('/api', '')}/uploads/${property.images[activeImage]}` : "/default-property.jpg";

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Header Section */}
          <div className="p-6 border-b">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">{property.title}</h1>
            <p className="mt-2 text-md text-gray-600">
              <span role="img" aria-label="pin">📍</span> {property.address}
            </p>
          </div>

          <div className="lg:flex">
            {/* Left Column: Image Gallery */}
            <div className="lg:w-3/5 p-6">
              <div className="sticky top-24">
                <img src={mainImage} alt="Main property view" className="w-full h-96 object-cover rounded-xl shadow-md border" />
                {property.images && property.images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                    {property.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`${API.defaults.baseURL.replace('/api', '')}/uploads/${img}`}
                        alt={`Thumbnail ${idx + 1}`}
                        onClick={() => setActiveImage(idx)}
                        className={`w-24 h-24 object-cover rounded-lg cursor-pointer border-2 ${activeImage === idx ? 'border-blue-500' : 'border-transparent'}`}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Details */}
            <div className="lg:w-2/5 p-6">
              {/* Pricing Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                <div className="text-4xl font-bold text-blue-800 mb-2">
                  {formatPrice(property.price)}<span className="text-xl font-normal">/month</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <p><strong className="text-gray-600">Deposit:</strong> {formatPrice(property.deposit)}</p>
                  <p><strong className="text-gray-600">Maintenance:</strong> {formatPrice(property.maintenance)} <span className="text-xs">({property.maintenanceFreq})</span></p>
                </div>
              </div>

              {/* Key Details Section */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="flex items-center gap-3"><BedDouble className="w-5 h-5 text-blue-500" /> <div><strong>{property.bedrooms}</strong> Bedrooms</div></div>
                <div className="flex items-center gap-3"><Armchair className="w-5 h-5 text-green-500" /> <div><strong>{property.furnishing}</strong></div></div>
                <div className="flex items-center gap-3"><Bath className="w-5 h-5 text-red-500" /> <div>{property.attachedBathroom === 'Yes' ? 'Private Bath' : 'Shared Bath'}</div></div>
                <div className="flex items-center gap-3"><CalendarDays className="w-5 h-5 text-yellow-500" /> <div>Available <strong>{formatDate(property.availableFrom)}</strong></div></div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">About this property</h3>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              {allAmenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">What this place offers</h3>
                  <div className="flex flex-wrap gap-3">
                    {allAmenities.map((amenity, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">{amenity}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Rental Terms</h3>
                <div className="text-sm grid grid-cols-2 gap-2">
                  <p><strong className="text-gray-600">Contract:</strong> {property.minContractDuration}</p>
                  <p><strong className="text-gray-600">Notice Period:</strong> {property.noticePeriod}</p>
                  <p><strong className="text-gray-600">Leaving Charges:</strong> {formatPrice(property.earlyLeavingCharges)}</p>
                </div>
              </div>

              {property.location?.point?.coordinates && (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Location</h3>
                  <div className="h-64 w-full rounded-xl overflow-hidden border shadow">
                    <MapContainer
                      center={[
                        property.location.point.coordinates[1], // latitude
                        property.location.point.coordinates[0]  // longitude
                      ]}
                      zoom={15}
                      className="h-full w-full"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                      <Marker
                        position={[
                          property.location.point.coordinates[1],
                          property.location.point.coordinates[0]
                        ]}
                      >
                        <Popup>
                          {property.title} <br /> {property.location.address}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}

              {property?.user && (
                <div className="mt-6 p-4 border rounded-xl shadow-md bg-white">
                  <h2 className="text-lg font-semibold mb-2">Owner Details</h2>
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span> {property.user.ownerKYC.ownerName}
                  </p>
                  <p className="text-gray-700 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-green-600" />
                    <a href={`tel:${property.user.ownerKYC.ownerPhone}`} className="hover:underline">
                      {property.user.ownerKYC.ownerPhone}
                    </a>
                  </p>
                  <p className="text-gray-700 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href={`mailto:${property.user.ownerKYC.ownerEmail}`} className="hover:underline">
                      {property.user.ownerKYC.ownerEmail}
                    </a>
                  </p>
                  {user?._id !== property.user._id && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Contact Owner
                    </button>
                  )}
                </div>
              )}

              {/* Modal */}
              {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl p-6 w-96 shadow-lg">
                    <h2 className="text-lg font-semibold mb-3">Send Message to {property.user.name}</h2>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300"
                      rows={4}
                    />
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={sending || !message.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                      >
                        {sending ? "Sending..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
