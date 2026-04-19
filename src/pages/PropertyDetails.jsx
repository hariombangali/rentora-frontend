import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import {
  BedDouble,
  Bath,
  Armchair,
  CalendarDays,
  Phone,
  Mail,
  Heart,
  Share2,
  Shield,
  Star,
  Wifi,
  Car,
  Home as HomeIcon,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "../components/FullPageLoader";
import { toast } from "../utils/toast";

const fmtINR = (n) => (n == null ? "N/A" : "₹" + Number(n).toLocaleString("en-IN"));
const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const daysAgo = (d) => {
  if (!d) return "recently";
  const diff = Math.round((Date.now() - new Date(d).getTime()) / (24 * 3600 * 1000));
  if (diff <= 0) return "today";
  if (diff === 1) return "1 day ago";
  if (diff < 30) return `${diff} days ago`;
  if (diff < 365) return `${Math.round(diff / 30)} months ago`;
  return `${Math.round(diff / 365)} years ago`;
};

const AMENITY_ICONS = {
  "wi-fi": Wifi, "wifi": Wifi, "high-speed wi-fi": Wifi,
  "parking": Car, "covered parking": Car, "two-wheeler parking": Car,
  "lift": HomeIcon, "lift access": HomeIcon,
  "24×7 security": Shield, "24x7 security": Shield, "cctv": Shield, "gym": Check,
};

function amenityIcon(label) {
  const key = (label || "").toLowerCase().trim();
  for (const k of Object.keys(AMENITY_ICONS)) {
    if (key.includes(k)) return AMENITY_ICONS[k];
  }
  return Check;
}

const SAMPLE_REVIEWS = [
  {
    name: "Ananya S.",
    stay: "3 months stay",
    text: "The photos are exactly what you get. Landlord is hands-off but responsive. Only noise is occasional dogs at night.",
    rating: 5,
  },
  {
    name: "Rohan P.",
    stay: "1 year stay",
    text: "Clean, quiet building. Rent increase was reasonable. Moved out only because of a job change to Bangalore.",
    rating: 5,
  },
];

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lightboxIdx, setLightboxIdx] = useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

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

  const [moveInDate, setMoveInDate] = useState("");
  const [duration, setDuration] = useState("11 months");

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/properties/${id}`);
        setProperty(res.data);

        const token = localStorage.getItem("token");
        if (token) {
          try {
            const wishlistRes = await API.get("/wishlist", { headers: { Authorization: `Bearer ${token}` } });
            const ids = (wishlistRes.data || []).map((p) => p._id);
            setIsSaved(ids.includes(res.data._id));
          } catch (err) { /* ignore */ }
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
      toast.error("Cannot perform this action on your own listing");
      return false;
    }
    return true;
  };

  const toggleSave = async () => {
    if (!property?._id) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    try {
      setWishlistLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (!isSaved) {
        await API.post(`/wishlist/${property._id}`, {}, config);
        setIsSaved(true);
      } else {
        await API.delete(`/wishlist/${property._id}`, config);
        setIsSaved(false);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

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
      const res = await API.get("/messages/conversations", {
        params: { propertyId: property._id, partnerId: property.user._id },
        ...tokenHeader(),
      });
      setLeadModal(false);
      setLeadNote("");
      navigate("/inbox", { state: { conversation: res.data } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to submit enquiry");
    } finally {
      setSubmittingLead(false);
    }
  };

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
        toast.error(res.data?.message || "Upgrade required to reveal more contacts");
      }
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not reveal phone");
    } finally {
      setRevealing(false);
    }
  };

  const openVisitModal = () => {
    if (!ensureAuthAndNotOwner()) return;
    setVisitModal(true);
  };

  const loadSlots = async (date) => {
    if (!date) return;
    setLoadingSlots(true);
    try {
      const res = await API.get("/visits/availability", { params: { propertyId: property._id, date } });
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
      await API.post(
        "/leads",
        { propertyId: property._id, ownerId: property.user._id, note: leadNote || "Scheduled a visit" },
        tokenHeader()
      );
      await API.post(
        "/visits",
        { propertyId: property._id, ownerId: property.user._id, date: visitDate, slot: visitSlot, note: leadNote || "" },
        tokenHeader()
      );
      setVisitModal(false);
      setLeadNote("");
      setVisitDate("");
      setVisitSlot("");
      toast.success("Visit requested! Owner will confirm or reschedule.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to schedule visit");
    } finally {
      setSubmittingVisit(false);
    }
  };

  if (loading) return <FullPageLoader message="Loading..." />;
  if (error || !property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-paper">
        <p className="text-[color:var(--danger)] font-display text-xl">{error || "Property not found."}</p>
      </div>
    );
  }

  const images = property.images && property.images.length > 0 ? property.images : [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&q=85",
  ];
  const galleryImgs = [images[0], images[1] || images[0], images[2] || images[0], images[3] || images[0], images[4] || images[0]];
  const extraCount = Math.max(0, images.length - 5);

  const allAmenities = [...(property.commonAreaFacilities || []), ...(property.pgAmenities || [])];
  const locality = property.location?.locality || "";
  const city = property.location?.city || "Indore";
  const address = property.location?.address || `${locality}, ${city}`;
  const bhk = property.bedrooms != null ? `${property.bedrooms} BHK` : "Room";
  const furnishShort = (property.furnishing || "").split("-")[0].split(" ")[0] || "—";
  const bath = property.attachedBathroom === "Yes" ? "Private" : property.attachedBathroom === "No" ? "Shared" : "Private";
  const availFor = property.availableFor || property.preferredTenants || "Any";

  const hasCoords =
    Array.isArray(property.location?.point?.coordinates) &&
    property.location.point.coordinates.length === 2 &&
    typeof property.location.point.coordinates[0] === "number" &&
    typeof property.location.point.coordinates[1] === "number";

  const isOwner = user && property?.user && user._id === property.user._id;
  const ownerName = property.user?.ownerKYC?.ownerName || property.user?.name || "Owner";
  const ownerInitial = (ownerName || "O")[0].toUpperCase();

  const totalImages = images.length;

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-24">

        {/* Breadcrumb */}
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2 flex-wrap">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <Link to="/properties" className="hover:text-ink">Listings</Link>
          {locality && <>
            <span>·</span>
            <Link to={`/properties?area=${encodeURIComponent(locality)}`} className="hover:text-ink">{locality}</Link>
          </>}
          <span>·</span>
          <span className="text-ink">{property.title}</span>
        </div>

        {/* Gallery — 3-col grid with 1 large + 4 small + "+N photos" */}
        <div className="mt-5 grid gap-2 rounded-3xl overflow-hidden" style={{ gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "220px 220px" }}>
          <button onClick={() => setLightboxIdx(0)} style={{ gridRow: "span 2" }} className="overflow-hidden bg-ink/10">
            <img src={galleryImgs[0]} className="w-full h-full object-cover hover:scale-[1.02] transition" alt="" />
          </button>
          <button onClick={() => setLightboxIdx(1)} className="overflow-hidden bg-ink/10">
            <img src={galleryImgs[1]} className="w-full h-full object-cover hover:scale-[1.02] transition" alt="" />
          </button>
          <button onClick={() => setLightboxIdx(2)} className="overflow-hidden bg-ink/10">
            <img src={galleryImgs[2]} className="w-full h-full object-cover hover:scale-[1.02] transition" alt="" />
          </button>
          <button onClick={() => setLightboxIdx(3)} className="overflow-hidden bg-ink/10">
            <img src={galleryImgs[3]} className="w-full h-full object-cover hover:scale-[1.02] transition" alt="" />
          </button>
          <button onClick={() => setLightboxIdx(4)} className="relative overflow-hidden bg-ink/10">
            <img src={galleryImgs[4]} className="w-full h-full object-cover hover:scale-[1.02] transition" alt="" />
            {extraCount > 0 && (
              <span className="absolute bottom-3 right-3 inline-flex items-center px-3 py-1.5 rounded-full bg-card border border-rule text-[13px] font-medium">
                +{extraCount} photos
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
          {/* Main */}
          <div>
            <div className="flex justify-between gap-6 items-start flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-[13px] text-[color:var(--muted)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] bg-[oklch(0.96_0.02_80)] text-ink">
                    <Shield className="w-3 h-3 text-accent" /> Verified by Rentora
                  </span>
                  <span>· Listed {daysAgo(property.createdAt)}</span>
                </div>
                <h1 className="font-display text-[40px] md:text-[48px] leading-[1] mt-3 tracking-[-0.02em]">
                  {property.title}
                </h1>
                <div className="text-[15px] text-[color:var(--muted)] mt-1 flex items-center gap-1.5">
                  {locality}{locality ? ", " : ""}{city} ·
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Star className="w-3.5 h-3.5 fill-current" /> 4.9 (42 reviews)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleSave}
                  disabled={wishlistLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? "text-red-500 fill-red-500" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button
                  onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            </div>

            {/* Key facts card */}
            <div className="mt-6 bg-card border border-rule rounded-3xl p-2 grid grid-cols-2 md:grid-cols-4">
              <Fact icon={<BedDouble className="w-5 h-5" />} big={bhk} sub="Bedrooms" />
              <Fact icon={<Armchair className="w-5 h-5" />} big={furnishShort} sub="Furnished" borderLeft />
              <Fact icon={<Bath className="w-5 h-5" />} big={bath} sub="Bathroom" borderLeft />
              <Fact icon={<Shield className="w-5 h-5" />} big={availFor} sub="Available for" borderLeft />
            </div>

            {/* About */}
            <section className="mt-10">
              <h2 className="font-display text-[28px] md:text-[32px]">About this home</h2>
              <p className="mt-4 leading-[1.7] text-[15px]">{property.description}</p>
            </section>

            {/* Amenities */}
            {allAmenities.length > 0 && (
              <section className="mt-10">
                <h2 className="font-display text-[28px] md:text-[32px]">What&rsquo;s included</h2>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3.5">
                  {allAmenities.map((a, i) => {
                    const Icon = amenityIcon(a);
                    return (
                      <div key={i} className="flex items-center gap-2.5 text-[14px]">
                        <span className="text-accent"><Icon className="w-4 h-4" /></span>
                        {a}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Rental terms */}
            {(property.minContractDuration || property.noticePeriod || property.deposit != null) && (
              <section className="mt-10">
                <h2 className="font-display text-[28px] md:text-[32px]">Rental terms</h2>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.minContractDuration && (
                    <div className="bg-card border border-rule rounded-2xl p-4">
                      <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Min contract</p>
                      <p className="mt-1 text-ink font-medium">{property.minContractDuration}</p>
                    </div>
                  )}
                  {property.noticePeriod && (
                    <div className="bg-card border border-rule rounded-2xl p-4">
                      <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Notice period</p>
                      <p className="mt-1 text-ink font-medium">{property.noticePeriod}</p>
                    </div>
                  )}
                  {property.deposit != null && (
                    <div className="bg-card border border-rule rounded-2xl p-4">
                      <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Deposit</p>
                      <p className="mt-1 text-ink font-medium">{fmtINR(property.deposit)}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Neighbourhood */}
            <section className="mt-10">
              <h2 className="font-display text-[28px] md:text-[32px]">The neighbourhood</h2>
              <div className="mt-5 bg-card border border-rule rounded-3xl overflow-hidden">
                <div className="h-[340px] bg-[oklch(0.96_0.02_120)] relative">
                  {hasCoords ? (
                    <MapContainer
                      center={[property.location.point.coordinates[1], property.location.point.coordinates[0]]}
                      zoom={15}
                      className="h-full w-full"
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[property.location.point.coordinates[1], property.location.point.coordinates[0]]}>
                        <Popup>{property.title}<br />{address}</Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[color:var(--muted)]">Map unavailable</div>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { t: "Local market", s: "5 min walk" },
                  { t: "Schools", s: "10 min drive" },
                  { t: "Hospital", s: "12 min drive" },
                  { t: "Bus stop", s: "3 min walk" },
                ].map((n) => (
                  <div key={n.t} className="bg-card border border-rule rounded-2xl p-3.5">
                    <div className="text-[14px] font-medium">{n.t}</div>
                    <div className="text-[12px] text-[color:var(--muted)] mt-0.5">{n.s}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews */}
            <section className="mt-10">
              <div className="flex items-end justify-between">
                <h2 className="font-display text-[28px] md:text-[32px]">From tenants who lived here</h2>
                <div className="text-[14px]"><b>4.9</b> · 42 reviews</div>
              </div>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_REVIEWS.map((r, i) => (
                  <div key={i} className="bg-card border border-rule rounded-3xl p-5">
                    <div className="flex items-center gap-0.5 text-accent mb-3">
                      {[...Array(r.rating)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                    </div>
                    <p className="text-[14px] leading-[1.6]">&ldquo;{r.text}&rdquo;</p>
                    <div className="mt-4 flex items-center gap-3 pt-3 border-t border-rule">
                      <div className="w-8 h-8 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center text-[13px] font-medium">
                        {r.name[0]}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium">{r.name}</div>
                        <div className="text-[11px] text-[color:var(--muted)]">{r.stay}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Booking sidebar */}
          <aside className="lg:sticky lg:top-24">
            <div className="bg-card border border-rule rounded-3xl p-6 shadow-card">
              <div className="flex justify-between items-baseline gap-4">
                <div>
                  <span className="font-display text-[32px]">{fmtINR(property.price)}</span>
                  <span className="text-[14px] text-[color:var(--muted)]"> / month</span>
                </div>
                {property.deposit != null && (
                  <div className="text-[12px] text-[color:var(--muted)] text-right">+ {fmtINR(property.deposit)} deposit</div>
                )}
              </div>

              <div className="h-px bg-rule my-5" />

              {!isOwner ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Move-in</label>
                      <input
                        type="date"
                        value={moveInDate}
                        onChange={(e) => { setMoveInDate(e.target.value); setVisitDate(e.target.value); }}
                        className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                      />
                    </div>
                    <div>
                      <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Duration</label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                      >
                        <option>11 months</option>
                        <option>6 months</option>
                        <option>1 year</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={openVisitModal}
                    className="mt-3.5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition"
                  >
                    Book a visit &mdash; Free
                  </button>
                  <button
                    onClick={handleContactOwner}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition"
                  >
                    Message owner
                  </button>

                  <div className="h-px bg-rule my-5" />

                  <div className="text-[13px] text-[color:var(--muted)] leading-[1.6] space-y-1.5">
                    <div className="flex justify-between"><span>Monthly rent</span><span className="text-ink">{fmtINR(property.price)}</span></div>
                    {property.deposit != null && (
                      <div className="flex justify-between"><span>Security deposit</span><span className="text-ink">{fmtINR(property.deposit)}</span></div>
                    )}
                    <div className="flex justify-between">
                      <span>Maintenance</span>
                      <span className="text-ink">{property.maintenance ? fmtINR(property.maintenance) : "Included"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brokerage</span>
                      <span className="text-sage font-medium">₹0 · always</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[14px] text-[color:var(--muted)] text-center py-4">This is your listing.</p>
              )}
            </div>

            {/* Owner card */}
            {property?.user && (
              <div className="bg-card border border-rule rounded-3xl p-5 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center font-medium">
                    {ownerInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[15px] truncate">{ownerName}</div>
                    <div className="text-[12px] text-[color:var(--muted)]">
                      Owner{property.user.createdAt ? ` · Joined ${new Date(property.user.createdAt).getFullYear()}` : ""}
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 flex gap-3.5 flex-wrap text-[12px] text-[color:var(--muted)]">
                  {property.user.ownerVerified && (
                    <span className="flex items-center gap-1 text-accent">
                      <Shield className="w-3.5 h-3.5" />
                      <span className="text-ink">ID verified</span>
                    </span>
                  )}
                  <span>· Usually replies in 2h</span>
                </div>

                {!isOwner && (
                  <div className="mt-4 space-y-2">
                    {property.user.ownerKYC?.ownerEmail && (
                      <a
                        href={`mailto:${property.user.ownerKYC.ownerEmail}`}
                        className="flex items-center gap-2 text-[13px] text-[color:var(--muted)] hover:text-ink"
                      >
                        <Mail className="w-3.5 h-3.5 text-sage" />
                        {property.user.ownerKYC.ownerEmail}
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-[13px]">
                      <Phone className="w-3.5 h-3.5 text-sage" />
                      {canRevealPhone ? (
                        <a href={`tel:${property.user.ownerKYC?.ownerPhone}`} className="text-ink hover:text-accent">
                          {property.user.ownerKYC?.ownerPhone}
                        </a>
                      ) : (
                        <>
                          <span className="tracking-widest text-[color:var(--muted)]">{phoneMasked}</span>
                          <button
                            onClick={handleRevealPhone}
                            disabled={revealing}
                            className="ml-auto text-[12px] text-accent hover:underline disabled:opacity-50"
                          >
                            {revealing ? "Revealing…" : "Reveal"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-[12px] text-[color:var(--muted)] flex items-center gap-2 justify-center">
              <Shield className="w-3.5 h-3.5" />
              Visit is free. Bookings only after visit.
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-6" onClick={() => setLightboxIdx(null)}>
          <button onClick={() => setLightboxIdx(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-paper/10 text-paper flex items-center justify-center hover:bg-paper/20">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + totalImages) % totalImages); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-paper/10 text-paper flex items-center justify-center hover:bg-paper/20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % totalImages); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-paper/10 text-paper flex items-center justify-center hover:bg-paper/20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <img src={images[lightboxIdx]} alt="" className="max-w-full max-h-full object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-paper/10 text-paper text-[12px]">
            {lightboxIdx + 1} / {totalImages}
          </div>
        </div>
      )}

      {/* Lead modal */}
      {leadModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 grid place-items-center px-4" onClick={() => setLeadModal(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[22px]">Contact Owner</h3>
              <button onClick={() => setLeadModal(false)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Your message</label>
            <textarea
              rows={4}
              value={leadNote}
              onChange={(e) => setLeadNote(e.target.value)}
              placeholder="Introduce yourself, move-in month, budget, and questions…"
              className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setLeadModal(false)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink">
                Cancel
              </button>
              <button onClick={submitLead} disabled={submittingLead || !leadNote.trim()} className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm hover:bg-accent disabled:opacity-50">
                {submittingLead ? "Sending…" : "Send enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visit modal */}
      {visitModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 grid place-items-center px-4" onClick={() => setVisitModal(false)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-[22px]">Schedule a visit</h3>
              <button onClick={() => setVisitModal(false)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Preferred date</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => { setVisitDate(e.target.value); setVisitSlot(""); }}
                  className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                />
              </div>

              {visitDate && (
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">Available time slots</label>
                  {loadingSlots ? (
                    <span className="text-[13px] text-[color:var(--muted)]">Loading slots…</span>
                  ) : slots.length ? (
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.id || s.time}
                          disabled={s.full}
                          onClick={() => setVisitSlot(s.time)}
                          className={`px-3.5 py-1.5 rounded-full text-[13px] border transition ${
                            visitSlot === s.time ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
                          } ${s.full ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[13px] text-[color:var(--muted)]">No slots available for this date</span>
                  )}
                </div>
              )}

              <div>
                <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Note (optional)</label>
                <textarea
                  rows={3}
                  value={leadNote}
                  onChange={(e) => setLeadNote(e.target.value)}
                  placeholder="Any preferences or questions?"
                  className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={() => setVisitModal(false)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink">
                Cancel
              </button>
              <button onClick={submitVisit} disabled={submittingVisit || !visitDate || !visitSlot} className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm hover:bg-accent disabled:opacity-50">
                {submittingVisit ? "Requesting…" : "Request visit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ icon, big, sub, borderLeft }) {
  return (
    <div className={`p-4 md:px-5 md:py-4.5 ${borderLeft ? "md:border-l md:border-rule" : ""}`}>
      <div className="text-accent mb-1.5">{icon}</div>
      <div className="font-semibold text-[16px]">{big}</div>
      <div className="text-[12px] text-[color:var(--muted)] mt-0.5">{sub}</div>
    </div>
  );
}
