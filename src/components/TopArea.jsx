import { Link } from "react-router-dom";
import { useRef } from "react";

export default function TopArea({ areas = [] }) {
  const scrollerRef = useRef(null);

  const scrollByAmount = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-area-card]");
    const step = card ? card.getBoundingClientRect().width + 16 : 240;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  return (
    <section className="max-w-6xl mx-auto mt-12 px-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold text-blue-800">Top Areas in Indore</h2>
        <Link to="/areas" className="text-blue-700 text-sm font-medium hover:underline">
          View all areas →
        </Link>
      </div>

      <div className="relative">
        {/* Desktop arrows */}
        <button
          type="button"
          aria-label="Scroll areas left"
          onClick={() => scrollByAmount(-1)}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 border shadow hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Scroll areas right"
          onClick={() => scrollByAmount(1)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full bg-white/90 border shadow hover:bg-white"
        >
          ›
        </button>

        {/* Edge gradients as scroll hints */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />

        {/* Scroller with snap */}
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto pb-2 pr-8 -mr-8"
          style={{ scrollSnapType: "x mandatory" }}
          aria-label="Popular areas"
          role="list"
        >
          {areas.map((area) => {
            const photo = area.photo || ""; // optional: provide area.photo from API
            return (
              <Link
                key={area.name}
                to={`/properties?area=${encodeURIComponent(area.name)}`}
                data-area-card
                role="listitem"
                className="snap-start min-w-[180px] max-w-[200px] rounded-2xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {/* Image tile header (fallback to emoji chip bg) */}
                <div className="relative h-28 w-full">
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${area.name} locality`}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-blue-50" />
                  )}
                  <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
                  <div className="absolute top-2 left-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-blue-800 text-2xl">
                    {area.icon || "📍"}
                  </div>
                </div>

                {/* Chip-like body */}
                <div className="p-4">
                  <div className="font-semibold text-blue-900 leading-tight line-clamp-1">
                    {area.name}
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-blue-50 text-blue-800 px-2 py-0.5 text-sm">
                      {area.count || 0} listings
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
