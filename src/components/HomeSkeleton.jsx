const P = "bg-[#e8e2d3] rounded-full animate-pulse";
const B = "bg-[#e8e2d3] rounded-3xl animate-pulse";

export default function HomeSkeleton() {
  return (
    <div className="bg-paper text-ink">
      {/* Hero */}
      <section className="max-w-[1280px] mx-auto px-6 pt-12 md:pt-16 pb-10 text-center">
        {/* Badge */}
        <div className={`mx-auto h-7 w-48 ${P}`} />

        {/* Heading */}
        <div className="mt-6 space-y-3 flex flex-col items-center">
          <div className={`h-14 md:h-20 w-3/4 md:w-2/3 ${P}`} />
          <div className={`h-14 md:h-20 w-1/2 ${P}`} />
        </div>

        {/* Sub */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className={`h-4 w-2/3 max-w-md ${P}`} />
          <div className={`h-4 w-1/2 max-w-sm ${P}`} />
        </div>

        {/* Search bar */}
        <div className={`mt-10 mx-auto max-w-3xl h-20 rounded-[28px] ${B}`} />

        {/* Popular pills */}
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-8 w-28 rounded-full ${P}`} />
          ))}
        </div>

        {/* Three-photo collage */}
        <div className="grid grid-cols-12 gap-4 mt-16 md:mt-20">
          <div className={`col-span-12 md:col-span-5 aspect-[4/5] rounded-[24px] ${B}`} />
          <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
            <div className={`aspect-[5/3] rounded-[24px] ${B}`} />
            <div className={`aspect-[5/3] rounded-[24px] ${B}`} />
          </div>
          <div className={`col-span-12 md:col-span-3 rounded-[24px] min-h-[200px] ${B}`} />
        </div>
      </section>

      {/* Property types */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="mb-10 space-y-3">
          <div className={`h-4 w-24 ${P}`} />
          <div className={`h-10 w-64 ${P}`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`h-52 rounded-3xl ${B}`} />
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24">
        <div className="mb-10 space-y-3">
          <div className={`h-4 w-24 ${P}`} />
          <div className={`h-10 w-72 ${P}`} />
        </div>
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex-shrink-0 w-[320px] h-[380px] rounded-3xl ${B}`} />
          ))}
        </div>
      </section>

      {/* Areas */}
      <section className="max-w-[1280px] mx-auto px-6 pt-20 md:pt-24 pb-24">
        <div className="mb-10 space-y-3">
          <div className={`h-4 w-32 ${P}`} />
          <div className={`h-10 w-80 ${P}`} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`aspect-square rounded-[20px] ${B}`} />
          ))}
        </div>
      </section>
    </div>
  );
}
