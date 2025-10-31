import { useState, useEffect, useMemo } from "react";
import API from "../services/api";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";
import { useSearchParams } from "react-router-dom";
import FullPageLoader from "../components/FullPageLoader";

export default function Properties() {
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // Mobile drawer state
  const [filtersOpen, setFiltersOpen] = useState(false);

  // URL params
  const searchQuery = (searchParams.get("search") || "").trim();
  const qpArea = (searchParams.get("area") || "").trim();
  const qpOccupancy = (searchParams.get("occupancyType") || "").trim();
  const qpMin = (searchParams.get("minRent") || "").trim();
  const qpMax = (searchParams.get("maxRent") || "").trim();

  // Reflect URL → UI
  useEffect(() => {
    if (qpArea !== "") setArea(qpArea);
    if (qpOccupancy !== "") setType(qpOccupancy);
    if (qpMin !== "") setMinRent(qpMin);
    if (qpMax !== "") setMaxRent(qpMax);
  }, [qpArea, qpOccupancy, qpMin, qpMax]);

  // Fetch data whenever URL params change
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setLoading(true);

        let endpoint = "";
        if (searchQuery) {
          const params = new URLSearchParams();
          params.set("search", searchQuery);
          if (qpArea) params.set("area", qpArea);
          if (qpOccupancy) params.set("occupancyType", qpOccupancy);
          if (qpMin) params.set("minRent", qpMin);
          if (qpMax) params.set("maxRent", qpMax);
          params.set("approved", "true");
          endpoint = `/properties/search?${params.toString()}`;
        } else {
          const params = new URLSearchParams();
          params.set("approved", "true");
          if (qpArea) params.set("area", qpArea);
          if (qpOccupancy) params.set("occupancyType", qpOccupancy);
          if (qpMin) params.set("minRent", qpMin);
          if (qpMax) params.set("maxRent", qpMax);
          endpoint = `/properties?${params.toString()}`;
        }

        const propsPromise = API.get(endpoint, { signal });

        const token = localStorage.getItem("token");
        const wishPromise = token
          ? API.get("/wishlist", { headers: { Authorization: `Bearer ${token}` }, signal })
          : Promise.resolve({ data: [] });

        const [propsRes, wishRes] = await Promise.all([propsPromise, wishPromise]);

        setProperties(Array.isArray(propsRes.data) ? propsRes.data : []);
        setWishlistIds(Array.isArray(wishRes.data) ? wishRes.data.map((p) => p._id) : []);
      } catch (error) {
        if (!(error && (error.name === "CanceledError" || error.name === "AbortError"))) {
          console.error("Failed to fetch properties:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    return () => controller.abort();
  }, [searchQuery, qpArea, qpOccupancy, qpMin, qpMax]);

  // Client-side refine
  const filtered = properties.filter((p) => {
    const areaMatch =
      area === "" ||
      p.city?.toLowerCase().includes(area.toLowerCase()) ||
      p.locality?.toLowerCase().includes(area.toLowerCase());

    const typeMatch = type === "" || p.occupancyType === type;
    const minRentMatch = minRent === "" || p.price >= Number(minRent);
    const maxRentMatch = maxRent === "" || p.price <= Number(maxRent);

    return areaMatch && typeMatch && minRentMatch && maxRentMatch;
  });

  // Helpers for URL syncing
  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (area) c += 1;
    if (type) c += 1;
    if (minRent) c += 1;
    if (maxRent) c += 1;
    return c;
  }, [area, type, minRent, maxRent]);

  const applyFiltersToURL = () => {
    const params = new URLSearchParams();
    params.set("approved", "true");
    if (searchQuery) params.set("search", searchQuery);
    if (area) params.set("area", area);
    if (type) params.set("occupancyType", type);
    if (minRent) params.set("minRent", minRent);
    if (maxRent) params.set("maxRent", maxRent);
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setArea("");
    setType("");
    setMinRent("");
    setMaxRent("");
    const params = new URLSearchParams();
    params.set("approved", "true");
    if (searchQuery) params.set("search", searchQuery);
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto pb-6 md:py-8">
      {/* Mobile sticky actions */}
      <div className="md:hidden sticky top-16 z-30 bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
          >
            <span className="i-ph-faders-horizontal text-lg" aria-hidden="true" />
            Filters{activeFiltersCount ? ` (${activeFiltersCount})` : ""}
          </button>

          {activeFiltersCount > 0 ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-rose-600"
            >
              Clear
            </button>
          ) : (
            <span className="text-sm text-gray-400">No filters</span>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5 px-4 md:px-0 pt-4 md:pt-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:block md:w-64 md:mr-4 sticky top-24 self-start">
          <div className="bg-white rounded-xl border p-4">
            <FilterSidebar
              area={area}
              setArea={setArea}
              type={type}
              setType={setType}
              minRent={minRent}
              setMinRent={setMinRent}
              maxRent={maxRent}
              setMaxRent={setMaxRent}
            />
          </div>
        </aside>

        {/* Results grid */}
        <section className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {loading ? (
            <div className="col-span-full">
              <FullPageLoader message="Fetching properties..." />
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((p) => (
              <PropertyCard key={p._id} property={p} wishlistIds={wishlistIds} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-600 mt-8 text-base sm:text-lg">
              No properties found matching your criteria.
            </p>
          )}
        </section>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white border-t shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-base font-semibold">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="p-2 rounded-full border"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-4 py-4">
              <FilterSidebar
                area={area}
                setArea={setArea}
                type={type}
                setType={setType}
                minRent={minRent}
                setMinRent={setMinRent}
                maxRent={maxRent}
                setMaxRent={setMaxRent}
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-t">
              <button
                onClick={() => {
                  applyFiltersToURL();
                  setFiltersOpen(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-black text-white text-sm"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  clearFilters();
                }}
                className="px-4 py-2 rounded-lg border text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
