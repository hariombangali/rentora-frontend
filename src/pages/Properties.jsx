import { useState, useEffect } from "react";
import API from "../services/api";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";
import { useSearchParams } from "react-router-dom";
import FullPageLoader from "../components/FullPageLoader";

export default function Properties() {
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [searchParams] = useSearchParams();

  // Read all URL params (URLSearchParams decodes + to space; trim to clean) [6]
  const searchQuery = (searchParams.get("search") || "").trim();
  const qpArea = (searchParams.get("area") || "").trim();
  const qpOccupancy = (searchParams.get("occupancyType") || "").trim();
  const qpMin = (searchParams.get("minRent") || "").trim();
  const qpMax = (searchParams.get("maxRent") || "").trim();

  // Reflect URL → UI controls so incoming filters show in the sidebar [1]
  useEffect(() => {
    if (qpArea !== '') setArea(qpArea);
    if (qpOccupancy !== '') setType(qpOccupancy);
    if (qpMin !== '') setMinRent(qpMin);
    if (qpMax !== '') setMaxRent(qpMax);
  }, [qpArea, qpOccupancy, qpMin, qpMax]); [1]

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setLoading(true);

        let endpoint = '';
        if (searchQuery) {
          // Free-text search path (navbar search)
          const params = new URLSearchParams();
          params.set("search", searchQuery);
          // Optionally also pass filters to combine with text search if backend supports it
          if (qpArea) params.set("area", qpArea);
          if (qpOccupancy) params.set("occupancyType", qpOccupancy);
          if (qpMin) params.set("minRent", qpMin);
          if (qpMax) params.set("maxRent", qpMax);
          params.set("approved", "true");
          endpoint = `/properties/search?${params.toString()}`;
        } else {
          // Pure filters path (Hero/sidebar)
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
  }, [searchQuery, qpArea, qpOccupancy, qpMin, qpMax]); // refetch when URL params change [1][10]

  // Client-side refine on top (kept same)
  const filtered = properties.filter(p => {
    const areaMatch =
      area === '' ||
      p.city?.toLowerCase().includes(area.toLowerCase()) ||
      p.locality?.toLowerCase().includes(area.toLowerCase());

    const typeMatch = type === '' || p.occupancyType === type;

    const minRentMatch = minRent === '' || p.price >= Number(minRent);
    const maxRentMatch = maxRent === '' || p.price <= Number(maxRent);

    return areaMatch && typeMatch && minRentMatch && maxRentMatch;
  });

return (
  <div className="flex flex-col md:flex-row max-w-7xl mx-auto py-8 gap-5">
    <aside className="md:w-60 w-full md:mr-4 mb-8 md:mb-0 sticky top-24 self-start">
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
    </aside>
    <section className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
      {loading ? (
        <FullPageLoader message="Fetching properties..." />
      ) : filtered.length > 0 ? (
        filtered.map((p) => (
          <PropertyCard key={p._id} property={p} wishlistIds={wishlistIds} />
        ))
      ) : (
        <p className="col-span-full text-center text-gray-600 mt-8 text-lg">
          No properties found matching your criteria.
        </p>
      )}
    </section>
  </div>
);

}
