import { useEffect, useState } from 'react';
import API from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import PropertiesMap from '../components/PropertiesMap.jsx';
import HomeSkeleton from '../components/HomeSkeleton';
import { getRecentlyViewed } from '../utils/recentlyViewed';
import {
  Search,
  Heart,
  Shield,
  ShieldCheck,
  Check,
  Star,
  Sparkles,
  ArrowRight,
  BedDouble,
  Bath,
  Armchair,
  MapPin,
  Apple,
  Play,
  Plus,
} from 'lucide-react';

const CACHE_KEY = 'home_data_v2';
const CACHE_TTL = 60 * 60 * 1000;

const HERO_1 = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80&auto=format&fit=crop';
const HERO_2 = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1000&q=80&auto=format&fit=crop';
const HERO_3 = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&q=80&auto=format&fit=crop';
const OWNER_PHOTO = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&q=80&auto=format&fit=crop';
const APP_SHOT = 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80';

const AREA_PHOTOS = {
  'Vijay Nagar': 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
  Palasia: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80',
  'Scheme 54': 'https://images.unsplash.com/photo-1542222024-c39e2281f121?w=800&q=80',
  'Sapna Sangeeta': 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80',
  Nipania: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80',
  'AB Road': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
};
const AREA_PHOTO_POOL = Object.values(AREA_PHOTOS);

function fmtINR(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN');
}

function areaPhoto(name, i = 0) {
  return AREA_PHOTOS[name] || AREA_PHOTO_POOL[i % AREA_PHOTO_POOL.length];
}

const PROPERTY_TYPES = [
  { t: 'Flats', d: '1–3 BHK apartments', value: 'flat', bg: 'oklch(0.94 0.03 60)', Icon: Armchair },
  { t: 'Rooms', d: 'Single & shared', value: 'room', bg: 'oklch(0.94 0.04 150)', Icon: BedDouble },
  { t: 'PG', d: 'Paying guest, meals', value: 'pg', bg: 'oklch(0.94 0.03 30)', Icon: Bath },
  { t: 'Hostels', d: 'Student housing', value: 'hostel', bg: 'oklch(0.93 0.02 240)', Icon: ShieldCheck },
];

const POPULAR_SEARCHES = [
  { label: 'Vijay Nagar 2BHK', area: 'Vijay Nagar', type: 'flat' },
  { label: 'Palasia PG', area: 'Palasia', type: 'pg' },
  { label: 'Scheme 54 furnished', area: 'Scheme 54', type: 'flat' },
  { label: 'AB Road flats', area: 'AB Road', type: 'flat' },
  { label: 'Nipania under ₹10k', area: 'Nipania', type: '' },
];

const FAQS = [
  { q: 'Do you charge brokerage?', a: 'Never. We don\u2019t charge tenants a rupee. Owners pay only when a tenant moves in.' },
  { q: 'How do you verify a property?', a: 'Our Indore team visits every listing in person, checks ownership papers, and shoots the photos you see on-site.' },
  { q: "What if I don't like the flat after moving in?", a: 'You have a 7-day peace-of-mind window. If something material was misrepresented, we help you move out with a full deposit refund.' },
  { q: 'Can I schedule a visit from the app?', a: 'Yes. Pick a slot and the owner gets notified. Most visits happen within 24 hours of the request.' },
  { q: 'Do you help with the rental agreement?', a: 'We draft a standard, lawyer-reviewed agreement both parties e-sign. Stamp paper is optional and handled digitally.' },
];

const HOW_STEPS = [
  { n: '01', t: 'Tell us about you', d: 'A few gentle questions about budget, area, and when you want to move.', Icon: Sparkles },
  { n: '02', t: 'See verified homes', d: 'Every listing is inspected and photographed by our Indore team \u2014 no stock photos, no lies.', Icon: Shield },
  { n: '03', t: 'Visit, chat, decide', d: 'Book visits from the app. Chat directly with owners, never through a broker.', Icon: MapPin },
  { n: '04', t: 'Move in, breathe', d: 'Digital agreement, transparent deposit, and a human on call if anything feels off.', Icon: Check },
];

const TRUST_STATS = [
  { k: 'Zero', v: 'broker fees. Ever.' },
  { k: '48h', v: 'average time to shortlist.' },
  { k: '100%', v: 'of homes visited in person.' },
  { k: '\u20B90', v: 'hidden charges at move-in.' },
];

