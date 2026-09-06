export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton h-[76px] rounded-xl" />
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-[58px] rounded-xl" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      <div className="skeleton h-[104px] rounded-2xl" />
      <KpiSkeleton />
      <RowsSkeleton count={2} />
      <RowsSkeleton count={3} />
    </div>
  );
}
