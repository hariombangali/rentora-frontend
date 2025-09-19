import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { BedDouble, Bath, Armchair, CalendarDays, Phone, Mail, Heart } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "../components/FullPageLoader";

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
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  // Wishlist
  const [isSaved, setIsSaved] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Lead / Visit / Phone gating states
  const [leadModal, setLeadModal] = useState(false);
  const [visitModal, setVisitModal] = useState(false);
  const [leadNote, setLeadNote] = useState("");
  const [submittingLead, setSubmittingLead] = useState(false);

  const [phoneMasked, setPhoneMasked] = useState("**********");
  const [canRevealPhone, setCanRevealPhone] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const [visitDate, setVisitDate] = useState("");
  const [visitSlot, setVisitSlot] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submittingVisit, setSubmittingVisit] = useState(false);

  // Load property + wishlist + phone quota
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/properties/${id}`);
        setProperty(res.data);

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const wishlistRes = await API.get("/wishlist", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const wishlistIds = (wishlistRes.data || []).map((p) => p._id);
            setIsSaved(wishlistIds.includes(res.data._id));
          } catch (err) {
            console.error("Wishlist fetch error:", err);
          }
        }

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

  // Fetch contact quota/masked phone once property available
  useEffect(() => {
    const loadQuota = async () => {
      const token = localStorage.getItem("token");
      if (!token || !property?.user?._id) return;
      try {
        const res = await API.get("/contacts/quota", {
          params: { ownerId: property.user._id },
          headers: { Authorization: `Bearer ${token}` },
        });
        setCanRevealPhone(Boolean(res.data?.canRevealPhone));
        setPhoneMasked(res.data?.phoneMasked || "**********");
      } catch {
        setCanRevealPhone(false);
        setPhoneMasked("**********");
      }
    };
    loadQuota();
  }, [property]);

  // Toggle Save/Unsave
  const toggleSave = async () => {
    if (loading || !property?._id) return;
    try {
      setWishlistLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { state: { from: window.location.pathname } });
        return;
      }
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
      setWishlistLoading(false);
    }
  };

  const tokenHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const ensureAuthAndNotOwner = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: window.location.pathname } });
      return false;
    }
    if (user && property?.user && user._id === property.user._id) {
      alert("Cannot perform this action on your own listing");
      return false;
    }
    return true;
  };

  // Contact Owner flow
  const handleContactOwner = () => {
    if (!ensureAuthAndNotOwner()) return;
    setLeadModal(true);
  };

  const submitLead = async () => {
    if (!leadNote.trim()) return;
    setSubmittingLead(true);
    try {
      await API.post(
        "/leads",
        { propertyId: property._id, ownerId: property.user._id, note: leadNote.trim() },
        tokenHeader()
      );

      // Open/fetch the exact conversation by property + partner
      const res = await API.get("/messages/conversations", {
        params: { propertyId: property._id, partnerId: property.user._id },
        ...tokenHeader(),
      });

      setLeadModal(false);
      setLeadNote("");
      navigate("/inbox", { state: { conversation: res.data } });
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit enquiry");
    } finally {
      setSubmittingLead(false);
    }
  };

  // Reveal phone (gated)
  const handleRevealPhone = async () => {
    if (!ensureAuthAndNotOwner()) return;
    setRevealing(true);
    try {
      const res = await API.post(
        "/contacts/reveal-phone",
        { ownerId: property.user._id, propertyId: property._id },
        tokenHeader()
      );
      const full = res.data?.phoneFull;
      if (full) {
        setPhoneMasked(full);
        setCanRevealPhone(true);
      } else {
        alert(res.data?.message || "Upgrade required to reveal more contacts");
      }
    } catch (e) {
      alert(e.response?.data?.message || "Could not reveal phone");
    } finally {
      setRevealing(false);
    }
  };

  // Visit scheduling
  const openVisitModal = () => {
    if (!ensureAuthAndNotOwner()) return;
    setVisitModal(true);
  };

  const loadSlots = async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await API.get("/visits/availability", {
        params: { propertyId: property._id, date },
      });
      setSlots(res.data?.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (visitModal && visitDate) loadSlots(visitDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitModal, visitDate]);

  const submitVisit = async () => {
    if (!visitDate || !visitSlot) return;
    setSubmittingVisit(true);
    try {
      // Create a lead alongside visit request for CRM parity
      await API.post(
        "/leads",
        { propertyId: property._id, ownerId: property.user._id, note: leadNote || "Scheduled a visit" },
        tokenHeader()
      );

      await API.post(
        "/visits",
        {
          propertyId: property._id,
          ownerId: property.user._id,
          date: visitDate,
          slot: visitSlot,
          note: leadNote || "",
        },
        tokenHeader()
      );

      setVisitModal(false);
      setLeadNote("");
      setVisitDate("");
      setVisitSlot("");
      alert("Visit requested! Owner will confirm or reschedule.");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to schedule visit");
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading) {
    return <FullPageLoader message="Loading Dashboard..." />;
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-red-600 font-bold text-xl">{error || "Property not found."}</p>
      </div>
    );
  }

  const allAmenities = [...(property.commonAreaFacilities || []), ...(property.pgAmenities || [])];
  const mainImage = property.images?.[activeImage] ? property.images[activeImage] : "/default-property.jpg";

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
                <div className="relative">
                  <img src={mainImage} alt="Main property view" className="w-full h-96 object-cover rounded-xl shadow-md border" />
                  <button
                    onClick={toggleSave}
                    className="absolute top-3 left-3 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition"
                    disabled={wishlistLoading}
                    aria-label="Save property"
                  >
                    {isSaved ? (
                      <Heart className="w-5 h-5 text-red-500" fill="currentColor" />
                    ) : (
                      <Heart className="w-5 h-5 text-gray-500" fill="none" />
                    )}
                  </button>
                </div>

                {property.images && property.images.length > 1 && (
                  <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                    {property.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
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
                  <p><span className="text-gray-600">Deposit:</span> {formatPrice(property.deposit)}</p>
                  <p><span className="text-gray-600">Maintenance:</span> {formatPrice(property.maintenance)} <span className="text-xs">({property.maintenanceFreq})</span></p>
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
                  <p><span className="text-gray-600">Contract:</span> {property.minContractDuration}</p>
                  <p><span className="text-gray-600">Notice Period:</span> {property.noticePeriod}</p>
                  <p><span className="text-gray-600">Leaving Charges:</span> {formatPrice(property.earlyLeavingCharges)}</p>
                </div>
              </div>

              {/* Location */}
          {Array.isArray(property.location?.point?.coordinates) &&
 property.location.point.coordinates.length === 2 &&
 typeof property.location.point.coordinates[0] === "number" &&
 typeof property.location.point.coordinates[1] === "number" && (
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


              {/* Owner Details + Actions */}
              {property?.user && (
                <div className="mt-6 p-4 border rounded-xl shadow-md bg-white">
                  <h2 className="text-lg font-semibold mb-2">Owner Details</h2>
                  <p className="text-gray-700">
                    <span className="font-medium">Name:</span> {property.user.ownerKYC?.ownerName}
                  </p>

                  {/* Gated phone reveal */}
                  <p className="text-gray-700 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-green-600" />
                    {canRevealPhone ? (
                      <a href={`tel:${property.user.ownerKYC?.ownerPhone}`} className="hover:underline">
                        {property.user.ownerKYC?.ownerPhone}
                      </a>
                    ) : (
                      <span className="text-gray-600">{phoneMasked}</span>
                    )}
                  </p>

                  <p className="text-gray-700 flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <a href={`mailto:${property.user.ownerKYC?.ownerEmail}`} className="hover:underline">
                      {property.user.ownerKYC?.ownerEmail}
                    </a>
                  </p>

                  {user && user._id !== property.user._id && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button onClick={handleContactOwner} className="px-4 py-2 rounded bg-blue-600 text-white">
                        Contact Owner
                      </button>
                      <button onClick={openVisitModal} className="px-4 py-2 rounded border border-gray-300">
                        Schedule Visit
                      </button>
                      <button
                        onClick={handleRevealPhone}
                        disabled={revealing || canRevealPhone}
                        className="px-4 py-2 rounded border border-gray-300 disabled:opacity-60"
                        title={canRevealPhone ? "Phone revealed" : "Reveals after enquiry or within quota"}
                      >
                        {canRevealPhone ? "Phone Revealed" : "Get Phone Number"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Owner Modal */}
      {leadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center">
          <div className="bg-white w-full max-w-md rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-3">Contact Owner</h3>
            <textarea
              rows={4}
              value={leadNote}
              onChange={(e) => setLeadNote(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Introduce yourself, move-in month, budget, and questions…"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setLeadModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              <button
                onClick={submitLead}
                disabled={submittingLead || !leadNote.trim()}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {submittingLead ? "Sending…" : "Send Enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {visitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center">
          <div className="bg-white w-full max-w-md rounded-2xl p-5">
            <h3 className="text-lg font-semibold mb-3">Schedule a Visit</h3>

            <div className="mb-3">
              <label className="block text-sm font-medium">Preferred date</label>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Available time slots</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {loadingSlots ? (
                  <span className="text-sm text-gray-500">Loading slots…</span>
                ) : slots.length ? (
                  slots.map((s) => (
                    <button
                      key={s.id || s.time}
                      disabled={s.full}
                      onClick={() => setVisitSlot(s.time)}
                      className={`px-3 py-1 rounded border ${visitSlot === s.time ? "bg-blue-600 text-white" : "bg-white"} ${s.full ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {s.time}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Select a date to view slots</span>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium">Note (optional)</label>
              <textarea
                rows={3}
                value={leadNote}
                onChange={(e) => setLeadNote(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Any preferences or questions?"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setVisitModal(false)} className="px-4 py-2 rounded bg-gray-200">Cancel</button>
              <button
                onClick={submitVisit}
                disabled={submittingVisit || !visitDate || !visitSlot}
                className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
              >
                {submittingVisit ? "Requesting…" : "Request Visit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
