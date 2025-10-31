export default function FilterSidebar({
  area,
  setArea,
  type,
  setType,
  minRent,
  setMinRent,
  maxRent,
  setMaxRent,
  areas = ["Palasia", "Vijay Nagar", "Sudama Nagar"],
  types = ["1BHK", "2BHK", "PG"],
  showTitle = true,
  showReset = false,
  onReset
}) {
  const handleMinBlur = () => {
    if (minRent === "" || maxRent === "") return;
    const min = Number(minRent);
    const max = Number(maxRent);
    if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      setMaxRent(String(min));
    }
  };

  const handleMaxBlur = () => {
    if (minRent === "" || maxRent === "") return;
    const min = Number(minRent);
    const max = Number(maxRent);
    if (!Number.isNaN(min) && !Number.isNaN(max) && max < min) {
      setMinRent(String(max));
    }
  };

  const resetLocal = () => {
    if (onReset) {
      onReset();
    } else {
      setArea("");
      setType("");
      setMinRent("");
      setMaxRent("");
    }
  };

  return (
    <div className="space-y-5">
      {showTitle && (
        <h3 className="text-base sm:text-lg font-semibold text-blue-900">
          Filter your search
        </h3>
      )}

      {/* Location */}
      <div>
        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <div className="relative">
          <select
            id="area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800
                       focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          >
            <option value="">All Areas</option>
            {areas.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Room Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Room Type
        </label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800
                     focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Rent Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rent Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
            onBlur={handleMinBlur}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 
                       focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            onBlur={handleMaxBlur}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 
                       focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Enter numbers only; values auto-adjust so Min ≤ Max.
        </p>
      </div>

      {showReset && (
        <button
          type="button"
          onClick={resetLocal}
          className="w-full bg-yellow-400 text-blue-900 font-semibold rounded-md py-2 mt-1 hover:bg-yellow-300 transition"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
