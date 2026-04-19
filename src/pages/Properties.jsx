import { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import { Link, useSearchParams } from "react-router-dom";
import {
  Heart,
  Shield,
  Star,
  BedDouble,
  Bath,
  Armchair,
  Filter,
  Grid as GridIcon,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import PropertiesMap from "../components/PropertiesMap";

const INDORE_LOCALITIES = [
  "Vijay Nagar", "Palasia", "Scheme 54", "Sapna Sangeeta", "Nipania", "AB Road",
  "Khajrana", "Bhawarkua", "Geeta Bhawan", "Annapurna", "South Tukoganj",
  "Saket Nagar", "Manorama Ganj", "Super Corridor", "Tilak Nagar", "New Palasia",
  "Mahalaxmi Nagar", "Bicholi Mardana", "Rau", "LIG Colony",
];

const PROPERTY_TYPES = [
  { k: "flat",   label: "Flat" },
  { k: "room",   label: "Room" },
  { k: "pg",     label: "PG" },
  { k: "hostel", label: "Hostel" },
];

const BEDROOM_OPTS = ["1", "2", "3", "4+"];
const FURNISHING_OPTS = ["Fully furnished", "Semi-furnished", "Unfurnished"];
const AVAILABLE_FOR = ["Family", "Bachelor", "Student", "Working Pro"];
const AMENITY_OPTS = ["Wi-Fi included", "Parking", "Attached bath", "Gated security"];

const PAGE_SIZE = 12;

const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");
const fmtKBand = (min, max) => {
  const f = (n) => (n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);
  if (!min && !max) return "Any";
  if (!min) return `Up to ${f(max)}`;
  if (!max) return `${f(min)}+`;
  return `${f(min)} – ${f(max)}`;
};

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState("grid"); // grid | map
  const [sortBy, setSortBy] = useState("recommended");
  const [page, setPage] = useState(1);

  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [furnishing, setFurnishing] = useState([]);
  const [availableFor, setAvailableFor] = useState([]);
  const [amenities, setAmenities] = useState([]);

  const searchQuery = (searchParams.get("search") || "").trim();
  const qpArea = searchParams.get("area") || "";
  const qpOccupancy = searchParams.get("occupancyType") || "";
  const qpMin = searchParams.get("minRent") || "";
  const qpMax = searchParams.get("maxRent") || "";

  useEffect(() => {
    if (qpArea) setArea(qpArea);
    if (qpOccupancy) setType(qpOccupancy);
    if (qpMin) setMinRent(qpMin);
    if (qpMax) setMaxRent(qpMax);
  }, [qpArea, qpOccupancy, qpMin, qpMax]);

  useEffect(() => {
    const ctrl = new AbortController();
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("approved", "true");
        if (qpArea) params.set("area", qpArea);
        if (qpOccupancy) params.set("occupancyType", qpOccupancy);
        if (qpMin) params.set("minRent", qpMin);
        if (qpMax) params.set("maxRent", qpMax);
        let endpoint;
        if (searchQuery) {
          params.set("search", searchQuery);
          endpoint = `/properties/search?${params.toString()}`;
        } else {
          endpoint = `/properties?${params.toString()}`;
        }

        const propsP = API.get(endpoint, { signal: ctrl.signal });
        const token = localStorage.getItem("token");
        const wishP = token
          ? API.get("/wishlist", { headers: { Authorization: `Bearer ${token}` }, signal: ctrl.signal })
          : Promise.resolve({ data: [] });

        const [propsRes, wishRes] = await Promise.all([propsP, wishP]);
        const list = Array.isArray(propsRes.data) ? propsRes.data : propsRes.data?.properties ?? [];
        setProperties(list);
        setWishlistIds(Array.isArray(wishRes.data) ? wishRes.data.map((p) => p._id) : []);
        setPage(1);
      } catch (err) {
        if (!(err && (err.name === "CanceledError" || err.name === "AbortError"))) {
          console.error("Failed to fetch properties:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => ctrl.abort();
  }, [searchQuery, qpArea, qpOccupancy, qpMin, qpMax]);

  const clientFiltered = useMemo(() => {
    let list = properties;
    if (bedrooms) {
      list = list.filter((p) => {
        if (bedrooms === "4+") return Number(p.bedrooms) >= 4;
        return Number(p.bedrooms) === Number(bedrooms);
      });
    }
    if (furnishing.length) list = list.filter((p) => furnishing.includes(p.furnishing));
    if (availableFor.length) {
      list = list.filter((p) =>
        availableFor.some((a) => {
          const v = (p.availableFor || "").toLowerCase() + " " + (p.preferredTenants || "").toLowerCase();
          if (a === "Family") return v.includes("family") || v.includes("any");
          if (a === "Bachelor") return v.includes("boys") || v.includes("girls") || v.includes("any");
          if (a === "Student") return v.includes("student") || v.includes("any");
          if (a === "Working Pro") return v.includes("working") || v.includes("professional");
          return false;
        })
      );
    }
    if (amenities.length) {
      list = list.filter((p) => {
        const all = [...(p.commonAreaFacilities || []), ...(p.pgAmenities || [])].map((x) => x.toLowerCase());
        return amenities.every((a) => {
          if (a === "Wi-Fi included") return all.some((x) => x.includes("wi-fi") || x.includes("wifi"));
          if (a === "Parking") return all.some((x) => x.includes("parking"));
          if (a === "Attached bath") return p.attachedBathroom === "Yes";
          if (a === "Gated security") return all.some((x) => x.includes("cctv") || x.includes("security") || x.includes("gated"));
          return true;
        });
      });
    }

    if (sortBy === "low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sortBy === "high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sortBy === "new") list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return list;
  }, [properties, bedrooms, furnishing, availableFor, amenities, sortBy]);

  const totalPages = Math.max(1, Math.ceil(clientFiltered.length / PAGE_SIZE));
  const paged = clientFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set("approved", "true");
    if (searchQuery) params.set("search", searchQuery);
    if (area) params.set("area", area);
    if (type) params.set("occupancyType", type);
    if (minRent) params.set("minRent", minRent);
    if (maxRent) params.set("maxRent", maxRent);
    setSearchParams(params, { replace: true });
    setFiltersOpen(false);
  };

  const clearAll = () => {
    setArea(""); setType(""); setMinRent(""); setMaxRent("");
    setBedrooms(""); setFurnishing([]); setAvailableFor([]); setAmenities([]);
    const params = new URLSearchParams();
    params.set("approved", "true");
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params, { replace: true });
  };

  const activePills = useMemo(() => {
    const pills = [];
    if (area) pills.push({ key: "area", label: area, clear: () => setArea("") });
    if (type) pills.push({ key: "type", label: PROPERTY_TYPES.find((t) => t.k === type)?.label || type, clear: () => setType("") });
    if (minRent || maxRent) pills.push({ key: "budget", label: fmtKBand(minRent, maxRent), clear: () => { setMinRent(""); setMaxRent(""); } });
    if (bedrooms) pills.push({ key: "bhk", label: `${bedrooms} BHK`, clear: () => setBedrooms("") });
    furnishing.forEach((f) => pills.push({ key: `f-${f}`, label: f.split(" ")[0], clear: () => setFurnishing(furnishing.filter((x) => x !== f)) }));
    availableFor.forEach((a) => pills.push({ key: `a-${a}`, label: a, clear: () => setAvailableFor(availableFor.filter((x) => x !== a)) }));
    amenities.forEach((m) => pills.push({ key: `m-${m}`, label: m, clear: () => setAmenities(amenities.filter((x) => x !== m)) }));
    return pills;
  }, [area, type, minRent, maxRent, bedrooms, furnishing, availableFor, amenities]);

  const toggleList = (list, setList, val) => {
    if (list.includes(val)) setList(list.filter((x) => x !== val));
    else setList([...list, val]);
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-24">

        {/* Crumb */}
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <span>Listings</span>
        </div>

        {/* Header */}
        <div className="mt-4 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="font-eyebrow text-[color:var(--muted)]">
              Indore · {properties.length.toLocaleString()} homes
            </p>
            <h1 className="font-display text-[44px] md:text-[56px] leading-[1] mt-2 tracking-[-0.02em]">
              {searchQuery ? <>Results for &ldquo;{searchQuery}&rdquo;</> : "Quietly curated homes."}
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-[color:var(--muted)]">
              Every listing is visited by our team. These are the ones open to move-in right now.
            </p>
          </div>
          <div className="inline-flex gap-2">
            <button
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition ${
                view === "grid" ? "bg-ink text-paper" : "bg-card border border-rule text-ink hover:border-ink"
              }`}
            >
              <GridIcon className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              onClick={() => setView("map")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition ${
                view === "map" ? "bg-ink text-paper" : "bg-card border border-rule text-ink hover:border-ink"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Active filters strip */}
        {activePills.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-[color:var(--muted)]">Active:</span>
            {activePills.map((p) => (
              <button
                key={p.key}
                onClick={p.clear}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] bg-card border border-rule hover:border-ink transition"
              >
                {p.label} <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearAll}
              className="ml-1 text-[13px] text-[color:var(--muted)] hover:text-ink underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Mobile filters trigger */}
        <div className="lg:hidden mt-6">
          <button
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-[13px]"
          >
            <Filter className="w-3.5 h-3.5" /> Filters
            {activePills.length > 0 ? ` · ${activePills.length}` : ""}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">

          {/* Sidebar */}
          <aside className="hidden lg:block bg-card border border-rule rounded-3xl p-6 sticky top-24">
            <FilterSidebar
              area={area} setArea={setArea}
              type={type} setType={setType}
              minRent={minRent} setMinRent={setMinRent}
              maxRent={maxRent} setMaxRent={setMaxRent}
              bedrooms={bedrooms} setBedrooms={setBedrooms}
              furnishing={furnishing} setFurnishing={setFurnishing}
              availableFor={availableFor} setAvailableFor={setAvailableFor}
              amenities={amenities} setAmenities={setAmenities}
              toggleList={toggleList}
              onApply={applyFilters}
              onReset={clearAll}
              activePills={activePills}
            />
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="text-[14px] text-[color:var(--muted)]">
                <b className="text-ink">{clientFiltered.length}</b> home{clientFiltered.length === 1 ? "" : "s"} match your search
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                Sort:
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-full border border-rule bg-card px-3 py-1.5 text-[13px] focus:outline-none focus:border-ink"
                >
                  <option value="recommended">Recommended</option>
                  <option value="low">Lowest price</option>
                  <option value="high">Highest price</option>
                  <option value="new">Newest</option>
                </select>
              </div>
            </div>

            {view === "grid" ? (
              <>
                <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <div key={i} className="bg-card border border-rule rounded-3xl h-[420px] animate-pulse" />
                    ))
                  ) : paged.length > 0 ? (
                    paged.map((p) => <PropertyGridCard key={p._id} p={p} saved={wishlistIds.includes(p._id)} />)
                  ) : (
                    <div className="col-span-full bg-card border border-rule rounded-3xl p-14 text-center">
                      <h3 className="font-display text-[22px]">No properties found</h3>
                      <p className="text-[14px] text-[color:var(--muted)] mt-2">
                        Try adjusting your filters — a perfect place might be just a tweak away.
                      </p>
                      <button onClick={clearAll} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition">
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {clientFiltered.length > PAGE_SIZE && (
                  <div className="mt-10 flex justify-center gap-1.5 flex-wrap">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((n) => Math.max(1, n - 1))}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-card border border-rule hover:border-ink transition disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {pageNumbers(page, totalPages).map((n, i) =>
                      n === "…" ? (
                        <span key={`d-${i}`} className="w-9 h-9 inline-flex items-center justify-center text-[color:var(--muted)]">…</span>
                      ) : (
                        <button
                          key={n}
                          onClick={() => setPage(n)}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-full text-[13px] transition ${
                            n === page ? "bg-ink text-paper" : "bg-card border border-rule hover:border-ink"
                          }`}
                        >
                          {n}
                        </button>
                      )
                    )}
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                      className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-card border border-rule hover:border-ink transition disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              // MAP VIEW
              <div className="bg-card border border-rule rounded-3xl overflow-hidden">
                <div className="h-[600px] relative">
                  <PropertiesMap />
                  <div className="absolute top-5 left-5 bg-card border border-rule rounded-3xl p-5 w-[280px] shadow-card z-[1000]">
                    <div className="font-eyebrow text-[color:var(--muted)]">Viewing</div>
                    <div className="font-display text-[26px] mt-1">{clientFiltered.length} homes</div>
                    <button className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition">
                      Save this search
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile filter drawer */}
        {filtersOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setFiltersOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card border-t border-rule max-h-[85vh] flex flex-col">
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 rounded-full bg-rule" />
              </div>
              <div className="flex items-center justify-between px-5 pb-3 border-b border-rule">
                <span className="font-eyebrow text-[color:var(--muted)]">Filters</span>
                <button onClick={() => setFiltersOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full border border-rule hover:bg-paper">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FilterSidebar
                  area={area} setArea={setArea}
                  type={type} setType={setType}
                  minRent={minRent} setMinRent={setMinRent}
                  maxRent={maxRent} setMaxRent={setMaxRent}
                  bedrooms={bedrooms} setBedrooms={setBedrooms}
                  furnishing={furnishing} setFurnishing={setFurnishing}
                  availableFor={availableFor} setAvailableFor={setAvailableFor}
                  amenities={amenities} setAmenities={setAmenities}
                  toggleList={toggleList}
                  onApply={applyFilters}
                  onReset={clearAll}
                  activePills={activePills}
                  compact
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  if (current > 3) out.push("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) out.push(i);
  if (current < total - 2) out.push("…");
  out.push(total);
  return out;
}

function FilterSidebar(props) {
  const {
    area, setArea, type, setType,
    minRent, setMinRent, maxRent, setMaxRent,
    bedrooms, setBedrooms,
    furnishing, setFurnishing,
    availableFor, setAvailableFor,
    amenities, setAmenities,
    toggleList,
    onApply, onReset, activePills,
  } = props;

  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <div className="font-semibold">Refine</div>
        {activePills.length > 0 && (
          <button onClick={onReset} className="text-[12px] text-[color:var(--muted)] hover:text-ink">Reset</button>
        )}
      </div>

      <Section title="Locality">
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
        >
          <option value="">Any</option>
          {INDORE_LOCALITIES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </Section>

      <Section title="Property type">
        <div className="grid grid-cols-2 gap-1.5">
          {PROPERTY_TYPES.map((pt) => (
            <button
              key={pt.k}
              onClick={() => setType(type === pt.k ? "" : pt.k)}
              className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-[13px] border transition ${
                type === pt.k ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title={`Budget · ${fmtKBand(minRent, maxRent)}`}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
            className="w-full rounded-xl border border-rule bg-card px-3 py-2 text-[14px] focus:outline-none focus:border-ink"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            className="w-full rounded-xl border border-rule bg-card px-3 py-2 text-[14px] focus:outline-none focus:border-ink"
          />
        </div>
        <div className="mt-1.5 text-[11px] text-[color:var(--muted)]">₹5k – ₹50k+</div>
      </Section>

      <Section title="Bedrooms">
        <div className="flex gap-1.5">
          {BEDROOM_OPTS.map((n) => (
            <button
              key={n}
              onClick={() => setBedrooms(bedrooms === n ? "" : n)}
              className={`flex-1 rounded-full px-2.5 py-2 text-[13px] border transition ${
                bedrooms === n ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Furnishing">
        <div className="flex flex-col gap-2.5">
          {FURNISHING_OPTS.map((f) => (
            <label key={f} className="flex items-center gap-2.5 text-[14px] cursor-pointer">
              <input
                type="checkbox"
                checked={furnishing.includes(f)}
                onChange={() => toggleList(furnishing, setFurnishing, f)}
                className="w-4 h-4 accent-[color:var(--ink)]"
              />
              {f}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Available for">
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_FOR.map((a) => (
            <button
              key={a}
              onClick={() => toggleList(availableFor, setAvailableFor, a)}
              className={`inline-flex rounded-full px-3 py-1.5 text-[12px] border transition ${
                availableFor.includes(a) ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Amenities">
        <div className="flex flex-col gap-2.5">
          {AMENITY_OPTS.map((m) => (
            <label key={m} className="flex items-center gap-2.5 text-[14px] cursor-pointer">
              <input
                type="checkbox"
                checked={amenities.includes(m)}
                onChange={() => toggleList(amenities, setAmenities, m)}
                className="w-4 h-4 accent-[color:var(--ink)]"
              />
              {m}
            </label>
          ))}
        </div>
      </Section>

      <button
        onClick={onApply}
        className="w-full inline-flex items-center justify-center px-5 py-3 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
      >
        Apply filters
      </button>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5.5" style={{ marginBottom: 22 }}>
      <div className="font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">{title}</div>
      {children}
    </div>
  );
}

function PropertyGridCard({ p, saved }) {
  const img = p.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80&auto=format&fit=crop";
  const locality = p.location?.locality || p.locality || "";
  const city = p.location?.city || p.city || "Indore";
  const furnish = (p.furnishing || "").split(" ")[0] || "Furnished";
  const bath = p.attachedBathroom === "Yes" ? "Private" : p.attachedBathroom === "No" ? "Shared" : "Private";
  const rating = p.rating || 4.8;

  return (
    <Link
      to={`/properties/${p._id}`}
      className="block bg-card border border-rule rounded-3xl overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300"
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          <img src={img} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/92 backdrop-blur flex items-center justify-center hover:bg-white transition"
          aria-label="Save"
        >
          <Heart className={`w-4 h-4 ${saved ? "fill-red-500 text-red-500" : "text-ink"}`} />
        </button>
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] bg-white/95">
          <Shield className="w-3 h-3 text-accent" />
          <span className="text-accent font-medium">Verified</span>
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-[17px] truncate">{p.title}</h3>
            <div className="text-[13px] mt-0.5 text-[color:var(--muted)] truncate">
              {locality}{locality ? ", " : ""}{city}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[13px] shrink-0">
            <Star className="w-3.5 h-3.5 fill-accent text-accent" />
            {Number(rating).toFixed(1)}
          </div>
        </div>
        <div className="mt-3.5 flex items-center gap-3.5 text-[12px] text-[color:var(--muted)]">
          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bedrooms ?? 1} BHK</span>
          <span className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5" /> {furnish}</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {bath}</span>
        </div>
        <div className="mt-4 pt-3.5 border-t border-rule flex items-end justify-between">
          <div>
            <span className="font-semibold text-[20px]">{fmtINR(p.price)}</span>
            <span className="text-[12px] text-[color:var(--muted)]"> / month</span>
          </div>
          <span className="text-[13px] font-medium underline underline-offset-4">View home</span>
        </div>
      </div>
    </Link>
  );
}
