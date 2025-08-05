import { Link } from "react-router-dom";


export default function Footer() {
  return (
    <footer className="bg-gradient-to-tr from-blue-800 to-blue-600 text-white pt-8 pb-6 px-4 mt-12 w-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:justify-between gap-8">

        {/* Branding and tagline */}
        <div className="flex flex-col items-center md:items-start">
          <span className="font-extrabold text-2xl tracking-wider mb-1">Room4Rent <span className="text-yellow-300">Indore</span></span>
          <span className="italic text-sm text-gray-200">Find your perfect room or flat easily in Indore</span>
          {/* Social Links */}
          <div className="flex gap-3 mt-3">
            <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-yellow-300 transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 2.1A2.1 2.1 0 0 1 19.1 4.2V19.8A2.1 2.1 0 0 1 17 21.9H7A2.1 2.1 0 0 1 4.9 19.8V4.2A2.1 2.1 0 0 1 7 2.1h10zm-2.67 5.7h-1.48c-.32 0-.55.16-.55.56V10h2l-.27 2h-1.73V18h-2.1v-6H8.7v-2h1.2V7.93A2.27 2.27 0 0 1 12.22 6h2.11v2.1z"/></svg>
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-yellow-300 transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.633 7.997c.013.18.013.363.013.545 0 5.553-4.227 11.954-11.954 11.954-2.376 0-4.588-.698-6.45-1.893a8.457 8.457 0 0 0 6.24-1.747 4.184 4.184 0 0 1-3.907-2.898c.259.049.519.075.792.075a4.177 4.177 0 0 0 1.785-.222 4.179 4.179 0 0 1-3.349-4.096v-.053a4.198 4.198 0 0 0 1.878.524 4.182 4.182 0 0 1-1.293-5.58A11.88 11.88 0 0 0 12.065 8.55a4.72 4.72 0 0 1-.104-.956A4.182 4.182 0 0 1 16.46 3.84a8.392 8.392 0 0 0 2.661-1.015 4.174 4.174 0 0 1-1.836 2.307 8.392 8.392 0 0 0 2.432-.661 8.972 8.972 0 0 1-2.087 2.153z"/></svg>
            </a>
            <a href="mailto:info@room4rentindore.com" aria-label="Email" className="hover:text-yellow-300 transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5v10h16V8zm-8 3 8-5H4l8 5z"/></svg>
            </a>
          </div>
        </div>

        {/* Useful links */}
        <div className="flex flex-col items-center md:items-end gap-2 mt-4 md:mt-0">
          <div className="flex gap-6 text-sm">
            <Link to="/" className="hover:text-yellow-300 transition">Home</Link>
            <Link to="/properties" className="hover:text-yellow-300 transition">Browse Listings</Link>
            <Link to="/owner/list-property" className="hover:text-yellow-300 transition">List Property</Link>
            <Link to="/contact" className="hover:text-yellow-300 transition">Contact Us</Link>
          </div>
          <span className="mt-2 text-xs text-gray-200">
            Need help? <a href="mailto:info@room4rentindore.com" className="underline hover:text-yellow-300">info@room4rentindore.com</a>
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-gray-400/30"></div>

      {/* Bottom copyright */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-gray-200">
        <span>© 2025 Room4Rent Indore. All rights reserved.</span>
        <span>
          Designed with <span className="text-pink-400 font-bold">♥</span> for Indore
        </span>
      </div>
    </footer>
  );
}
