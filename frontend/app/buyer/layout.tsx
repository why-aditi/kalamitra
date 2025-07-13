'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { LoadingPage } from '@/components/ui/loading';

const publicPaths = ['/buyer/login'];

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const isPublicPath = publicPaths.includes(pathname);
      console.log(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);

      if (!user && !isPublicPath) {
        // Redirect to login if user is not authenticated and trying to access protected route
        router.push('/buyer/login');
      } else if (user && isPublicPath) {
        // Redirect to marketplace if user is authenticated and trying to access login
        router.push('/marketplace');
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}