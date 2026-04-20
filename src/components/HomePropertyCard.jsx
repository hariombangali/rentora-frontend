import { Link } from "react-router-dom";
import { Heart, Shield, Star, BedDouble, Bath, Armchair } from "lucide-react";

const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

export default function HomePropertyCard({ p, saved, width = "w-[300px] md:w-[320px]" }) {
  const image = p.images?.[0] || p.image || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80&auto=format&fit=crop";
  const bhk = p.bedrooms != null ? `${p.bedrooms} BHK` : (p.occupancyType || "Home");
  const bath = p.attachedBathroom === "Yes" ? "Private" : p.attachedBathroom === "No" ? "Shared" : "Private";
  const furnish = (p.furnishing || "").split(" ")[0] || "Furnished";
  const locality = p.location?.locality || p.locality || "";
  const city = p.location?.city || p.city || "Indore";

  return (
    <article className={`${width} flex-shrink-0 bg-card border border-rule rounded-3xl overflow-hidden hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300`}>
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
            <Heart className={`w-4 h-4 ${saved ? "fill-red-500 text-red-500" : "text-ink"}`} />
          </button>
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] bg-white/95">
            <Shield className="w-3 h-3 text-accent" /> Verified
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-[17px] truncate">{p.title}</h3>
              <div className="text-[13px] mt-0.5 text-[color:var(--muted)] truncate">{locality}{locality ? ", " : ""}{city}</div>
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
