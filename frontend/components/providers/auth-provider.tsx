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
  role: 'artisan' | 'user' | 'admin' | null;
};

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

  const fetchAppUserProfile = useCallback(async (firebaseUser: User) => {
    try {
      const idToken = await firebaseUser.getIdToken(true); // Force refresh
      localStorage.setItem('accessToken', idToken);
      const userProfile = await api.get<UserProfile>('/api/me');
      setProfile(userProfile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      await signOutUser(); 
    }
  }, []);

  const handleAuthStateChange = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      setUser(firebaseUser);
      await fetchAppUserProfile(firebaseUser);
    } else {
      localStorage.removeItem('accessToken');
      setUser(null);
      setProfile(null);
    }
    setLoading(false);
  }, [fetchAppUserProfile]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
    return () => unsubscribe();
  }, [handleAuthStateChange]);

  const handleUserSession = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      try {
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('accessToken', idToken);
        const userProfile = await api.post<UserProfile>('/api/verify-token');
        setUser(firebaseUser);
        setProfile(userProfile);
      } catch (error) {
        console.error("Failed to verify user and fetch profile:", error);
        localStorage.removeItem('accessToken'); 
        await signOutUser();
        setUser(null);
        setProfile(null);
      }
    } else {
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

  const revalidateProfile = async () => {
           const firebaseUser = auth.currentUser;
           if (firebaseUser) {
             setLoading(true); // Show loading state during re-fetch
             await fetchAppUserProfile(firebaseUser);
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
          const redirectPath = profile.role === 'artisan' ? '/artisan/dashboard' : '/buyer/profile';
          router.push(redirectPath);
        }
      }
    }, [profile, loading, pathname, router]);
  
    if (loading) {
      return <LoadingPage />;
    }
  
    return children;
}
