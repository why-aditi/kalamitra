'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/components/providers/auth-provider';
import { LoadingPage } from '@/components/ui/loading';
import { api } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    setLoading(true);
    try {
      const data = await api.get<UserProfile>('api/me');
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

        {isEditing ? (
          <EditProfileForm
            initialData={{
              display_name: profile.display_name,
              phone_number: profile.phone_number,
              address: profile.address,
            }}
            onSuccess={() => {
              setIsEditing(false);
              fetchProfile();
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  {profile.photoURL ? (
                    <AvatarImage src={profile.photoURL} />
                  ) : (
                    <AvatarFallback>
                      {profile.display_name?.[0] || '?'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle>{profile.display_name}</CardTitle>
                  <div className="text-sm text-gray-500">{profile.email}</div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {profile.phone_number && (
                <div className="text-gray-700">
                  Phone: <span className="font-semibold">{profile.phone_number}</span>
                </div>
              )}
              {profile.address && (
                <div className="text-gray-700">
                  Address: <span className="font-semibold">{profile.address}</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Joined: {new Date(profile.created_at).toLocaleDateString()}
              </div>

              <Button className="mt-4" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
