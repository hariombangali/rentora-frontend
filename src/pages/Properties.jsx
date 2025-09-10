import { useState, useEffect } from "react";
import API from "../services/api";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";

export default function Properties() {
  const [area, setArea] = useState(''); // This will filter by city or locality
  const [type, setType] = useState(''); // This will filter by occupancyType
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
    const [wishlistIds, setWishlistIds] = useState([]);

  // Fetch only approved properties
  useEffect(() => {
    setLoading(true);
    const fetchProperties = async () => {
      try {
        const res = await API.get('/properties?approved=true');
        setProperties(res.data);

          const token = localStorage.getItem("token");
        if (token) {
        const res = await API.get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlistIds(res.data.map((p) => p._id));
      }

      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // **CORRECTED FILTERING LOGIC**
  const filtered = properties.filter(p => {
    // Area filter: checks if the search term is in the city or locality
    const areaMatch = area === '' ||
      p.city?.toLowerCase().includes(area.toLowerCase()) ||
      p.locality?.toLowerCase().includes(area.toLowerCase());

    // Type filter: checks against occupancyType
    const typeMatch = type === '' || p.occupancyType === type;

    // Rent filter: checks against price
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
          <p className="col-span-full text-center text-gray-600 mt-8 text-lg">Loading properties...</p>
        ) : filtered.length > 0 ? (
          filtered.map(p => <PropertyCard key={p._id} property={p} wishlistIds={wishlistIds} />)
        ) : (
          <p className="col-span-full text-center text-gray-600 mt-8 text-lg">No properties found matching your criteria.</p>
        )}
      </section>
    </div>
  );
}
