export type UserRole = 'buyer' | 'artisan' | 'admin';

export interface UserProfile {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  phone_number?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: UserRole;
  accessToken?: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}