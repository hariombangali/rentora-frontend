const S = "bg-[#e8e2d3] rounded-full";

export default function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-rule bg-card overflow-hidden animate-pulse">
      <div className="h-52 bg-[#e8e2d3]" />
      <div className="p-5 space-y-3">
        <div className={`h-4 w-3/4 ${S}`} />
        <div className={`h-3 w-1/2 ${S}`} />
        <div className={`h-5 w-1/3 ${S}`} />
        <div className="flex gap-2 pt-1">
          <div className={`h-3 w-16 ${S}`} />
          <div className={`h-3 w-16 ${S}`} />
          <div className={`h-3 w-16 ${S}`} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
