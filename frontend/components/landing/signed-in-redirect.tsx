'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';

/**
 * The only client-side concern on the marketing page: send signed-in people to
 * their own home. Renders nothing, so the page itself stays a server component
 * and its HTML paints before any of this runs.
 */
export function SignedInRedirect() {
  const { user, profile } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user || !profile) return;
    // There is no /admin section in this app, so admins land in the market too.
    router.replace(profile.role === 'artisan' ? '/artisan/dashboard' : '/marketplace');
  }, [user, profile, router]);

  return null;
}
