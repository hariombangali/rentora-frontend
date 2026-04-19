import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { to: "/properties", label: "Browse listings" },
    { to: "/postProperty", label: "List your property" },
  ];

  const supportLinks = [
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/terms", label: "Terms" },
    { to: "/privacy", label: "Privacy" },
  ];

  const socials = [
    { href: "https://facebook.com/", label: "Facebook", Icon: Facebook },
    { href: "https://twitter.com/", label: "Twitter", Icon: Twitter },
    { href: "https://instagram.com/", label: "Instagram", Icon: Instagram },
    { href: "https://linkedin.com/", label: "LinkedIn", Icon: Linkedin },
    { href: "mailto:info@rentora.in", label: "Email", Icon: Mail },
  ];

  return (
    <footer className="mt-20 bg-ink text-paper/80">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold font-display text-base">R</span>
              <span className="font-display font-semibold text-paper text-xl">Rentora</span>
            </Link>
            <p className="text-sm text-paper/60 leading-relaxed mb-6 max-w-xs">
              Verified rooms, PGs, flats, and hostels across Indore — with a calm, trusted search experience.
            </p>
            <div className="flex gap-2 flex-wrap">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target={s.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={s.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  className="w-9 h-9 rounded-full border border-paper/10 bg-paper/5 flex items-center justify-center text-paper/60 hover:bg-paper/10 hover:text-paper transition"
                >
                  <s.Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="font-eyebrow text-paper/40 mb-4">Quick links</p>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-paper/60 hover:text-paper transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="font-eyebrow text-paper/40 mb-4">Support</p>
            <ul className="space-y-3">
              {supportLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-paper/60 hover:text-paper transition">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-eyebrow text-paper/40 mb-4">Contact</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-paper/60">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                <span>Indore, Madhya Pradesh</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-paper/60">
                <Mail className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                <a href="mailto:info@rentora.in" className="hover:text-paper transition">info@rentora.in</a>
              </div>
              <div className="flex items-start gap-3 text-sm text-paper/60">
                <Phone className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
                <span className="text-paper/40">Coming soon</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-paper/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-paper/40">
          <span>© {year} Rentora. All rights reserved.</span>
          <span>Made with care in Indore</span>
        </div>
      </div>
    </footer>
  );
}
