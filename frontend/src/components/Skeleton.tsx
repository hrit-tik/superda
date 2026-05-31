/**
 * Superda — Skeleton Loading Components
 * Reusable skeleton loaders with shimmer animation.
 */

export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/5 ${className}`}
      style={{ width, height }}
    />
  );
}

export function MetadataSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Thumbnail */}
        <Skeleton className="w-full md:w-80 h-44 rounded-xl shrink-0" />

        {/* Info */}
        <div className="flex-1 space-y-4">
          <Skeleton height="28px" width="80%" />
          <Skeleton height="16px" width="40%" />
          <div className="flex gap-4 mt-4">
            <Skeleton height="14px" width="80px" />
            <Skeleton height="14px" width="100px" />
            <Skeleton height="14px" width="60px" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormatTableSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton height="24px" width="200px" />
        <Skeleton height="36px" width="250px" className="rounded-lg" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="32px" width="100px" className="rounded-full" />
        ))}
      </div>

      {/* Table rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} height="48px" className="rounded-lg" />
        ))}
      </div>
    </div>
  );
}
