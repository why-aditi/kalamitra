'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserNav } from '@/components/ui/user-nav';
import { MobileNav } from '@/components/mobile-nav';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Palette } from 'lucide-react';

export function NavBar() {
  const pathname = usePathname();
  const { user, profile } = useAuthContext();

  const getNavLinks = () => {
    if (!profile) return [];

    switch (profile.role) {
      case 'artisan':
        return [
          { href: '/marketplace', label: 'Marketplace' },
          { href: '/artisan/dashboard', label: 'Dashboard' },
          { href: '/artisan/products', label: 'My Products' },
          { href: '/artisan/orders', label: 'Orders' },
          { href: '/artisan/profile', label: 'Profile' }
        ];
      case 'user':
        return [
          { href: '/marketplace', label: 'Marketplace' },
          { href: '/buyer/orders', label: 'My Orders' },
          { href: '/buyer/profile', label: 'Profile' }
        ];
      case 'admin':
        return [
          { href: '/marketplace', label: 'Marketplace' },
          { href: '/admin/dashboard', label: 'Dashboard' },
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/products', label: 'Products' },
          { href: '/admin/orders', label: 'Orders' },
          { href: '/admin/profile', label: 'Profile' }
        ];
      default:
        return [{ href: '/marketplace', label: 'Marketplace' }];
    }
  };

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="border-b border-amber-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
              <Palette className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
              KalaMitra
            </span>
            <div className="text-xs text-gray-500 -mt-1">Artisan Marketplace</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {getNavLinks().map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-orange-600 border-b-2 border-orange-600 pb-1'
                  : 'text-gray-700 hover:text-orange-600'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <UserNav />
          ) : (
            <Link
              href="/buyer/login"
              className="px-4 py-2 border rounded-md border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Nav Toggle */}
        <div className="flex md:hidden items-center space-x-4">
          <MobileNav />
          {user ? <UserNav /> : null}
        </div>
      </div>
    </header>
  );
}
