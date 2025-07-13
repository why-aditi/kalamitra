import { User } from 'firebase/auth';

export const AUTH_TOKEN_KEY = 'auth-token';

export async function setAuthCookie(user: User) {
  try {
    const token = await user.getIdToken();
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    return token;
  } catch (error) {
    console.error('Error setting auth token:', error);
    throw error;
  }
}

export function removeAuthCookie() {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

export function getAuthCookie() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
}

export async function refreshAuthToken(user: User) {
  try {
    const token = await user.getIdToken(true); // Force refresh the token
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
    return token;
  } catch (error) {
    console.error('Error refreshing auth token:', error);
    throw error;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume token is expired if we can't verify
  }
}
