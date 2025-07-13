'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { getAuthCookie, isTokenExpired, refreshAuthToken } from '@/lib/auth-utils';

// Example user profile type — adjust fields as per your backend response
type UserProfile = {
  role: string;
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshToken = useCallback(async (firebaseUser: User) => {
    try {
      const token = getAuthCookie();
      if (token && isTokenExpired(token)) {
        const newToken = await refreshAuthToken(firebaseUser);
        return newToken;
      }
      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }, []);

  const fetchUserProfile = async (token: string): Promise<UserProfile> => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  };

  const handleAuthStateChange = useCallback(async (firebaseUser: User | null) => {
    try {
      if (firebaseUser) {
        const token = await refreshToken(firebaseUser);
        if (token) {
          const userProfile = await fetchUserProfile(token);
          setUser(firebaseUser);
          setProfile(userProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
        localStorage.removeItem('auth-token'); // You can replace this with removeAuthCookie if needed
      }
    } catch (error) {
      console.error('Auth state change error:', error);
      setError(error instanceof Error ? error : new Error('Authentication error'));
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange, (error) => {
      console.error('Auth state change error:', error);
      setError(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleAuthStateChange]);

  const signIn = async () => {
    try {
      setError(null);
      const { user } = await signInWithGoogle();
      setUser(user);
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign in'));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await signOutUser();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error : new Error('Failed to sign out'));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signOut }}>
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
