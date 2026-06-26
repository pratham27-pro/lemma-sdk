interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-5 w-10" />
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 flex-1" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
