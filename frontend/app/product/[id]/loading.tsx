import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-16" aria-busy="true" aria-label="Loading the piece">
      <Skeleton className="h-3 w-32" />
      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-10 w-4/5" />
          <Skeleton className="mt-4 h-4 w-1/2" />
          <Skeleton className="mt-8 h-10 w-40" />
          <Skeleton className="mt-8 h-20 w-full" />
          <Skeleton className="mt-10 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
