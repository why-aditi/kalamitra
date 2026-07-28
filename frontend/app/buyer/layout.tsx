'use client';

import { RouteGate } from '@/components/route-gate';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <RouteGate publicPaths={['/buyer/login']}>{children}</RouteGate>;
}
