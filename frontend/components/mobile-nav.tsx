'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const { user, profile, signOut } = useAuthContext();

  const getNavLinks = () => {
    if (!profile) return [
      { href: '/marketplace', label: 'Marketplace' }
    ];
    
    switch (profile.role) {
      case 'artisan':
        return [
          { href: '/marketplace', label: 'Marketplace' },
          { href: '/artisan/dashboard', label: 'Dashboard' },
          { href: '/artisan/products', label: 'My Products' },
          { href: '/artisan/orders', label: 'Orders' },
          { href: '/artisan/profile', label: 'Profile' }
        ];
      case 'buyer':
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
        return [
          { href: '/marketplace', label: 'Marketplace' }
        ];
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const routes = getNavLinks();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <nav className="flex flex-col space-y-4">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${pathname.startsWith(route.href) ? 'text-black dark:text-white' : 'text-muted-foreground'}`}
              onClick={() => setOpen(false)}
            >
              {route.label}
            </Link>
          ))}
          {!user ? (
            <Link
              href="/buyer/login"
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          ) : (
            <button
              onClick={handleSignOut}
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground text-left"
            >
              Sign Out
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}