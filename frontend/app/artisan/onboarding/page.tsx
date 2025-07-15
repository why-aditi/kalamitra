"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Heart, User, MapPin, Palette, Languages } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/providers/auth-provider"
import { api } from "@/lib/api-client"

export default function ArtisanOnboarding() {
  const router = useRouter()
  const { revalidateProfile, profile } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    craft: "",
    region: "", 
    state: "",
    language: "",
    experience: "",
    bio: "",
  })
    console.log('RoleSelectionPage rendered with profile:', profile)

  useEffect(() => {
  if (profile?.role === "artisan" && profile?.is_onboarded) {
    router.push("/artisan/dashboard");
  }
}, [profile]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!profile) {
    router.push("/buyer/login");
    return;
  }

  if (!formData.name || !formData.craft || !formData.state) {
    alert("Please fill in all required fields");
    return;
  }

  setLoading(true);
  try {
    await api.post("/api/artist/onboarding", formData);
    await revalidateProfile();
    router.push("/artisan/dashboard");
  } catch (error) {
    console.error("Error saving artisan profile:", error);
    alert("Failed to save profile. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ]

  const crafts = [
    "Pottery",
    "Textiles",
    "Jewelry",
    "Wood Carving",
    "Metal Work",
    "Painting",
    "Embroidery",
    "Leather Work",
    "Bamboo Craft",
    "Stone Carving",
    "Glass Work",
    "Paper Craft",
    "Basket Weaving",
    "Toy Making",
    "Other",
  ]

  const languages = [
    "Hindi",
    "English",
    "Bengali",
    "Telugu",
    "Marathi",
    "Tamil",
    "Gujarati",
    "Urdu",
    "Kannada",
    "Odia",
    "Malayalam",
    "Punjabi",
    "Assamese",
    "Other",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to KalaMitra!</h1>
            <p className="text-gray-600">Let's set up your artisan profile to get started</p>
          </div>

          <Card className="border-orange-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <User className="w-5 h-5" />
                Artisan Profile
              </CardTitle>
              <CardDescription>
                Tell us about yourself and your craft. This information will help buyers connect with your story.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Basic Information
                  </h3>

                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="craft">Primary Craft *</Label>
                      <Select
                        value={formData.craft}
                        onValueChange={(value) => setFormData({ ...formData, craft: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your craft" />
                        </SelectTrigger>
                        <SelectContent>
                          {crafts.map((craft) => (
                            <SelectItem key={craft} value={craft}>
                              {craft}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="e.g., 5 years"
                        type="number"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => setFormData({ ...formData, state: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="region">City/Region</Label>
                      <Input
                        id="region"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        placeholder="e.g., Jaipur, Udaipur"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Language Preference
                  </h3>

                  <div>
                    <Label htmlFor="language">Preferred Language for Voice Input</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your preferred language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    About Your Craft
                  </h3>

                  <div>
                    <Label htmlFor="bio">Tell us about your craft journey (Optional)</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Share your story, inspiration, and what makes your craft special..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button type="button" variant="outline" className="flex-1 bg-transparent" asChild>
                    <Link href="/">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {loading ? "Saving..." : "Complete Setup"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
