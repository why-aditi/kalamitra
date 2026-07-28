import { Skeleton } from '@/components/ui/skeleton';

/** These four loading files each used to `return null`, i.e. a blank page. */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-20" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-3 w-44" />
      <Skeleton className="mt-6 h-16 w-full max-w-xl" />
      <Skeleton className="mt-3 h-16 w-2/3 max-w-md" />
      <Skeleton className="mt-8 h-5 w-full max-w-lg" />
      <Skeleton className="mt-2 h-5 w-4/5 max-w-md" />
      <div className="mt-10 flex gap-3">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-44" />
      </div>
    </div>
  );
}
