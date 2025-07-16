"use client"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuthContext } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingPage } from "@/components/ui/loading"
import { Plus, Eye, Edit, Package, TrendingUp, ShoppingCart, Star, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface ArtisanProfile {
  id: string
  name: string
  craft: string
  region: string
  state: string
  language: string
  experience?: string
  bio?: string
}

interface ListingsResponse {
  listings: Listing[] | []
  total: number
  limit: number
  skip: number
}

interface Listing {
  id: string // Changed from _id to id to match Pydantic model alias
  title: string
  description: string
  images: string[] // This will now contain full URLs
  suggestedPrice: string
  category: string
}

interface Order {
  id: string
  productTitle: string
  productImage: string
  buyer: string
  amount: string
  status: string
  date: string
  quantity: number
  shippingAddress?: string
  paymentMethod?: string
  trackingNumber?: string | null
  estimatedDelivery?: string | null
  deliveredDate?: string | null
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function ArtisanDashboard() {
  const searchParams = useSearchParams()
  const { profile: authProfile, loading: authLoading } = useAuthContext()
  const [artisanProfile, setArtisanProfile] = useState<ArtisanProfile | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const fetchWithAuth = async <T,>(endpoint: string): Promise<T> => {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || res.statusText || "API Error")
      }
      return res.json()
    }

    const fetchData = async () => {
      if (authProfile && authProfile.role === "artisan") {
        setLoadingData(true)
        try {
          const [profileResponse, listingsResponse, ordersResponse] = await Promise.all([
            fetchWithAuth<ArtisanProfile>("/api/artist/me"),
            fetchWithAuth<ListingsResponse>("/api/artist/listings"),
            fetchWithAuth<Order[]>("/api/artist/orders"), // NEW: Fetch real orders
          ])
          setArtisanProfile(profileResponse)
          setListings(listingsResponse?.listings ?? [])
          setOrders(ordersResponse ?? []) // NEW: Use fetched orders
        } catch (error) {
          console.error("Failed to fetch artisan dashboard data:", error)
          setListings([])
          setOrders([]) // Ensure orders are cleared on error
        } finally {
          setLoadingData(false)
        }
      } else if (!authLoading) {
        setLoadingData(false)
      }
    }

    fetchData()

    if (searchParams.get("success") === "true") {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [authProfile, authLoading, searchParams])

  if (authLoading || loadingData) return <LoadingPage />

  if (!artisanProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to KalaMitra</CardTitle>
            <CardDescription>Please complete your artisan profile to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" asChild>
              <Link href="/artisan/onboarding">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = {
    totalListings: listings.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + Number.parseFloat(order.amount.replace("₹", "")), 0), // Use parseFloat
    avgRating: 4.8,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "delivered": // Added delivered status color
        return "bg-blue-100 text-blue-800"
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
      case "delivered": // Added delivered status icon
        return <Package className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {showSuccess && (
        <div className="bg-green-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>🎉 Your product has been published successfully!</span>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8 mb-8">
        <div className="mx-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {artisanProfile.name}! 👋</h1>
          <p className="text-gray-600">
            {artisanProfile.craft} artisan from {artisanProfile.region}, {artisanProfile.state}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 m-8">
          <Card className="border-orange-200">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalListings}</p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-orange-500" />
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-800">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="p-6 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-800">{stats.avgRating}</p>
              </div>
              <Star className="w-8 h-8 text-orange-500" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="listings" className="space-y-6 m-8">
          <TabsList className="grid w-full grid-cols-2">
            {" "}
            {/* Changed to 3 columns for profile tab */}
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-6 m-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">My Listings</h2>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500">
                <Link href="/artisan/create-listing">
                  <Plus className="w-4 h-4 mr-2" /> Add New Product
                </Link>
              </Button>
            </div>
            {listings.length === 0 ? (
              <Card className="border-orange-200 text-center p-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No listings yet</h3>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500">
                  <Link href="/artisan/create-listing">
                    <Plus className="w-4 h-4 mr-2" /> Create Your First Listing
                  </Link>
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing, index) => (
                  <Card key={listing.id || `listing-${index}`} className="hover:shadow-lg">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      {listing.images?.[0] ? (
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
                      <div className="flex justify-between mb-4">
                        <span className="text-lg font-bold text-orange-600">{listing.suggestedPrice}</span>
                        <Badge variant="outline">{listing.category}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-6 flex justify-between items-center">
                      <div className="flex items-start gap-4">
                        <img
                          src={order.productImage || "/placeholder.svg"}
                          alt={order.productTitle}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800">{order.productTitle}</h3>
                          <p className="text-gray-600 text-sm">
                            Ordered by {order.buyer} • Quantity: {order.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{order.amount}</p>
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
