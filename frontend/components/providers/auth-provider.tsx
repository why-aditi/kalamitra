'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { api } from '@/lib/api-client';

interface UserProfile {
  display_name: string;
  email: string;
  phone_number?: string;
  role: string | null;
  address?: string;
  created_at?: string;
  is_active?: boolean;
  is_onboarded?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  /** True until Firebase has reported an auth state and /api/me has resolved. */
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  revalidateProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Whose profile is currently loaded, so a token refresh does not refetch it.
  const loadedUid = useRef<string | null>(null);

  const fetchAndSetProfile = useCallback(async () => {
    try {
      const userProfile = await api.get<UserProfile>('/api/me');
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      await signOutUser();
      setProfile(null);
      setUser(null);
      loadedUid.current = null;
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    /*
      onIdTokenChanged, not onAuthStateChanged. The latter fires only on sign-in
      and sign-out, so the stored token went stale after an hour and every
      subsequent API call 401'd with no way back — the app had no refresh path at
      all. This fires on refresh too, so storage always holds a live token.
    */
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        loadedUid.current = null;
        setUser(null);
        setProfile(null);
        localStorage.removeItem('accessToken');
        setLoading(false);
        return;
      }

      // Not getIdToken(true): a forced refresh added a blocking round trip to
      // Google on every page load. Firebase refreshes on expiry by itself, and
      // this callback runs when it does.
      localStorage.setItem('accessToken', await firebaseUser.getIdToken());
      setUser(firebaseUser);

      if (loadedUid.current !== firebaseUser.uid) {
        loadedUid.current = firebaseUser.uid;
        await fetchAndSetProfile();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSetProfile]);

  const signIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await signOutUser();
  };

  const revalidateProfile = fetchAndSetProfile;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, revalidateProfile }}>
      <AuthRedirectHandler />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

const ONBOARDING_ROUTES = ['/onboarding/role', '/artisan/onboarding'];
const AUTH_ROUTES = ['/buyer/login'];

/**
 * Redirect side effects only — renders nothing.
 *
 * Previously this component returned <LoadingPage /> while `loading` was true,
 * which meant the root layout blanked every route (including the marketing page)
 * until Firebase had booted and /api/me had answered. Route gating now lives in
 * the /artisan and /buyer layouts; public routes paint immediately.
 */
function AuthRedirectHandler() {
  const { profile, loading } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isOnboarding = ONBOARDING_ROUTES.includes(pathname);

    if (!profile) {
      const isPublic =
        isAuthRoute || pathname === '/' || pathname.startsWith('/marketplace') || pathname.startsWith('/product');
      if (!isPublic) {
        router.push('/buyer/login');
      }
      return;
    }

    if (!profile.role) {
      if (pathname !== '/onboarding/role') {
        router.push('/onboarding/role');
      }
      return;
    }

    if (profile.role === 'artisan' && !profile.is_onboarded) {
      if (!pathname.startsWith('/artisan/onboarding')) {
        router.push('/artisan/onboarding');
      }
      return;
    }

    if (isAuthRoute || isOnboarding) {
      router.push(profile.role === 'artisan' ? '/artisan/dashboard' : '/buyer/profile');
    }
  }, [profile, loading, pathname, router]);

  return null;
}
