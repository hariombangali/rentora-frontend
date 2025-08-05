export default function FilterSidebar({ area, setArea, type, setType, minRent, setMinRent, maxRent, setMaxRent }) {
  return (
    <aside className="bg-white rounded-xl shadow-lg p-6 space-y-6 sticky top-24">
      {/* Sidebar Title */}
      <h3 className="text-xl font-semibold text-blue-900 border-b border-gray-200 pb-2 mb-4">
        Filter Your Search
      </h3>

      {/* Area Filter */}
      <div>
        <label htmlFor="area" className="block text-gray-700 font-medium mb-1">
          Location
        </label>
        <select
          id="area"
          value={area}
          onChange={e => setArea(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-gray-800
             focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
        >
          <option value="">All Areas</option>
          <option value="Palasia">Palasia</option>
          <option value="Vijay Nagar">Vijay Nagar</option>
          <option value="Sudama Nagar">Sudama Nagar</option>
        </select>
      </div>

      {/* Type Filter */}
      <div>
        <label htmlFor="type" className="block text-gray-700 font-medium mb-1">
          Room Type
        </label>
        <select
          id="type"
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 text-gray-800
             focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
        >
          <option value="">All Types</option>
          <option value="1BHK">1BHK</option>
          <option value="2BHK">2BHK</option>
          <option value="PG">PG</option>
        </select>
      </div>

      {/* Rent Range */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Rent Range (₹)</label>
        <div className="flex space-x-3">
          <input
            type="number"
            placeholder="Min"
            value={minRent}
            onChange={e => setMinRent(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-md p-2 text-gray-800 
              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            min={0}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxRent}
            onChange={e => setMaxRent(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-md p-2 text-gray-800 
              focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            min={0}
          />
        </div>
      </div>

      {/* Optional: Reset Filters Button */}
      <button
        type="button"
        onClick={() => {
          setArea("");
          setType("");
          setMinRent("");
          setMaxRent("");
        }}
        className="w-full bg-yellow-400 text-blue-900 font-semibold rounded-md py-2 mt-2 hover:bg-yellow-300 transition"
      >
        Reset Filters
      </button>
    </aside>
  );
}
