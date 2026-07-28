import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12" aria-busy="true" aria-label="Loading your dashboard">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-10 w-72" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-8 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-12 h-64 w-full rounded-lg" />
    </div>
  );
}
