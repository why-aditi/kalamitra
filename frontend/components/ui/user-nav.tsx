'use client';

import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserNav() {
  const { user, profile, signOut } = useAuthContext();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const getRoleBasedLinks = () => {
    if (!profile) return [];

    const commonLinks = [
      { href: `/${profile.role}/profile`, label: 'Profile' },
    ];

    switch (profile.role) {
      case 'artisan':
        return [
          ...commonLinks,
          { href: '/artisan/dashboard', label: 'Dashboard' },
          { href: '/artisan/products', label: 'My Products' },
          { href: '/artisan/orders', label: 'Orders' },
        ];
      case 'user':
        return [
          ...commonLinks,
          { href: '/buyer/orders', label: 'My Orders' },
        ];
      case 'admin':
        return [
          ...commonLinks,
          { href: '/admin/dashboard', label: 'Dashboard' },
          { href: '/admin/users', label: 'Users' },
          { href: '/admin/products', label: 'Products' },
          { href: '/admin/orders', label: 'Orders' },
        ];
      default:
        return commonLinks;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User avatar'} />
            <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            {profile?.role && (
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {profile.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {getRoleBasedLinks().map((link) => (
            <DropdownMenuItem
              key={link.href}
              className="cursor-pointer"
              onClick={() => router.push(link.href)}
            >
              {link.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}