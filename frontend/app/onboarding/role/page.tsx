"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Palette, ShoppingBag, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuthContext } from "@/components/providers/auth-provider"
import { api } from "@/lib/api-client"

export default function RoleSelectionPage() {
  const router = useRouter()
  const { profile, revalidateProfile } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleRoleSelection = async (role: string) => {
  if (!profile) {
    router.push('/buyer/login');
    return;
  }

  setLoading(true);
  try {
    await api.put('/api/role', { role });

    // Don't await revalidateProfile immediately.
    // Navigate right away based on role selection.
    if (role === 'user') {
      router.push('/buyer/profile');
    } else if (role === 'artisan') {
      router.push('/artisan/onboarding');
    }

    // Optionally revalidate silently after redirect is triggered:
    revalidateProfile();

  } catch (error) {
    console.error('Error updating role:', error);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to KalaMitra!</h1>
            <p className="text-xl text-muted-foreground mb-2">Choose how you'd like to use our platform</p>
            <p className="text-muted-foreground">You can always change this later in your settings</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* User/Buyer Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
 selectedRole === 'user' 
 ? 'border-border bg-accent' 
 : 'border-border hover:border-primary/30'
 }`}
              onClick={() => setSelectedRole('user')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-foreground">I'm a Buyer</CardTitle>
                <CardDescription className="text-muted-foreground">
                  I want to discover and purchase authentic handcrafted items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Browse authentic handcrafted products
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Connect directly with artisans
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Support traditional crafts
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                    Secure payment and delivery
                  </li>
                </ul>
                <Button 
                  className="w-full bg-primary hover:bg-primary"
                  onClick={() => handleRoleSelection('user')}
                  disabled={loading}
                >
                  Continue as Buyer
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Artisan Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
 selectedRole === 'artisan' 
 ? 'border-madder bg-secondary' 
 : 'border-border hover:border-border'
 }`}
              onClick={() => setSelectedRole('artisan')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-madder rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl text-foreground">I'm an Artisan</CardTitle>
                <CardDescription className="text-muted-foreground">
                  I create handcrafted items and want to sell them online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-madder rounded-full mr-3"></div>
                    Showcase your handcrafted products
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-madder rounded-full mr-3"></div>
                    Reach customers across India
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-madder rounded-full mr-3"></div>
                    Voice-enabled listing creation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-madder rounded-full mr-3"></div>
                    Manage orders and inventory
                  </li>
                </ul>
                <Button 
                  className="w-full bg-madder"
                  onClick={() => handleRoleSelection('artisan')}
                  disabled={loading}
                >
                  Continue as Artisan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Need help deciding? <Link href="/help" className="text-madder hover:underline">Learn more about each option</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
