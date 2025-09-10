import { Link } from "react-router-dom";

function FacebookIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 2.1A2.1 2.1 0 0 1 19.1 4.2V19.8A2.1 2.1 0 0 1 17 21.9H7A2.1 2.1 0 0 1 4.9 19.8V4.2A2.1 2.1 0 0 1 7 2.1h10zm-2.67 5.7h-1.48c-.32 0-.55.16-.55.56V10h2l-.27 2h-1.73V18h-2.1v-6H8.7v-2h1.2V7.93A2.27 2.27 0 0 1 12.22 6h2.11v2.1z" />
    </svg>
  );
}
function TwitterIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.633 7.997c.013.18.013.363.013.545 0 5.553-4.227 11.954-11.954 11.954-2.376 0-4.588-.698-6.45-1.893a8.457 8.457 0 0 0 6.24-1.747 4.184 4.184 0 0 1-3.907-2.898c.259.049.519.075.792.075a4.177 4.177 0 0 0 1.785-.222 4.179 4.179 0 0 1-3.349-4.096v-.053a4.198 4.198 0 0 0 1.878.524 4.182 4.182 0 0 1-1.293-5.58A11.88 11.88 0 0 0 12.065 8.55a4.72 4.72 0 0 1-.104-.956A4.182 4.182 0 0 1 16.46 3.84a8.392 8.392 0 0 0 2.661-1.015 4.174 4.174 0 0 1-1.836 2.307 8.392 8.392 0 0 0 2.432-.661 8.972 8.972 0 0 1-2.087 2.153z" />
    </svg>
  );
}
function EmailIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5v10h16V8zm-8 3 8-5H4l8 5z" />
    </svg>
  );
}

export default function Footer() {
  const socialLinks = [
    { href: "https://facebook.com/", label: "Facebook", Icon: FacebookIcon },
    { href: "https://twitter.com/", label: "Twitter", Icon: TwitterIcon },
    { href: "mailto:info@room4rentindore.com", label: "Email", Icon: EmailIcon },
  ];

  // Static for now; can be wired to your Top Areas API
  const popularAreas = [
    "Vijay Nagar",
    "Gita Bhawan",
    "Khajrana",
    "Mahalaxmi Nagar",
    "Sapna Sangeeta",
  ];

  const propertyTypes = [
    { label: "Flats", value: "flat" },
    { label: "Rooms", value: "room" },
    { label: "PGs", value: "pg" },
    { label: "Hostels", value: "hostel" },
  ];

  return (
    <footer
      aria-label="Footer"
      className="mt-16 w-full bg-gradient-to-tr from-blue-800 to-blue-600 text-white pt-12 pb-8 px-6 sm:px-12"
    >
      <div className="max-w-7xl mx-auto">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand + contact */}
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-9 h-9 rounded bg-yellow-300" aria-hidden="true" />
              <span className="font-extrabold text-2xl tracking-wide">
                Room4Rent <span className="text-yellow-300">Indore</span>
              </span>
            </div>
            <p className="mt-3 text-blue-100">
              Verified rooms, PGs, and flats across Indore—find and move with confidence [2].  
            </p>
            <div className="mt-4 space-y-1 text-sm text-blue-100/90">
              <p>Indore, Madhya Pradesh</p>
              <p>
                Email:{" "}
                <a href="mailto:info@room4rentindore.com" className="underline decoration-yellow-300 hover:text-yellow-300">
                  info@room4rentindore.com
                </a>
              </p>
            </div>
            <div className="mt-4 flex gap-3" aria-label="Social links">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-full bg-white/10 hover:bg-yellow-300 hover:text-blue-900 transition"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <form
              className="mt-5"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <label htmlFor="email-sub" className="sr-only">Subscribe for updates</label>
              <div className="flex rounded-lg overflow-hidden border border-white/20 bg-white/10 backdrop-blur-sm">
                <input
                  id="email-sub"
                  type="email"
                  placeholder="Enter email for rental updates"
                  className="flex-1 bg-transparent px-3 py-2 text-sm placeholder-blue-100/70 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="bg-yellow-300 text-blue-900 px-3 py-2 text-sm font-semibold hover:bg-yellow-200"
                >
                  Subscribe
                </button>
              </div>
              <p className="mt-1 text-xs text-blue-100/80">No spam, unsubscribe anytime [3].</p>
            </form>
          </div>

          {/* Explore */}
          <nav aria-label="Explore" className="text-sm">
            <h3 className="font-semibold text-yellow-200">Explore</h3>
            <ul role="list" className="mt-3 space-y-2">
              <li><Link to="/properties" className="hover:underline">Browse Listings</Link></li>
              {propertyTypes.map((t) => (
                <li key={t.value}>
                  <Link to={`/properties?occupancyType=${t.value}`} className="hover:underline">
                    {t.label}
                  </Link>
                </li>
              ))}
              <li><Link to="/owner/list-property" className="hover:underline">List Your Property</Link></li>
            </ul>
          </nav>

          {/* Popular Areas */}
          <nav aria-label="Popular Areas" className="text-sm">
            <h3 className="font-semibold text-yellow-2 00">Popular Areas</h3>
            <ul role="list" className="mt-3 space-y-2">
              {popularAreas.map((name) => (
                <li key={name}>
                  <Link to={`/properties?area=${encodeURIComponent(name)}`} className="hover:underline">
                    {name}
                  </Link>
                </li>
              ))}
              <li><Link to="/areas" className="hover:underline">See All Areas</Link></li>
            </ul>
          </nav>

          {/* Support & Legal */}
          <nav aria-label="Support and Legal" className="text-sm">
            <h3 className="font-semibold text-yellow-200">Support & Legal</h3>
            <ul role="list" className="mt-3 space-y-2">
              <li><Link to="/about" className="hover:underline">About</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
              <li><Link to="/help" className="hover:underline">Help Center</Link></li>
              <li><Link to="/terms" className="hover:underline">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
            </ul>

            {/* App badges */}
            <div className="mt-4 flex gap-2">
              <a aria-label="App Store" href="#" className="bg-black text-white px-3 py-2 rounded-lg text-xs font-semibold"> App Store</a>
              <a aria-label="Google Play" href="#" className="bg-black text-white px-3 py-2 rounded-lg text-xs font-semibold">▶ Google Play</a>
            </div>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-white/20"></div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs md:text-sm text-blue-100/90">
          <span>© 2025 Room4Rent Indore. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <Link to="/sitemap" className="hover:underline">Sitemap</Link>
            <span className="hidden md:inline">•</span>
            <span>Made with <span className="text-pink-300">♥</span> in Indore</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
