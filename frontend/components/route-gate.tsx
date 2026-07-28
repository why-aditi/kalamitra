'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Blocks a private route until auth resolves, then bounces anonymous visitors to
 * sign-in. Mounted per section (/artisan, /buyer) rather than at the root, so a
 * logged-out visitor never waits on Firebase to see a public page.
 */
export function RouteGate({
  children,
  publicPaths = [],
  redirectTo = '/buyer/login',
}: {
  children: React.ReactNode;
  publicPaths?: string[];
  redirectTo?: string;
}) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicPath) {
      router.replace(redirectTo);
    } else if (user && isPublicPath) {
      router.replace('/marketplace');
    }
  }, [user, loading, isPublicPath, router, redirectTo]);

  if (loading && !isPublicPath) {
    return <RouteGateSkeleton />;
  }

  return <>{children}</>;
}

function RouteGateSkeleton() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-16" aria-busy="true" aria-label="Loading your account">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-5 h-10 w-2/3 max-w-sm" />
      <Skeleton className="mt-3 h-5 w-1/2 max-w-xs" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border border-border p-5">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
