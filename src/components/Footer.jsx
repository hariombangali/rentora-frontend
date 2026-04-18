import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
} from "lucide-react";

function FooterTitle({ children }) {
  return (
    <h3 className="text-sm font-semibold tracking-wide text-white">
      {children}
    </h3>
  );
}

function FooterLink({ to, href, children, external = false }) {
  const base =
    "group relative inline-flex w-fit items-center gap-1 text-sm text-white/70 transition-colors hover:text-white";
  const underline =
    "after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-white/70 after:transition-all after:duration-300 after:ease-out hover:after:w-full";

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={`${base} ${underline}`}
      >
        {children}
        {external ? (
          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
        ) : null}
      </a>
    );
  }

  return (
    <Link to={to} className={`${base} ${underline}`}>
      {children}
    </Link>
  );
}

function SocialButton({ href, label, Icon }) {
  return (
    <motion.a
      href={href}
      aria-label={label}
      target={href?.startsWith("mailto:") ? undefined : "_blank"}
      rel={href?.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      whileHover={{ y: -2, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 shadow-sm shadow-black/20 backdrop-blur transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-4 focus:ring-white/10"
    >
      <Icon className="h-5 w-5" />
    </motion.a>
  );
}

function ContactRow({ Icon, children }) {
  return (
    <div className="flex items-start gap-3 text-sm text-white/70">
      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  const quickLinks = [
    { to: "/properties", label: "Browse listings" },
    { to: "/owner/list-property", label: "List your property" },
    { to: "/areas", label: "Popular areas" },
    { to: "/sitemap", label: "Sitemap" },
  ];

  const supportLinks = [
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/help", label: "Help center" },
    { to: "/terms", label: "Terms" },
    { to: "/privacy", label: "Privacy" },
  ];

  const socials = [
    { href: "https://facebook.com/", label: "Facebook", Icon: Facebook },
    { href: "https://twitter.com/", label: "Twitter", Icon: Twitter },
    { href: "https://instagram.com/", label: "Instagram", Icon: Instagram },
    { href: "https://linkedin.com/", label: "LinkedIn", Icon: Linkedin },
    { href: "mailto:info@room4rentindore.com", label: "Email", Icon: Mail },
  ];

  return (
    <motion.footer
      aria-label="Footer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="mt-16 border-t border-white/10 bg-[#070A12] text-white"
    >
      {/* Subtle background accents */}
      <div className="pointer-events-none relative">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-36 top-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="grid gap-10 px-6 py-10 sm:px-8 lg:grid-cols-4 lg:gap-12 lg:px-10">
            {/* Brand / About */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-extrabold tracking-tight">
                  R4
                </div>
                <div className="leading-tight">
                  <p className="text-base font-semibold">Room4Rent Indore</p>
                  <p className="text-xs text-white/60">
                    Verified rentals across Indore
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/65">
                Find rooms, PGs, flats, and hostels with a clean search
                experience and trusted listings.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <SocialButton
                    key={s.label}
                    href={s.href}
                    label={s.label}
                    Icon={s.Icon}
                  />
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="space-y-4">
              <FooterTitle>Quick links</FooterTitle>
              <ul className="space-y-3">
                {quickLinks.map((l) => (
                  <li key={l.label}>
                    <FooterLink to={l.to}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <FooterTitle>Support</FooterTitle>
              <ul className="space-y-3">
                {supportLinks.map((l) => (
                  <li key={l.label}>
                    <FooterLink to={l.to}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <FooterTitle>Contact</FooterTitle>

              <div className="space-y-4">
                <ContactRow Icon={MapPin}>
                  <p className="font-medium text-white/85">Indore, MP</p>
                  <p className="text-white/55">
                    Local support for tenants and owners
                  </p>
                </ContactRow>

                <ContactRow Icon={Mail}>
                  <a
                    href="mailto:info@room4rentindore.com"
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    info@room4rentindore.com
                  </a>
                </ContactRow>

                <ContactRow Icon={Phone}>
                  <span className="text-white/55">
                    Phone support coming soon
                  </span>
                </ContactRow>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 px-6 py-6 sm:px-8 lg:px-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/45">
                © {year} Room4Rent Indore. All rights reserved.
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/50">
                <FooterLink to="/privacy">Privacy</FooterLink>
                <FooterLink to="/terms">Terms</FooterLink>
                <span className="hidden sm:inline">•</span>
                <span>
                  Made in <span className="text-white/70">Indore</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Small spacing below card */}
        <div className="h-10" />
      </div>
    </motion.footer>
  );
}
