import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the market">
      <div className="border-b border-border bg-secondary/50">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-12 w-full max-w-xl" />
          <Skeleton className="mt-8 h-12 w-full max-w-2xl" />
        </div>
      </div>

      <div className="container mx-auto flex flex-col gap-10 px-4 py-10 lg:flex-row">
        <div className="space-y-7 lg:w-64 lg:shrink-0">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <ul className="grid flex-1 grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[4/5] w-full rounded-md" />
              <Skeleton className="mt-4 h-3 w-16" />
              <Skeleton className="mt-3 h-5 w-4/5" />
              <Skeleton className="mt-3 h-4 w-1/2" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
