import { useEffect, useState, useMemo } from 'react';
import API from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard.jsx';
import PropertiesMap from '../components/PropertiesMap.jsx';
import TopArea from '../components/TopArea.jsx';
import FullPageLoader from "../components/FullPageLoader";

export default function Home() {

  const navigate = useNavigate();
  const [data, setData] = useState({
    topAreas: [],
    benefits: [],
    howItWorks: [],
    latestProperties: [],
    featured: [],
    testimonials: [],
    counters: { tenants: 0, verifiedProperties: 0, localities: 0 }
  });
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    setError("");

    try {
      const [
        homeRes,
        featuredRes,
        popularAreasRes,
        testimonialsRes,
        countersRes
      ] = await Promise.allSettled([
        API.get('/home'),                      // static blocks + small latest slice
        API.get('/properties/featured?limit=10'), // featured carousel (fallback to latest if not using featured)
        API.get('/home/areas/popular?limit=12'),  // dynamic “Top Areas”
        API.get('/testimonials?limit=6&page=1'),  // testimonials (optional pagination)
        API.get('/home/counters')                // hero counters
      ]);

      const next = { ...data };

      const token = localStorage.getItem("token");
      if (token) {
        const res = await API.get("/wishlist", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWishlistIds(res.data.map((p) => p._id));
      }

      // /home
      if (homeRes.status === 'fulfilled') {
        const h = homeRes.value.data;
        next.topAreas = h.topAreas || [];
        next.benefits = h.benefits || [];
        next.howItWorks = h.howItWorks || [];
        next.latestProperties = h.latestProperties || [];
        // If you want to keep small testimonials slice from /home as fallback:
        if (!testimonialsRes || testimonialsRes.status !== 'fulfilled') {
          next.testimonials = h.testimonials || [];
        }
      }

      // /properties/featured (fallback to latest if empty)
      if (featuredRes.status === 'fulfilled') {
        const fp = featuredRes.value.data || [];
        next.featured = fp.length ? fp : next.latestProperties;
      } else {
        next.featured = next.latestProperties;
      }

      // /home/areas/popular
      if (popularAreasRes.status === 'fulfilled') {
        const popular = popularAreasRes.value.data?.areas || [];
        // Map to the same shape you render (name + icon). You can attach icons dynamically or keep emojis static.
        next.topAreas = popular.length
          ? popular.map((a) => ({ name: a.name, icon: '📍', count: a.count }))
          : next.topAreas;
      }

      // /testimonials
      if (testimonialsRes.status === 'fulfilled') {
        const t = testimonialsRes.value.data?.data || [];
        next.testimonials = t.length ? t : next.testimonials;
      }

      // /home/counters
      if (countersRes.status === 'fulfilled') {
        next.counters = countersRes.value.data || next.counters;
      }

      setData(next);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load home page data");
    } finally {
      setLoading(false);
    }
  } 

  const handleSearch = () => {
    const queryParams = new URLSearchParams();

    if (searchLocation) {
      queryParams.append('area', searchLocation);
    }
    if (searchType) {
      // Use 'occupancyType' to match the backend schema/filter
      queryParams.append('occupancyType', searchType);
    }

    // Navigate to the properties page with the search query
    navigate(`/properties?${queryParams.toString()}`);
  };


  if (loading) return <FullPageLoader message="Loading..." />;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="relative bg-blue-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/50">
          <img
            src="https://vibrantgroup.co/project_img/1710243638_2.jpg"
            alt="Indore skyline at dusk"
            className="absolute inset-0 w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Find Your Perfect <span className="text-yellow-400">Home</span></h1>
            <p className="text-xl max-w-2xl mx-auto">Discover verified flats, rooms & PGs across Indore</p>
          </div>

          {/* Quick Search (wire to navigate with URL params when you’re ready) */}
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-2">
              <select
                className="flex-1 p-3 border rounded-lg text-gray-800"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              >
                <option value="">Select Location</option>
                {data.topAreas.map(area => (
                  <option key={area.name} value={area.name}>{area.name}</option>
                ))}
              </select>
              <select
                className="flex-1 p-3 border rounded-lg text-gray-800"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="">Property Type</option>
                <option value="flat">Flat</option>
                <option value="room">Room</option>
                <option value="pg">PG</option>
              </select>
              <button
                onClick={handleSearch}
                className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition"
              >
                Search Properties
              </button>
            </div>
          </div>

          {/* Counters from /home/counters */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{(data.counters.tenants || 0).toLocaleString()}+</div>
              <div>Happy Tenants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{(data.counters.verifiedProperties || 0).toLocaleString()}+</div>
              <div>Verified Properties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{(data.counters.localities || 0).toLocaleString()}+</div>
              <div>Localities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Areas */}
      <section className="max-w-6xl mx-auto mt-12 px-4">
        <TopArea areas={data.topAreas} />
      </section>

      {/* Property Types (unchanged) */}
      <section className="max-w-6xl mx-auto mt-20 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">Find Your Perfect Space</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "🏠", title: "Full Flats", desc: "Private apartments", link: "/properties?type=flat" },
            { icon: "🚪", title: "Rooms", desc: "Single rooms", link: "/properties?type=room" },
            { icon: "👨‍🎓", title: "PGs", desc: "Paying guest", link: "/properties?type=pg" },
            { icon: "🏢", title: "Hostels", desc: "Student housing", link: "/properties?type=hostel" }
          ].map((item) => (
            <Link
              key={item.title}
              to={item.link}
              className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured (uses /properties/featured; falls back to latest) */}
      <section className="max-w-7xl mx-auto mt-20 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900">Featured Properties</h2>
          <Link to="/properties" className="text-blue-600 font-medium flex items-center gap-1">
            View All <span>→</span>
          </Link>
        </div>
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {(data.featured || []).map((property, i) => (
              <div key={`${property._id}-${i}`} className="min-w-[300px]">
                <PropertyCard property={property} wishlistIds={wishlistIds} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="max-w-7xl mx-auto mt-20 px-4">
        <h2 className="text-3xl font-extrabold text-blue-900 mb-8 text-center">Explore Properties on Map</h2>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-96 relative">
          <PropertiesMap />
          <div className="absolute bottom-4 left-4 right-4 bg-white p-3 rounded-lg shadow-md flex justify-between">
            <span className="font-medium">Popular areas: Vijay Nagar, Sapna Sangeeta, Scheme 54</span>
            <button className="text-blue-600 font-semibold">View All Areas →</button>
          </div>
        </div>
      </section>

      {/* Benefits */}
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

      {/* How it works */}
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
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">Trusted by Thousands</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.testimonials.map((t, i) => (
            <div key={`${t.name}-${i}`} className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">
              <div className="flex mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className={`w-5 h-5 ${j < (t.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-800 italic mb-6">"{t.feedback || t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  <span className="text-gray-500 text-xl font-bold">{(t.name || 'U').charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{t.name || 'User'}</p>
                  <p className="text-gray-600 text-sm">{t.area || ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blog Section */}
      <section className="max-w-6xl mx-auto mt-20 px-4">
        <h2 className="text-2xl font-bold text-blue-900 mb-8 text-center">Rental Tips & News</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "How to Choose the Right PG in Indore",
              excerpt: "Essential factors to consider when selecting a paying guest accommodation...",
              image: "pg-tips.jpg"
            },
            {
              title: "Rental Trends in Indore 2023",
              excerpt: "Latest insights on rental prices and popular localities in the city...",
              image: "trends.jpg"
            },
            {
              title: "Tenant Rights You Should Know",
              excerpt: "Understanding your legal rights as a tenant in Madhya Pradesh...",
              image: "rights.jpg"
            }
          ].map((post, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="h-48 bg-gray-200">
                <div className="h-full flex items-center justify-center text-gray-500">Featured Image</div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <button className="text-blue-600 font-medium">Read More →</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dual CTA Section */}
      <section className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        <div className="bg-blue-800 text-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Are You a Property Owner?</h3>
          <p className="mb-6">List your property with us and reach thousands of potential tenants</p>
          <button className="bg-yellow-400 text-blue-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition">
            List Your Property
          </button>
        </div>

        <div className="bg-white border border-blue-100 rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-blue-900 mb-4">Need Help Finding a Home?</h3>
          <p className="mb-6 text-gray-700">Our rental experts can help you find the perfect place</p>
          <button className="bg-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition">
            Contact Our Agent
          </button>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="bg-blue-900 text-white mt-20 py-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Get the Room4Rent App</h2>
            <p className="text-lg mb-6">Find your perfect home on the go with our mobile application</p>
            <div className="flex gap-4">
              <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2">
                <span className="text-2xl">🍏</span>
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </button>
              <button className="bg-black text-white px-6 py-3 rounded-lg flex items-center gap-2">
                <span className="text-2xl">▶️</span>
                <div className="text-left">
                  <div className="text-xs">Get it on</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-64 h-auto bg-gray-800 rounded-3xl p-2 shadow-2xl">
                <div className="bg-gray-200 rounded-2xl overflow-hidden h-96 flex items-center justify-center">
                  <span className="text-gray-500">App Screenshot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}









