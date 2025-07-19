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
import { Loader2, Edit, X, User, MapPin, Globe, Phone, Briefcase, Clock } from "lucide-react";

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

  const fieldIcons: Record<string, React.ComponentType<any>> = {
    craft: Briefcase,
    region: Globe,
    state: MapPin,
    language: Globe,
    experience: Clock,
    phone_number: Phone
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-gray-600 mt-2">Manage your artisan profile information</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-200/50">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Profile Information
                </CardTitle>
                {!isEditMode && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEdit}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all duration-200"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Section */}
                <div className="bg-white/80 py-6">
                  <Label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    Full Name
                  </Label>
                  <div className="text-lg font-semibold text-gray-800 bg-white px-4 py-3 border-amber-200/50 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg h-11 flex items-center shadow-sm hover:from-amber-50 hover:to-orange-50 hover:border-amber-200 transition-all duration-200">
                    {profile?.name}
                  </div>
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: "craft", label: "Craft", value: profile?.craft },
                    { id: "region", label: "Region", value: profile?.region },
                    { id: "state", label: "State", value: profile?.state },
                    { id: "language", label: "Language", value: profile?.language },
                    { id: "experience", label: "Experience", value: profile?.experience },
                    { id: "phone_number", label: "Phone", value: profile?.phone_number },
                  ].map((field) => {
                    const IconComponent = fieldIcons[field.id as keyof typeof fieldIcons];
                    return (
                      <div key={field.id} className="group">
                        <Label 
                          htmlFor={field.id} 
                          className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"
                        >
                          {IconComponent && <IconComponent className="w-4 h-4 text-amber-600" />}
                          {field.label}
                        </Label>
                        {isEditMode ? (
                          <Input
                            id={field.id}
                            name={field.id}
                            value={formData[field.id as keyof typeof formData]}
                            onChange={handleInputChange}
                            placeholder={`Enter ${field.label.toLowerCase()}`}
                            className="h-11 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 bg-white shadow-sm"
                          />
                        ) : (
                          <div className="text-sm font-medium px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg h-11 flex items-center shadow-sm group-hover:from-amber-50 group-hover:to-orange-50 group-hover:border-amber-200 transition-all duration-200">
                            {field.value || <span className="text-gray-400">Not provided</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bio Section */}
                <div className="bg-white/80 py-6">
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Edit className="w-4 h-4 text-amber-600" />
                    Biography
                  </Label>
                  {isEditMode ? (
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell us about yourself and your craft..."
                      rows={4}
                      className="resize-none border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 bg-white shadow-sm"
                    />
                  ) : (
                    <div className="text-sm leading-relaxed bg-white px-4 py-3 border-amber-200/50 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg h-11 flex items-center shadow-sm hover:from-amber-50 hover:to-orange-50 hover:border-amber-200 transition-all duration-200whitespace-pre-wrap">
                      {profile?.bio || <span className="text-gray-400 italic">No biography provided</span>}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditMode && (
                  <div className="flex justify-end gap-3 pt-6 border-t border-amber-200/50">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancel}
                      disabled={saving}
                      className="border-gray-300 text-gray-600 hover:bg-gray-50 transition-all duration-200"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={saving}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 min-w-[140px]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Keep your profile updated to connect with the right opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
}