const OWNER_BENEFITS = [
  'Free professional photos',
  'Verified tenant screening',
  'Digital rent collection',
  'Dedicated relationship lead',
];

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    topAreas: [],
    latestProperties: [],
    featured: [],
    testimonials: [],
    counters: { tenants: 0, verifiedProperties: 0, localities: 0 },
  });
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [searchLocation, setSearchLocation] = useState('Vijay Nagar');
  const [searchType, setSearchType] = useState('flat');
  const [searchBudget, setSearchBudget] = useState('10-20k');

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setData(cached.data);
        setLoading(false);
      }
    } catch (e) { /* ignore stale cache */ }
    setRecentlyViewed(getRecentlyViewed());
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [homeRes, featuredRes, popularAreasRes, testimonialsRes, countersRes] = await Promise.allSettled([
        API.get('/home'),
        API.get('/properties/featured?limit=10'),
        API.get('/home/areas/popular?limit=12'),
        API.get('/testimonials?limit=6&page=1'),
        API.get('/home/counters'),
      ]);

      const next = { ...data };

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await API.get('/wishlist', { headers: { Authorization: `Bearer ${token}` } });
          setWishlistIds(res.data.map((p) => p._id));
        } catch (e) { /* ignore auth fail */ }
      }

      if (homeRes.status === 'fulfilled') {
        const h = homeRes.value.data;
        next.topAreas = h.topAreas || [];
        next.latestProperties = h.latestProperties || [];
        if (!testimonialsRes || testimonialsRes.status !== 'fulfilled') {
          next.testimonials = h.testimonials || [];
        }
      }

      if (featuredRes.status === 'fulfilled') {
        const fp = featuredRes.value.data || [];
        next.featured = fp.length ? fp : next.latestProperties;
      } else {
        next.featured = next.latestProperties;
      }

      if (popularAreasRes.status === 'fulfilled') {
        const popular = popularAreasRes.value.data?.areas || [];
        next.topAreas = popular.length
          ? popular.map((a) => ({ name: a.name, count: a.count }))
          : next.topAreas;
      }

      if (testimonialsRes.status === 'fulfilled') {
        const t = testimonialsRes.value.data?.data || [];
        next.testimonials = t.length ? t : next.testimonials;
      }

      if (countersRes.status === 'fulfilled') {
        next.counters = countersRes.value.data || next.counters;
      }

      setData(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: next })); } catch (e) { /* quota */ }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load home page data');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (overrides = {}) => {
    const loc = overrides.area ?? searchLocation;
    const typ = overrides.type ?? searchType;
    const qs = new URLSearchParams();
    if (loc) qs.append('area', loc);
    if (typ) qs.append('occupancyType', typ);
    if (overrides.q) qs.append('search', overrides.q);
    navigate(`/properties?${qs.toString()}`);
  };

  if (loading && !data.latestProperties.length && !data.featured.length) {
    return <HomeSkeleton />;
  }
  if (error && !data.latestProperties.length && !data.featured.length) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  const FALLBACK_AREAS = [
    { name: 'Vijay Nagar', count: 142 },
    { name: 'Palasia', count: 98 },
    { name: 'Scheme 54', count: 76 },
    { name: 'Sapna Sangeeta', count: 64 },
    { name: 'Nipania', count: 58 },
    { name: 'AB Road', count: 52 },
  ];
  const apiAreaNames = new Set(data.topAreas.map((a) => a.name?.toLowerCase()));
  const areasForGrid = [
    ...data.topAreas,
    ...FALLBACK_AREAS.filter((a) => !apiAreaNames.has(a.name.toLowerCase())),
  ].slice(0, 6);

  const featured = (data.featured || []).slice(0, 8);
  const testimonials = (data.testimonials || []).slice(0, 3);

  const liveViewers = 14;
  const movedThisYear = data.counters.tenants ? data.counters.tenants.toLocaleString('en-IN') + '+' : '3,100+';
  const verifiedCount = data.counters.verifiedProperties || 1284;

  return (
    <div className="bg-paper text-ink">

      {/* HERO */}
      <section className="max-w-[1280px] mx-auto px-6 pt-12 md:pt-16 pb-10 text-center">
        <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs bg-[oklch(0.96_0.02_80)] text-ink">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Indore&apos;s most verified rentals
        </span>

        <h1 className="font-display mt-6 text-[54px] sm:text-[72px] md:text-[108px] leading-[0.96] tracking-[-0.018em]">
          A softer way<br />
          to <em className="italic text-accent not-italic" style={{ fontStyle: 'italic' }}>find</em> a home.
        </h1>

        <p className="mt-6 text-[15px] md:text-[17px] max-w-xl mx-auto text-[color:var(--muted)]">
          No broker calls. No surprise deposits. Just quiet, verified homes across Indore —
          with the people who live in them already vouching for the place.
        </p>

        {/* Pill search */}
        <div className="bg-card border border-rule rounded-[28px] shadow-card mt-10 mx-auto max-w-3xl p-2 flex flex-col sm:flex-row items-stretch">
          <label className="flex-1 text-left px-5 py-3 border-b sm:border-b-0 sm:border-r border-rule">
            <span className="block font-eyebrow text-[10px] text-[color:var(--muted)]">Where</span>
            <input
              type="text"
              className="bg-transparent outline-none w-full text-[15px] mt-1 text-ink placeholder:text-[color:var(--muted)]"
              placeholder="Vijay Nagar"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
            />
          </label>
          <label className="flex-1 text-left px-5 py-3 border-b sm:border-b-0 sm:border-r border-rule">
            <span className="block font-eyebrow text-[10px] text-[color:var(--muted)]">Type</span>
            <select
              className="bg-transparent outline-none w-full text-[15px] mt-1 text-ink"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="">Any</option>
              <option value="flat">Flat</option>
              <option value="room">Room</option>
              <option value="pg">PG</option>
              <option value="hostel">Hostel</option>
            </select>
          </label>
          <label className="flex-1 text-left px-5 py-3 border-b sm:border-b-0 sm:border-r border-rule">
            <span className="block font-eyebrow text-[10px] text-[color:var(--muted)]">Budget</span>
            <select
              className="bg-transparent outline-none w-full text-[15px] mt-1 text-ink"
              value={searchBudget}
              onChange={(e) => setSearchBudget(e.target.value)}
            >
              <option value="">Any</option>
              <option value="u10k">Under ₹10k</option>
              <option value="10-20k">₹10–20k</option>
              <option value="20-40k">₹20–40k</option>
              <option value="40k+">₹40k+</option>
            </select>
          </label>
          <button
            onClick={() => handleSearch()}
            className="inline-flex items-center justify-center gap-2 m-1.5 px-6 py-3 rounded-full bg-ink text-paper text-sm font-medium transition hover:bg-accent"
          >
            <Search className="w-4 h-4" /> Search
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 justify-center items-center text-[13px] text-[color:var(--muted)]">
          <span>Popular:</span>
          {POPULAR_SEARCHES.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSearch({ area: p.area, type: p.type })}
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] bg-[oklch(0.96_0.02_80)] text-ink border border-transparent hover:border-ink transition"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-[color:var(--muted)]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            {liveViewers} people viewing Vijay Nagar
          </span>
          <span className="hidden md:inline">·</span>
          <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-accent" /> Every home visited in person</span>
          <span className="hidden md:inline">·</span>
          <span className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-sage" /> No broker fees, always</span>
        </div>

        {/* Three-photo collage */}
        <div className="grid grid-cols-12 gap-4 mt-16 md:mt-20">
          <div className="col-span-12 md:col-span-5 aspect-[4/5] rounded-[24px] overflow-hidden">
            <img src={HERO_1} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
            <div className="aspect-[5/3] rounded-[24px] overflow-hidden">
              <img src={HERO_2} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="aspect-[5/3] rounded-[24px] overflow-hidden">
              <img src={HERO_3} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-3 bg-card border border-rule rounded-[24px] p-7 flex flex-col justify-between text-left">
            <div>
              <div className="font-display text-[44px] text-accent leading-none">{verifiedCount.toLocaleString('en-IN')}</div>
              <div className="text-[14px] mt-2 text-[color:var(--muted)]">verified homes, all in Indore.</div>
            </div>
            <div className="border-t border-rule pt-4 mt-6">
              <div className="flex -space-x-2 mb-3">
                {['A','P','R','N'].map((l) => (
                  <div key={l} className="w-8 h-8 rounded-full border-2 border-card bg-[oklch(0.96_0.02_80)] flex items-center justify-center text-[11px] font-medium">{l}</div>
                ))}
              </div>
              <div className="text-[13px] text-[color:var(--muted)]">
                <span className="font-medium text-ink">{movedThisYear} tenants</span> moved in this year.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROPERTY TYPES */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <p className="font-eyebrow text-accent">Find your fit</p>
            <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">What are you<br />looking for?</h2>
          </div>
          <Link to="/properties" className="text-[14px] underline underline-offset-4 text-[color:var(--muted)] hover:text-ink">All categories</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PROPERTY_TYPES.map(({ t, d, value, bg, Icon }, idx) => (
            <Link
              key={t}
              to={`/properties?occupancyType=${value}`}
              className="bg-card border border-rule rounded-3xl p-6 hover:-translate-y-1 hover:shadow-card-hover transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                <Icon className="w-7 h-7 text-ink" strokeWidth={1.75} />
              </div>
              <div className="font-display text-[28px] mt-6">{t}</div>
              <div className="text-[14px] mt-1 text-[color:var(--muted)]">{d}</div>
              <div className="mt-6 flex items-center justify-between text-[13px] text-[color:var(--muted)]">
                <span>{[486, 312, 238, 248][idx]} homes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <p className="font-eyebrow text-accent">Handpicked</p>
            <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">Homes we&rsquo;d rent<br />to our best friend.</h2>
          </div>
          <Link to="/properties" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition">
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
          <div className="flex gap-5" style={{ width: 'max-content' }}>
            {featured.length > 0 ? featured.map((p) => (
              <FeaturedHomeCard key={p._id} p={p} saved={wishlistIds.includes(p._id)} />
            )) : [...Array(4)].map((_, i) => (
              <div key={i} className="w-[320px] h-[420px] rounded-3xl bg-card border border-rule animate-pulse" />
            ))}
          </div>
        </div>
      </section>

      {/* RECENTLY VIEWED */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
          <div className="flex items-end justify-between mb-8 md:mb-10 gap-6">
            <div>
              <p className="font-eyebrow text-accent">Continue exploring</p>
              <h2 className="font-display text-[28px] md:text-[40px] mt-2 leading-[1.02]">
                Homes you were<br />looking at.
              </h2>
            </div>
            <Link to="/properties" className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition">
              Keep browsing
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
            <div className="flex gap-5" style={{ width: 'max-content' }}>
              {recentlyViewed.slice(0, 8).map((p) => (
                <article key={p._id} className="w-[260px] md:w-[300px] flex-shrink-0 bg-card border border-rule rounded-3xl overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
                  <Link to={`/properties/${p._id}`} className="block">
                    <div className="aspect-[4/3] overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-[oklch(0.96_0.02_80)]" />
                      )}
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 className="font-semibold text-[15px] md:text-[17px] truncate">{p.title}</h3>
                      <div className="text-[12px] md:text-[13px] mt-0.5 text-[color:var(--muted)] truncate">
                        {p.locality}{p.locality ? ", " : ""}{p.city}
                      </div>
                      <div className="mt-3 pt-3 border-t border-rule flex items-end justify-between">
                        <div>
                          <span className="font-semibold text-[16px] md:text-[18px]">{fmtINR(p.price)}</span>
                          <span className="text-[11px] text-[color:var(--muted)]"> / month</span>
                        </div>
                        <span className="text-[12px] font-medium underline underline-offset-4">View</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AREAS */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <p className="font-eyebrow text-accent">Neighbourhoods</p>
            <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">A home in every<br />corner of Indore.</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {areasForGrid.map((a, i) => (
            <Link
              key={a.name}
              to={`/properties?area=${encodeURIComponent(a.name)}`}
              className="group block"
            >
              <div className="aspect-square rounded-[20px] overflow-hidden relative">
                <img
                  src={areaPhoto(a.name, i)}
                  alt={a.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55))' }} />
                <div className="absolute bottom-3 left-3 text-white">
                  <div className="font-medium text-[15px]">{a.name}</div>
                  <div className="text-[12px] opacity-80">{a.count || 0} homes</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MAP */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <p className="font-eyebrow text-accent">On the map</p>
            <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">Find homes near<br />the places you love.</h2>
          </div>
        </div>
        <div className="bg-card border border-rule rounded-[28px] overflow-hidden relative shadow-card">
          <div className="h-[500px] relative">
            <PropertiesMap />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/10 to-transparent z-20" />
            <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto bg-card/95 backdrop-blur-xl border border-white/80 rounded-[28px] p-5 w-auto sm:w-[320px] shadow-card-hover z-30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-eyebrow text-[color:var(--muted)]">Live map</div>
                  <div className="font-display text-[32px] leading-none mt-1">{verifiedCount.toLocaleString('en-IN')} homes</div>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <MapPin className="w-4 h-4" />
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap mt-4">
                {['Verified', 'Pet friendly', 'Parking'].map((t) => (
                  <span key={t} className="inline-flex items-center rounded-full px-3 py-1.5 text-[12px] bg-paper text-ink border border-rule">{t}</span>
                ))}
              </div>
              <Link to="/properties" className="w-full mt-5 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition">
                Open full map
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
          <div className="grid grid-cols-12 gap-10 items-start">
            <div className="col-span-12 md:col-span-4">
              <p className="font-eyebrow text-accent">Tenants say</p>
              <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">People actually<br />liked renting here.</h2>
              <p className="mt-6 text-[15px] text-[color:var(--muted)] leading-relaxed">
                We read every review. The things people mention most? No hidden fees, honest photos, and owners who pick up the phone.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex items-center gap-1 text-accent">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <div className="text-[14px]"><b>4.8</b> · 2,140 reviews</div>
              </div>
            </div>
            <div className="col-span-12 md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t, i) => (
                <div key={i} className="bg-card border border-rule rounded-3xl p-6">
                  <div className="flex items-center gap-1 mb-4 text-accent">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <p className="text-[15px] leading-relaxed">&ldquo;{t.feedback || t.text}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-rule">
                    <div className="w-9 h-9 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center font-medium text-[13px]">
                      {(t.name || 'U')[0]}
                    </div>
                    <div>
                      <div className="text-[14px] font-medium">{t.name || 'User'}</div>
                      {t.area && <div className="text-[12px] text-[color:var(--muted)]">{t.area}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div>
            <p className="font-eyebrow text-accent">How it works</p>
            <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">Four slow steps<br />from search to keys.</h2>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[13px] text-[color:var(--muted)]">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Typical move-in: 3–5 days
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {HOW_STEPS.map((s) => (
            <div key={s.n} className="bg-card border border-rule rounded-3xl p-7">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[oklch(0.96_0.02_80)] text-accent">
                  <s.Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="font-display text-[36px] text-rule">{s.n}</div>
              </div>
              <div className="font-display text-[24px] mt-6">{s.t}</div>
              <div className="text-[14px] mt-2 leading-relaxed text-[color:var(--muted)]">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST STRIP STATS */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="bg-card border border-rule rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-rule">
            {TRUST_STATS.map((x) => (
              <div key={x.k} className="p-10 text-center">
                <div className="font-display text-[56px] text-accent leading-none">{x.k}</div>
                <div className="text-[14px] mt-2 text-[color:var(--muted)]">{x.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OWNER CTA */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="border border-rule rounded-3xl overflow-hidden" style={{ background: 'oklch(0.96 0.015 150)' }}>
          <div className="grid grid-cols-12 items-stretch">
            <div className="col-span-12 md:col-span-7 p-8 md:p-16">
              <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs bg-white/80 text-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                For property owners
              </span>
              <h2 className="font-display text-[36px] md:text-[52px] mt-5 leading-[1]">
                Own a flat or PG?<br />
                <em className="italic text-accent">Let it rest with us.</em>
              </h2>
              <p className="mt-5 text-[15px] md:text-[16px] max-w-md text-[color:var(--muted)]">
                We photograph your property, screen tenants, handle visits, and draft agreements — so your weekends stay yours.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[14px]">
                {OWNER_BENEFITS.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sage" strokeWidth={2} />
                    {f}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/postProperty" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition">
                  List your property <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition">
                  Talk to an expert
                </Link>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 relative h-[320px] md:h-auto min-h-[320px]">
              <img src={OWNER_PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute bottom-5 left-5 right-5 bg-card border border-rule rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center font-medium text-[14px]">S</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">Suresh listed 2 flats</div>
                    <div className="text-[11px] text-[color:var(--muted)] truncate">Both rented in 9 days · Vijay Nagar</div>
                  </div>
                  <div className="font-display text-[22px] text-accent">₹41k</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-4">
            <p className="font-eyebrow text-accent">Good questions</p>
            <h2 className="font-display text-[32px] md:text-[44px] mt-2 leading-[1.02]">Questions,<br />answered gently.</h2>
            <p className="mt-5 text-[15px] text-[color:var(--muted)]">
              Can&rsquo;t find what you&rsquo;re looking for? Write to us at{' '}
              <a href="mailto:hello@rentora.in" className="underline underline-offset-4 text-ink">hello@rentora.in</a>.
            </p>
          </div>
          <div className="col-span-12 md:col-span-8">
            {FAQS.map((f, i) => (
              <details key={i} className="border-b border-rule py-5 group">
                <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                  <span className="font-display text-[20px] md:text-[22px]">{f.q}</span>
                  <span className="w-8 h-8 rounded-full border border-rule flex items-center justify-center transition shrink-0 group-open:rotate-45">
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </span>
                </summary>
                <p className="mt-4 text-[15px] leading-relaxed max-w-xl text-[color:var(--muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* APP */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24 pb-24">
        <div className="border border-rule rounded-3xl overflow-hidden" style={{ background: 'oklch(0.94 0.03 80)' }}>
          <div className="grid grid-cols-12 items-center">
            <div className="col-span-12 md:col-span-7 p-8 md:p-16">
              <p className="font-eyebrow text-accent">On the go</p>
              <h2 className="font-display text-[36px] md:text-[52px] mt-2 leading-[1]">The calmest home hunt<br />fits in a pocket.</h2>
              <p className="mt-6 text-[15px] md:text-[16px] max-w-md text-[color:var(--muted)]">
                Save homes, chat with owners, schedule visits and pay rent. All in one place, gently designed.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition">
                  <Apple className="w-4 h-4" /> App Store
                </button>
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition">
                  <Play className="w-4 h-4" /> Google Play
                </button>
              </div>
            </div>
            <div className="col-span-12 md:col-span-5 p-8 md:p-0 md:pr-16 flex justify-center md:justify-end">
              <div className="w-[220px] md:w-[240px] aspect-[9/19] rounded-[40px] border-[10px] border-ink overflow-hidden shadow-card">
                <img src={APP_SHOT} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeaturedHomeCard({ p, saved }) {
  const image = p.images?.[0] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80&auto=format&fit=crop';
  const bhk = p.bedrooms != null ? `${p.bedrooms} BHK` : (p.occupancyType || 'Home');
  const bath = p.attachedBathroom === 'Yes' ? 'Private' : p.attachedBathroom === 'No' ? 'Shared' : 'Private';
  const furnish = (p.furnishing || '').split(' ')[0] || 'Furnished';

  return (
    <article className="w-[300px] md:w-[320px] flex-shrink-0 bg-card border border-rule rounded-3xl overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300">
      <Link to={`/properties/${p._id}`} className="block">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={image} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <button
            type="button"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Save home"
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : 'text-ink'}`} />
          </button>
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] bg-white/95">
            <Shield className="w-3 h-3 text-accent" /> Verified
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-[17px] truncate">{p.title}</h3>
              <div className="text-[13px] mt-0.5 text-[color:var(--muted)] truncate">{p.locality}, {p.city}</div>
            </div>
            <div className="flex items-center gap-1 text-[13px] shrink-0">
              <Star className="w-3.5 h-3.5 fill-accent text-accent" /> 4.9
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-[12px] text-[color:var(--muted)]">
            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {bhk}</span>
            <span className="flex items-center gap-1"><Armchair className="w-3.5 h-3.5" /> {furnish}</span>
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {bath}</span>
          </div>
          <div className="mt-5 pt-4 border-t border-rule flex items-end justify-between">
            <div>
              <span className="font-semibold text-[20px]">{fmtINR(p.price)}</span>
              <span className="text-[12px] text-[color:var(--muted)]"> / month</span>
            </div>
            <span className="text-[13px] font-medium underline underline-offset-4">View home</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
