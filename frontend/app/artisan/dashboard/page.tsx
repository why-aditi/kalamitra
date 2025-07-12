"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Heart,
  Plus,
  Eye,
  Edit,
  Package,
  TrendingUp,
  ShoppingCart,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function ArtisanDashboard() {
  const searchParams = useSearchParams()
  const [artisan, setArtisan] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Load artisan profile
    const profile = localStorage.getItem("artisan_profile")
    if (profile) {
      setArtisan(JSON.parse(profile))
    }

    // Load listings
    const savedListings = localStorage.getItem("artisan_listings")
    if (savedListings) {
      setListings(JSON.parse(savedListings))
    }

    // Load orders (mock data)
    setOrders([
      {
        id: 1,
        productTitle: "Handcrafted Rajasthani Clay Diya Set",
        buyer: "Priya Sharma",
        amount: "₹299",
        status: "pending",
        date: "2024-01-15",
        quantity: 2,
      },
      {
        id: 2,
        productTitle: "Traditional Pottery Vase",
        buyer: "Amit Kumar",
        amount: "₹599",
        status: "confirmed",
        date: "2024-01-14",
        quantity: 1,
      },
    ])

    // Show success message if redirected from create listing
    if (searchParams.get("success") === "true") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  const stats = {
    totalListings: listings.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + Number.parseInt(order.amount.replace("₹", "")), 0),
    avgRating: 4.8,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "shipped":
        return <Package className="w-4 h-4" />
      case "delivered":
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  if (!artisan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to KalaMitra</CardTitle>
            <CardDescription>Please complete your profile to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <Link href="/artisan/onboarding">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              KalaMitra
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/marketplace">View Marketplace</Link>
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              asChild
            >
              <Link href="/artisan/create-listing">
                <Plus className="w-4 h-4 mr-2" />
                Create Listing
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>🎉 Your product has been published successfully!</span>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {artisan.name}! 👋</h1>
          <p className="text-gray-600">
            {artisan.craft} artisan from {artisan.region}, {artisan.state}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Listings</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalListings}</p>
                </div>
                <Package className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-800">₹{stats.totalRevenue}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.avgRating}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">My Listings</h2>
              <Button
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                asChild
              >
                <Link href="/artisan/create-listing">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Link>
              </Button>
            </div>

            {listings.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No listings yet</h3>
                  <p className="text-gray-500 mb-6">Create your first product listing to start selling</p>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    asChild
                  >
                    <Link href="/artisan/create-listing">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Listing
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {listing.images && listing.images[0] ? (
                        <img
                          src={listing.images[0] || "/placeholder.svg"}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-green-500">Published</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{listing.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-bold text-orange-600">{listing.suggestedPrice}</span>
                        <Badge variant="outline">{listing.category}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>

            {orders.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
                  <p className="text-gray-500">Orders will appear here once customers start buying your products</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">{order.productTitle}</h3>
                          <p className="text-gray-600 text-sm mb-2">
                            Ordered by {order.buyer} • Quantity: {order.quantity}
                          </p>
                          <p className="text-gray-500 text-xs">Order Date: {order.date}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-800">{order.amount}</p>
                            <div
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>

            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle>Artisan Information</CardTitle>
                <CardDescription>Your profile information as shown to buyers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                    <p className="text-gray-800">{artisan.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Craft</Label>
                    <p className="text-gray-800">{artisan.craft}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Location</Label>
                    <p className="text-gray-800">
                      {artisan.region}, {artisan.state}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Language</Label>
                    <p className="text-gray-800">{artisan.language}</p>
                  </div>
                  {artisan.experience && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Experience</Label>
                      <p className="text-gray-800">{artisan.experience} years</p>
                    </div>
                  )}
                </div>
                {artisan.bio && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">About</Label>
                    <p className="text-gray-800">{artisan.bio}</p>
                  </div>
                )}
                <Button variant="outline" className="mt-4 bg-transparent">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
