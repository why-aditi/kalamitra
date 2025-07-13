import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface UseAuth extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuth {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setState((prev) => ({ ...prev, user, loading: false }));
      },
      (error) => {
        setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      }
    );

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signInWithGoogle();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      await signOutUser();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
  };
}