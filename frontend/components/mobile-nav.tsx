'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { navLinksForRole } from '@/lib/nav-links';

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { user, profile, signOut } = useAuthContext();
  const links = navLinksForRole(profile?.role);

  const handleSignOut = async () => {
    try {
      await signOut();
      setOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[17rem]">
        <SheetHeader className="text-left">
          <SheetTitle className="display-sm">Menu</SheetTitle>
        </SheetHeader>

        <div className="ajrakh-rule my-5" aria-hidden="true" />

        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-border pt-6">
          {user ? (
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              Sign out
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href="/buyer/login" onClick={() => setOpen(false)}>
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
