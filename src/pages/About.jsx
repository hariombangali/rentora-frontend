import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-800">
      {/* Hero */}
      <section className="mb-10 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-4 text-center">
          About <span className="text-yellow-400">Room4Rent Indore</span>
        </h1>
        <p className="text-lg text-center text-gray-600 max-w-2xl">
          Room4Rent Indore is your trusted platform for finding and listing rooms, flats, PGs and hostels across Indore city—designed for students, professionals, families and property owners. We connect real people, real homes, and make renting safe, easy and transparent.
        </p>
      </section>

      {/* Platform Highlights */}
      <section className="mb-8 grid md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg shadow">
          <span className="text-3xl mb-2">🏠</span>
          <h2 className="font-bold text-xl mb-1">Wide Choice</h2>
          <p className="text-gray-600 text-center">Hundreds of verified rooms, PGs, and flats from every major Indore area—Palasia, Vijay Nagar, Sudama Nagar and more.</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg shadow">
          <span className="text-3xl mb-2">🔎</span>
          <h2 className="font-bold text-xl mb-1">Easy Search</h2>
          <p className="text-gray-600 text-center">Smart filters for budget, area, type and availability. Find your home in seconds—before someone else does!</p>
        </div>
        <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg shadow">
          <span className="text-3xl mb-2">🤝</span>
          <h2 className="font-bold text-xl mb-1">Direct Connection</h2>
          <p className="text-gray-600 text-center">Contact flat/room owners directly—no agent/commission. Transparency and trust, always.</p>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-10">
        <h3 className="font-semibold text-2xl text-blue-700 mb-3">How Room4Rent Works?</h3>
        <ul className="list-decimal list-inside space-y-2 text-gray-700">
          <li><b>Rent Seekers:</b> Search and filter listings, view details, and contact owner—absolutely free.</li>
          <li><b>Owners:</b> Register and list your property with all details and photos in under 2 minutes.</li>
          <li><b>Safety First:</b> Listings are carefully reviewed, owners verified, and spam is removed. Users can report suspicious ads.</li>
          <li><b>No Hidden Charges:</b> We are 100% commission-free for both owners and renters.</li>
          <li><b>Support:</b> Got questions? Our Indore-based support team is always reachable.</li>
        </ul>
      </section>

      {/* Vision/Why Trust */}
      <section className="mb-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-xl text-blue-700 mb-2">Our Mission</h4>
            <p>
              To simplify the house-hunting process for Indore’s youth, job seekers, and families by building an honest, tech-powered rental marketplace.
            </p>
            <ul className="list-disc ml-6 mt-3 text-gray-700 space-y-1">
              <li>Empowering owners to reach real renters easily</li>
              <li>Making home search safe for locals and newcomers alike</li>
              <li>Growing Indore’s rental market the right way</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-xl text-blue-700 mb-2">Why Choose Us?</h4>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Free for all—always</li>
              <li>No brokers, no scams</li>
              <li>Verified listings/photos</li>
              <li>Responsive local support</li>
              <li>User privacy & data safety prioritized</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Optional: Team or Call to Action */}
      <section className="bg-blue-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h5 className="text-lg font-semibold text-blue-700 mb-1">Want to know more or need help?</h5>
          <p className="text-gray-700 mb-1">
            Reach out to our support team any time at{" "}
            <a href="mailto:info@room4rentindore.com" className="underline text-blue-700 hover:text-yellow-400">
              info@room4rentindore.com
            </a>
          </p>
        </div>
        <Link to="/properties" className="mt-2 md:mt-0 bg-blue-700 text-white font-bold px-6 py-2 rounded hover:bg-yellow-400 hover:text-blue-800 transition">
          Browse All Listings
        </Link>
      </section>
    </div>
  );
}
