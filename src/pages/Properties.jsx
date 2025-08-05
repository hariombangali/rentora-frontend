import { useState, useEffect } from "react";
import API from "../services/api";
import PropertyCard from "../components/PropertyCard";
import FilterSidebar from "../components/FilterSidebar";

export default function Properties() {
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch only approved:true properties
  useEffect(() => {
    setLoading(true);
    API.get('/properties?approved=true')
      .then(res => setProperties(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Filtering logic stays same
  const filtered = properties.filter(p =>
    (area === '' || p.area === area) &&
    (type === '' || p.type === type) &&
    (minRent === '' || p.rent >= Number(minRent)) &&
    (maxRent === '' || p.rent <= Number(maxRent))
  );

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
          <p className="text-center text-gray-600 mt-8 text-lg">Loading properties...</p>
        ) : filtered.length > 0 ? (
          filtered.map(p => <PropertyCard key={p._id} property={p} />)
        ) : (
          <p className="text-center text-gray-600 mt-8 text-lg">No properties found.</p>
        )}
      </section>
    </div>
  );
}
