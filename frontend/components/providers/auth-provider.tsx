'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { api } from '@/lib/api-client';
import { LoadingPage } from '@/components/ui/loading';

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

  // Unified function to fetch the user profile from your backend
  const fetchAndSetProfile = useCallback(async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      localStorage.setItem('accessToken', idToken);
      const userProfile = await api.get<UserProfile>('/api/me');
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      await signOutUser();
      setProfile(null);
      setUser(null);
      localStorage.removeItem('accessToken');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchAndSetProfile(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('accessToken');
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
    setLoading(true);
    await signOutUser();
  };

  const revalidateProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await api.get<UserProfile>('/api/me');
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to revalidate profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, revalidateProfile }}>
      <AuthRedirectHandler>{children}</AuthRedirectHandler>
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

function AuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const onboardingRoutes = ['/onboarding/role', '/artisan/onboarding'];
    const authRoutes = ['/buyer/login'];
    const isAuthRoute = authRoutes.includes(pathname);
    const isOnboarding = onboardingRoutes.includes(pathname);

    // If user is not logged in, redirect to login page
    if (!profile) {
      if (!isAuthRoute && !pathname.startsWith('/marketplace') && pathname !== '/') {
        router.push('/buyer/login');
      }
      return;
    }

    // *** FIX STARTS HERE ***

    // If user is logged in but has no role, redirect to role selection
    if (!profile.role) {
      if (pathname !== '/onboarding/role') {
        router.push('/onboarding/role');
      }
      return; // Important to return here
    }

    // *** FIX ENDS HERE ***


    // If user has a role, handle redirects based on their role and onboarding status
    if (profile.role === 'artisan' && !profile.is_onboarded) {
      if (!pathname.startsWith('/artisan/onboarding')) {
        router.push('/artisan/onboarding');
      }
      return;
    }

    // If user is on an auth or onboarding route but is already fully set up, redirect them away
    if (isAuthRoute || isOnboarding) {
      const redirectPath = profile.role === 'artisan' ? '/artisan/dashboard' : '/buyer/profile';
      router.push(redirectPath);
    }

  }, [profile, loading, pathname, router]);

  if (loading) {
    return <LoadingPage />;
  }

  return <>{children}</>;
}
