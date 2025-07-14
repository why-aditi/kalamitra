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

export default function BuyerProfilePage() {
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
    <div className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Card className="max-w-lg mx-auto p-1 bg-white shadow-md rounded-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.photoURL || user?.photoURL || ''} alt={profile.display_name} />
                <AvatarFallback>{profile.display_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <p className="text-muted-foreground">
                  {profile.phone_number || 'Not provided'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <p className="text-muted-foreground">
                  {profile.address || 'Not provided'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Member Since</Label>
                <p className="text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {isEditing ? (
              <EditProfileForm
                initialData={{
                  display_name: profile.display_name,
                  phone_number: profile.phone_number,
                  address: profile.address,
                }}
                onSuccess={() => {
                  setIsEditing(false);
                  // Refresh profile data
                  fetchProfile();
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}