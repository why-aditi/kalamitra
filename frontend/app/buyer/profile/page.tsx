'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { LoadingPage } from '@/components/ui/loading';
import { api } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { EditProfileForm } from '@/components/forms/edit-profile-form';

interface UserProfile {
  _id: string;
  email: string;
  display_name: string;
  photoURL?: string;
  phone_number?: string;
  address?: string;
  created_at: Date;
}

export default function BuyerProfile() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.get<UserProfile>('api/me');
      console.log(data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p>No profile data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-10">
      <div className="container mx-auto px-4 max-w-xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : profile ? (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>{profile.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-gray-700">Email: <span className="font-semibold">{profile.email}</span></div>
              <div className="text-xs text-gray-500">Joined: {new Date(profile.joined).toLocaleDateString()}</div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center text-gray-500 py-20">Profile not found.</div>
        )}
      </div>
    </div>
  );
}