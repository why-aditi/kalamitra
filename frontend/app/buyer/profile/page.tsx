"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { LoadingPage } from "@/components/ui/loading";
import { api } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditProfileForm } from "@/components/forms/edit-profile-form";
import { User, Mail, Phone, MapPin, Calendar, Edit } from "lucide-react";

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
      const data = await api.get<UserProfile>("api/me");
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-madder rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground">No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-madder rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-madder bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-muted-foreground mt-2">Manage your account information</p>
          </div>

          {isEditing ? (
            <div className="bg-card backdrop-blur-sm rounded-2xl shadow-xl border-0 p-6">
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
            </div>
          ) : (
            <Card className="shadow-xl border-0 bg-card backdrop-blur-sm">
              <CardHeader className="bg-madder border-b border-border pb-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                      {profile.photoURL ? (
                        <AvatarImage src={profile.photoURL} />
                      ) : (
                        <AvatarFallback className="bg-madder text-primary-foreground text-2xl font-bold">
                          {profile.display_name?.[0] || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neem rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-foreground mb-1">
                      {profile.display_name}
                    </CardTitle>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Mail className="w-4 h-4 mr-2 text-madder" />
                      {profile.email}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Profile Information Grid */}
                  <div className="grid gap-4">
                    {/* Phone Number */}
                    {profile.phone_number ? (
                      <div className="p-4 rounded-xl border border-border">
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="w-5 h-5 mr-3 text-madder" />
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Phone Number</div>
                            <div className="font-semibold text-foreground">{profile.phone_number}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-xl border border-border">
                        <div className="flex items-center text-muted-foreground">
                          <Phone className="w-5 h-5 mr-3" />
                          <div>
                            <div className="text-sm font-medium">Phone Number</div>
                            <div className="text-sm italic">Not provided</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {profile.address ? (
                      <div className="p-4 rounded-xl border border-border">
                        <div className="flex items-start text-muted-foreground">
                          <MapPin className="w-5 h-5 mr-3 text-madder mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-muted-foreground">Address</div>
                            <div className="font-semibold text-foreground">{profile.address}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted p-4 rounded-xl border border-border">
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="w-5 h-5 mr-3" />
                          <div>
                            <div className="text-sm font-medium">Address</div>
                            <div className="text-sm italic">Not provided</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Member Since */}
                    <div className="p-4 rounded-xl border border-primary/30/50">
                      <div className="flex items-center text-primary">
                        <Calendar className="w-5 h-5 mr-3 text-primary" />
                        <div>
                          <div className="text-sm font-medium text-primary">Member Since</div>
                          <div className="font-semibold text-primary">
                            {new Date(profile.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit Button */}
                  <div className="pt-6 border-t border-border">
                    <Button 
                      className="w-full bg-madder text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-lg font-medium" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="mr-2 h-5 w-5" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>Keep your profile information up to date for the best experience</p>
          </div>
        </div>
      </div>
    </div>
  );
}