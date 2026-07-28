"use client";

import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { navLinksForRole } from "@/lib/nav-links";

export function UserNav() {
  const { user, profile, signOut } = useAuthContext();
  const router = useRouter();

  if (!user) {
    return null;
  }

  // Drop Marketplace — it is already in the top-level nav next to this menu.
  const accountLinks = navLinksForRole(profile?.role).filter((l) => l.href !== "/marketplace");

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Account menu">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={user.photoURL || ""} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
              {user.displayName?.[0]?.toUpperCase() || "K"}
            </AvatarFallback>
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
          {accountLinks.map((link) => (
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