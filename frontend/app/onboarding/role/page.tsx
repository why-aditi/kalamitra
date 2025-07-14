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
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const handleRoleSelection = async (role: string) => {
    if (!user) {
      router.push('/buyer/login')
      return
    }

    setLoading(true)
    try {
      // Update user role in backend
      await api.put('/api/users/role', { role })
      
      // Redirect based on role
      if (role === 'user') {
        router.push('/buyer/profile')
      } else if (role === 'artisan') {
        router.push('/artisan/onboarding')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      // Handle error - maybe show a toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to KalaMitra!</h1>
            <p className="text-xl text-gray-600 mb-2">Choose how you'd like to use our platform</p>
            <p className="text-gray-500">You can always change this later in your settings</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* User/Buyer Option */}
            <Card 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedRole === 'user' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedRole('user')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-800">I'm a Buyer</CardTitle>
                <CardDescription className="text-gray-600">
                  I want to discover and purchase authentic handcrafted items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Browse authentic handcrafted products
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Connect directly with artisans
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Support traditional crafts
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Secure payment and delivery
                  </li>
                </ul>
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600"
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
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => setSelectedRole('artisan')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-800">I'm an Artisan</CardTitle>
                <CardDescription className="text-gray-600">
                  I create handcrafted items and want to sell them online
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-gray-600 mb-6">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Showcase your handcrafted products
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Reach customers across India
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Voice-enabled listing creation
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                    Manage orders and inventory
                  </li>
                </ul>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
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
            <p className="text-sm text-gray-500">
              Need help deciding? <Link href="/help" className="text-orange-600 hover:underline">Learn more about each option</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
