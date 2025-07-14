// src/components/providers/auth-provider.tsx

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { api } from '@/lib/api-client';
import { LoadingPage } from '@/components/ui/loading';

type UserProfile = {
  _id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  role: 'artisan' | 'buyer' | 'admin' | null;
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUserSession = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        // --- KEY FIX STARTS HERE ---
        // 1. Get the ID Token from the Firebase user object.
        const idToken = await firebaseUser.getIdToken();

        // 2. Store this token in localStorage so your api-client can find it.
        localStorage.setItem('accessToken', idToken);
        // --- KEY FIX ENDS HERE ---

        // 3. Now, call your backend. The api-client will find the token.
        const userProfile = await api.post<UserProfile>('/api/verify-token');
        
        setUser(firebaseUser);
        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to verify user and fetch profile:", error);
        localStorage.removeItem('accessToken'); // Clean up on failure
        await signOutUser();
        setUser(null);
        setProfile(null);
      }
    } else {
      // No Firebase user, clear everything
      localStorage.removeItem('accessToken');
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleUserSession);
    return () => unsubscribe();
  }, [handleUserSession]);

  const signIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // onAuthStateChanged will trigger handleUserSession automatically
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await signOutUser();
    // onAuthStateChanged will clear the session
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
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

// This AuthRedirectHandler component remains the same as before.
// It handles all the client-side routing logic.
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
  
      if (!profile) {
        if (!isAuthRoute && !pathname.startsWith('/marketplace') && pathname !== '/') {
          router.push('/buyer/login');
        }
        return;
      }
  
      if (profile.role === null) {
        if (!isOnboarding) {
          router.push('/onboarding/role');
        }
        return;
      }
  
      if (profile.role) {
        if (isAuthRoute || isOnboarding) {
          const redirectPath = profile.role === 'artisan' ? '/artisan/dashboard' : '/marketplace';
          router.push(redirectPath);
        }
      }
    }, [profile, loading, pathname, router]);
  
    if (loading) {
      return <LoadingPage />;
    }
  
    return children;
}
