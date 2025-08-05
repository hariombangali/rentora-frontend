import { useEffect, useState } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard.jsx';

export default function Home() {
  const [data, setData] = useState({
    topAreas: [],
    benefits: [],
    howItWorks: [],
    latestProperties: [],
    testimonials: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHomeData();
  }, []);

  async function fetchHomeData() {
    setLoading(true);
    setError("");
    try {
      const res = await API.get('/home');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load home page data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="bg-gradient-to-tr from-blue-50 via-white to-yellow-50 min-h-screen pb-16">
      {/* Hero and Top Areas */}
      <section className="max-w-5xl mx-auto pt-12 px-4 text-center">
        <h1 className="text-5xl font-extrabold text-blue-900 mb-4 drop-shadow-md">
          Discover Your Next <span className="text-yellow-400">Home</span> in Indore
        </h1>
        <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium">
          Explore the latest verified flats, rooms & PGs trusted by hundreds across Indore.
        </p>
      </section>

      <section className="max-w-6xl mx-auto mt-12 px-4">
        <h2 className="text-2xl font-bold mb-6 text-blue-800 text-center">Top Areas in Indore</h2>
        <div className="flex gap-6 overflow-x-auto scrollbar-hide px-2 justify-center" style={{ scrollSnapType: "x mandatory" }}>
          {data.topAreas.map(area => (
            <Link
              key={area.name}
              to={`/properties?area=${encodeURIComponent(area.name)}`}
              className="min-w-[140px] bg-yellow-50 rounded-xl shadow-lg flex flex-col items-center justify-center py-6 px-4 cursor-pointer transform hover:scale-105 transition snap-center"
            >
              <span className="text-4xl mb-2">{area.icon}</span>
              <span className="font-semibold text-blue-900 text-lg">{area.name}</span>
              <span className="mt-1 text-blue-700 underline text-sm">Browse</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Listings */}
      <section className="max-w-7xl mx-auto mt-14 px-4">
        <h2 className="text-3xl font-extrabold text-blue-900 mb-8 text-center">
          Latest Listings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {data.latestProperties.map(property => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
        <div className="flex justify-center mt-10">
          <Link
            to="/properties"
            className="px-8 py-3 rounded-lg bg-blue-700 text-white font-semibold shadow hover:bg-yellow-400 hover:text-blue-900 transition"
          >
            See all properties &rarr;
          </Link>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="max-w-6xl mx-auto mt-20 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">Why Choose Room4Rent?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {data.benefits.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition">
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto mt-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-blue-900 mb-10">How Room4Rent Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-left">
          {data.howItWorks.map((step, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow p-6 relative">
              <div className="absolute -top-6 left-6 bg-yellow-400 text-white font-bold rounded-full w-12 h-12 flex items-center justify-center text-xl shadow-lg">
                {idx + 1}
              </div>
              <p className="mt-8 text-gray-700 font-medium">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto mt-20 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.testimonials.map(({ name, area, feedback }) => (
            <div key={name} className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition flex flex-col justify-between">
              <p className="text-gray-800 italic mb-6">"{feedback}"</p>
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{name}</p>
                  <p className="text-gray-600 text-sm">{area}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
