const P = "bg-[#e8e2d3] rounded-full animate-pulse";
const B = "bg-[#e8e2d3] rounded-2xl animate-pulse";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-5 py-10 md:px-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">

          {/* Sidebar */}
          <aside className="space-y-2">
            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-3 p-5 mb-4">
              <div className="w-20 h-20 rounded-full bg-[#e8e2d3] animate-pulse" />
              <div className={`h-4 w-32 ${P}`} />
              <div className={`h-3 w-24 ${P}`} />
            </div>
            {/* Nav items */}
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={`h-10 w-full ${B}`} />
            ))}
          </aside>

          {/* Main panel */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className={`h-8 w-48 ${P}`} />
              <div className={`h-4 w-64 ${P}`} />
            </div>

            {/* Form fields */}
            <div className={`p-6 border border-rule rounded-2xl space-y-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className={`h-3 w-20 ${P}`} />
                    <div className={`h-11 w-full ${B}`} />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <div className={`h-3 w-20 ${P}`} />
                <div className={`h-11 w-full ${B}`} />
              </div>
              <div className={`h-10 w-32 rounded-full ${P}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
