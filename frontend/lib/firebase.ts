import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { api } from './api-client';
import { AuthUser, UserProfile } from '@/types/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Analytics
let analytics = null;
isSupported().then(yes => yes && (analytics = getAnalytics(app)));

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get Firebase ID token
    const idToken = await user.getIdToken();

    // Store access token in localStorage and cookie
    localStorage.setItem('accessToken', idToken);

    // Call your backend to verify token and get user profile
    const response = await api.post<{ user: UserProfile }>(
      'api/verify-token',
      {
        name: user.displayName,
        email: user.email,
      },
      { requiresAuth: true }
    );

    return { user, profile: response.user };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    localStorage.removeItem('accessToken');
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  } finally {
    localStorage.removeItem('accessToken');
  }
};

// Get current auth instance
export const getAuthInstance = () => auth;

// Get current user
export const getCurrentUser = () => auth.currentUser;

export { app, auth, analytics };