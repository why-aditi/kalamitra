export interface NavLink {
  href: string;
  label: string;
}

const MARKETPLACE: NavLink = { href: '/marketplace', label: 'Marketplace' };

const ARTISAN: NavLink[] = [
  MARKETPLACE,
  { href: '/artisan/dashboard', label: 'Dashboard' },
  { href: '/artisan/products', label: 'Listings' },
  { href: '/artisan/orders', label: 'Orders' },
  { href: '/artisan/profile', label: 'Profile' },
];

const BUYER: NavLink[] = [
  MARKETPLACE,
  { href: '/buyer/orders', label: 'Orders' },
  { href: '/buyer/profile', label: 'Profile' },
];

/**
 * Single source of truth for role navigation, shared by the desktop nav, the
 * mobile sheet and the account menu — which previously each kept their own copy
 * and had already drifted (the mobile sheet matched on role `buyer`, the others
 * on `user`, so buyers saw a different menu on phones).
 *
 * Note: there are no /admin/* routes in this app. The admin role therefore gets
 * the buyer menu rather than five links to 404s.
 */
export function navLinksForRole(role: string | null | undefined): NavLink[] {
  switch (role) {
    case 'artisan':
      return ARTISAN;
    case 'user':
    case 'buyer':
    case 'admin':
      return BUYER;
    default:
      return [MARKETPLACE];
  }
}
