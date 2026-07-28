'use client';

import { RouteGate } from '@/components/route-gate';

export default function ArtisanLayout({ children }: { children: React.ReactNode }) {
  return <RouteGate>{children}</RouteGate>;
}
