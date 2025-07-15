"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Loader2, Edit, X } from "lucide-react";

interface ArtisanProfile {
  id: string;
  name: string;
  craft: string;
  region: string;
  state: string;
  language: string;
  experience?: string;
  bio?: string;
  display_name?: string;
  phone_number?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ArtisanProfile() {
  const router = useRouter();
  const { profile: authProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [formData, setFormData] = useState({
    craft: "",
    region: "",
    state: "",
    language: "",
    experience: "",
    phone_number: "",
    bio: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${BASE_URL}/api/artist/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setFormData({
          craft: data.craft || "",
          region: data.region || "",
          state: data.state || "",
          language: data.language || "",
          experience: data.experience || "",
          phone_number: data.phone_number || "",
          bio: data.bio || "",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setFormData({
      craft: profile?.craft || "",
      region: profile?.region || "",
      state: profile?.state || "",
      language: profile?.language || "",
      experience: profile?.experience || "",
      phone_number: profile?.phone_number || "",
      bio: profile?.bio || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BASE_URL}/api/artist/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setIsEditMode(false);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="container mx-auto py-4">
        <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Profile Settings</CardTitle>
          {!isEditMode && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Name</Label>
                <div className="text-sm font-medium px-3 py-2 bg-gray-50 border rounded-md">
                  {profile?.name}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="craft" className="text-sm font-medium">Craft</Label>
                  {isEditMode ? (
                    <Input
                      id="craft"
                      name="craft"
                      value={formData.craft}
                      onChange={handleInputChange}
                      placeholder="Enter craft"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md h-9 flex items-center">
                      {profile?.craft || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="region" className="text-sm font-medium">Region</Label>
                  {isEditMode ? (
                    <Input
                      id="region"
                      name="region"
                      value={formData.region}
                      onChange={handleInputChange}
                      placeholder="Enter region"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md h-9 flex items-center">
                      {profile?.region || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="state" className="text-sm font-medium">State</Label>
                  {isEditMode ? (
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md h-9 flex items-center">
                      {profile?.state || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="language" className="text-sm font-medium">Language</Label>
                  {isEditMode ? (
                    <Input
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      placeholder="Enter language"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md h-9 flex items-center">
                      {profile?.language || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="experience" className="text-sm font-medium">Experience</Label>
                  {isEditMode ? (
                    <Input
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      placeholder="Enter experience"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md h-9 flex items-center">
                      {profile?.experience || "Not provided"}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone_number" className="text-sm font-medium">Phone</Label>
                  {isEditMode ? (
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="Enter phone"
                      className="h-9"
                    />
                  ) : (
                    <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md h-9 flex items-center">
                      {profile?.phone_number || "Not provided"}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                {isEditMode ? (
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself and your craft"
                    rows={3}
                    className="resize-none"
                  />
                ) : (
                  <div className="text-sm px-3 py-2 bg-gray-50 border rounded-md min-h-[80px]">
                    {profile?.bio || "No bio provided"}
                  </div>
                )}
              </div>
            </div>

            {isEditMode && (
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={saving}
                >
                  {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}