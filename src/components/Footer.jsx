import { Link } from "react-router-dom";

function FacebookIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17 2.1A2.1 2.1 0 0 1 19.1 4.2V19.8A2.1 2.1 0 0 1 17 21.9H7A2.1 2.1 0 0 1 4.9 19.8V4.2A2.1 2.1 0 0 1 7 2.1h10zm-2.67 5.7h-1.48c-.32 0-.55.16-.55.56V10h2l-.27 2h-1.73V18h-2.1v-6H8.7v-2h1.2V7.93A2.27 2.27 0 0 1 12.22 6h2.11v2.1z" />
    </svg>
  );
}

function TwitterIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.633 7.997c.013.18.013.363.013.545 0 5.553-4.227 11.954-11.954 11.954-2.376 0-4.588-.698-6.45-1.893a8.457 8.457 0 0 0 6.24-1.747 4.184 4.184 0 0 1-3.907-2.898c.259.049.519.075.792.075a4.177 4.177 0 0 0 1.785-.222 4.179 4.179 0 0 1-3.349-4.096v-.053a4.198 4.198 0 0 0 1.878.524 4.182 4.182 0 0 1-1.293-5.58A11.88 11.88 0 0 0 12.065 8.55a4.72 4.72 0 0 1-.104-.956A4.182 4.182 0 0 1 16.46 3.84a8.392 8.392 0 0 0 2.661-1.015 4.174 4.174 0 0 1-1.836 2.307 8.392 8.392 0 0 0 2.432-.661 8.972 8.972 0 0 1-2.087 2.153z" />
    </svg>
  );
}

function EmailIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
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

  return (
    <footer
      aria-label="Footer"
      className="bg-gradient-to-tr from-blue-800 to-blue-600 text-white pt-12 pb-8 px-6 sm:px-12 mt-16 w-full"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:justify-between gap-y-6 md:gap-x-16">
        {/* Branding and tagline */}
        <div className="flex flex-col items-center md:items-start max-w-xs text-center md:text-left">
          <span className="font-extrabold text-3xl tracking-wider mb-2">
            Room4Rent <span className="text-yellow-300">Indore</span>
          </span>
          <span className="italic text-base text-gray-200 leading-relaxed">
            Find your perfect room or flat easily in Indore
          </span>

          {/* Social Links */}
          <div className="flex gap-4 mt-4">
            {socialLinks.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="p-2 rounded-full bg-blue-700 hover:bg-yellow-300 hover:text-blue-900 transition transform hover:scale-110"
              >
                <Icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>

        {/* Useful links */}
        <nav
          className="flex flex-col md:flex-row items-center md:items-end gap-3 mt-6 md:mt-0 text-sm font-medium"
          aria-label="Useful Links"
        >
          {[
            { to: "/", label: "Home" },
            { to: "/properties", label: "Browse Listings" },
            { to: "/owner/list-property", label: "List Property" },
            { to: "/contact", label: "Contact Us" },
          ].map(({ to, label }) => (
            <Link
              to={to}
              key={label}
              tabIndex={0}
              className="relative group px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300"
            >
              {label}
              <span className="absolute left-0 bottom-0 w-0 group-hover:w-full h-0.5 bg-yellow-300 transition-all"></span>
            </Link>
          ))}
          <span className="mt-3 md:mt-0 text-xs text-gray-300 max-w-xs text-center md:text-right">
            Need help?{" "}
            <a
              href="mailto:info@room4rentindore.com"
              className="underline hover:text-yellow-300"
            >
              info@room4rentindore.com
            </a>
          </span>
        </nav>
      </div>

      {/* Divider */}
      <div className="my-6 border-t border-yellow-300/40"></div>

      {/* Bottom copyright */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs md:text-sm text-gray-300 font-light tracking-wide">
        <span>© 2025 Room4Rent Indore. All rights reserved.</span>
        <span>
          Designed with <span className="text-pink-400 font-semibold">♥</span> for
          Indore
        </span>
      </div>
    </footer>
  );
}
