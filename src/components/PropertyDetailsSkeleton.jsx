const P = "bg-[#e8e2d3] rounded-full animate-pulse";
const B = "bg-[#e8e2d3] animate-pulse";

export default function PropertyDetailsSkeleton() {
  return (
    <div className="bg-paper min-h-screen pb-[88px] lg:pb-0">
      <div className="max-w-[1440px] mx-auto px-5 md:px-6 pt-6 md:pt-8 pb-10 md:pb-24">

        {/* Breadcrumb */}
        <div className="flex gap-2 items-center">
          <div className={`h-3 w-10 ${P}`} />
          <div className={`h-3 w-2 ${P}`} />
          <div className={`h-3 w-14 ${P}`} />
          <div className={`h-3 w-2 ${P}`} />
          <div className={`h-3 w-32 ${P}`} />
        </div>

        {/* Gallery — mobile */}
        <div className={`md:hidden mt-4 aspect-[4/3] rounded-3xl ${B}`} />

        {/* Gallery — desktop */}
        <div
          className="mt-5 hidden md:grid gap-2 rounded-3xl overflow-hidden"
          style={{ gridTemplateColumns: "2fr 1fr 1fr", gridTemplateRows: "220px 220px" }}
        >
          <div className={`${B} row-span-2`} />
          <div className={B} />
          <div className={B} />
          <div className={B} />
          <div className={B} />
        </div>

        {/* Content grid */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 items-start">
          {/* Left */}
          <div>
            {/* Title area */}
            <div className="flex justify-between gap-6 flex-wrap">
              <div className="space-y-3 flex-1">
                <div className={`h-6 w-40 ${P}`} />
                <div className={`h-12 w-3/4 ${P}`} />
                <div className={`h-4 w-1/2 ${P}`} />
              </div>
              <div className="flex gap-2">
                <div className={`h-9 w-20 rounded-full ${P}`} />
                <div className={`h-9 w-20 rounded-full ${P}`} />
              </div>
            </div>

            {/* Key facts */}
            <div className={`mt-6 h-24 rounded-3xl ${B}`} />

            {/* About */}
            <div className="mt-10 space-y-3">
              <div className={`h-8 w-48 ${P}`} />
              <div className={`h-4 w-full ${P}`} />
              <div className={`h-4 w-full ${P}`} />
              <div className={`h-4 w-4/5 ${P}`} />
              <div className={`h-4 w-3/4 ${P}`} />
            </div>

            {/* Amenities */}
            <div className="mt-10 space-y-4">
              <div className={`h-8 w-40 ${P}`} />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`h-5 rounded-full ${P}`} />
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="mt-10 space-y-3">
              <div className={`h-8 w-52 ${P}`} />
              <div className={`h-[380px] rounded-[28px] ${B}`} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`h-16 rounded-2xl ${B}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className={`h-[420px] rounded-3xl ${B}`} />
            <div className={`h-32 rounded-3xl ${B}`} />
          </aside>
        </div>
      </div>
    </div>
  );
}
