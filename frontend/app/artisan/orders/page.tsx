"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Package, Truck, CheckCircle, Clock, Eye, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useAuthContext } from "@/components/providers/auth-provider"
import { api } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

// Define the interface for an order as seen by an artisan
interface Order {
  id: string // Matches backend '_id' of the order
  productTitle: string
  productImage: string // Backend provides full URL
  buyer: string // This will be the buyer's name
  amount: string // "₹XXX.XX"
  status: string
  date: string // ISO string for order date
  quantity: number
  shippingAddress?: string
  paymentMethod?: string
  trackingNumber?: string | null
  estimatedDelivery?: string | null
  deliveredDate?: string | null
}

export default function ArtisanOrdersPage() {
  const { user, loading: authLoading } = useAuthContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    const fetchArtisanOrders = async () => {
      if (authLoading) return // Wait for auth context to load
      console.log("DEBUG_AUTH: Current user object:", user)

      // Ensure user is logged in and has a firebase_uid (which is used as artist_id in backend)
      if (!user?.uid) {
        // Correctly check for the 'uid' property from firebase/auth User
        setLoadingOrders(false)
        console.log("DEBUG_AUTH: User not logged in or Firebase UID not available. Cannot fetch artisan orders.")
        // Optionally redirect to login or show a message
        return
      }

      setLoadingOrders(true)
      try {
        // Fetch orders for the logged-in artisan's products
        // The /api/artist/orders endpoint handles authentication via token
        const token = localStorage.getItem("accessToken")
        if (!token) {
          console.error("No access token found for fetching artisan orders.")
          setLoadingOrders(false)
          return
        }

        // Fetch orders for the logged-in artisan's products
        // This will use the /api/artist/orders endpoint which returns orders for the artist's products
        const response = await api.get<Order[]>(`/api/artist/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        console.log("DEBUG_ARTISAN_ORDERS: API response received:", response)
        console.log("DEBUG_ARTISAN_ORDERS: Orders array from API:", response)
        setOrders(response || []) // The backend for /api/artist/orders returns Order[] directly
      } catch (error) {
        console.error("Error fetching artisan orders:", error)
        setOrders([]) // Clear orders on error
      } finally {
        setLoadingOrders(false)
      }
    }

    fetchArtisanOrders()
  }, [authLoading]) // Re-fetch when auth loading state changes

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.buyer.toLowerCase().includes(searchQuery.toLowerCase()), // Artisan might search by buyer name
      )
      setFilteredOrders(filtered)
    } else {
      setFilteredOrders(orders)
    }
  }, [searchQuery, orders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "shipped":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />
      case "shipped":
        return <Truck className="w-4 h-4" />
      case "delivered":
        return <Package className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getOrdersByStatus = (status: string) => {
    return filteredOrders.filter((order) => order.status === status)
  }

  if (authLoading || loadingOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Manage orders of your products</p>
        </div>
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders by ID, product, or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>
        {/* Orders Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getOrdersByStatus("pending").length})</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({getOrdersByStatus("confirmed").length})</TabsTrigger>
            <TabsTrigger value="shipped">Shipped ({getOrdersByStatus("shipped").length})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({getOrdersByStatus("delivered").length})</TabsTrigger>
          </TabsList>
          {/* All Orders */}
          <TabsContent value="all" className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Customers' orders for your products will appear here"}
                  </p>
                  <Button asChild>
                    <Link href="/artisan/products">Manage Your Products</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <img
                          src={order.productImage || "/placeholder.svg"}
                          alt={order.productTitle}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = "/placeholder.svg" // Fallback on error
                          }}
                        />
                        {/* Order Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-1">{order.productTitle}</h3>
                              <p className="text-sm text-gray-600">Ordered by {order.buyer}</p>
                              <p className="text-sm text-gray-500">
                                Order ID: {order.id} • Quantity: {order.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-800">{order.amount}</p>
                              <Badge className={`${getStatusColor(order.status)} border`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                            </div>
                          </div>
                          {/* Order Timeline */}
                          <div className="text-sm text-gray-600">
                            <p>Ordered on: {new Date(order.date).toLocaleDateString()}</p>
                            {order.status === "delivered" && order.deliveredDate ? (
                              <p className="text-green-600">
                                Delivered on: {new Date(order.deliveredDate).toLocaleDateString()}
                              </p>
                            ) : (
                              <p>Expected delivery: {new Date(order.estimatedDelivery || "").toLocaleDateString()}</p>
                            )}
                            {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                            {order.trackingNumber && (
                              <Button variant="outline" size="sm">
                                <Truck className="w-4 h-4 mr-1" />
                                Update Tracking
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Contact Artisan
                            </Button>
                            {/* Removed Rate & Review as it's for buyers */}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          {/* Status-specific tabs */}
          {["pending", "confirmed", "shipped", "delivered"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {getOrdersByStatus(status).length === 0 ? (
                <Card className="border-orange-200">
                  <CardContent className="p-12 text-center">
                    {getStatusIcon(status)}
                    <h3 className="text-xl font-semibold text-gray-600 mb-2 mt-4">No {status} orders</h3>
                    <p className="text-gray-500">Orders with {status} status will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {getOrdersByStatus(status).map((order) => (
                    <Card key={order.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <img
                            src={order.productImage || "/placeholder.svg"}
                            alt={order.productTitle}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-800 mb-1">{order.productTitle}</h3>
                                <p className="text-sm text-gray-600">Ordered by {order.buyer}</p>
                                <p className="text-sm text-gray-500">
                                  Order ID: {order.id} • Quantity: {order.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">{order.amount}</p>
                                <Badge className={`${getStatusColor(order.status)} border`}>
                                  {getStatusIcon(status)}
                                  <span className="ml-1 capitalize">{order.status}</span>
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>Ordered on: {new Date(order.date).toLocaleDateString()}</p>
                              {order.status === "delivered" && order.deliveredDate ? (
                                <p className="text-green-600">
                                  Delivered on: {new Date(order.deliveredDate).toLocaleDateString()}
                                </p>
                              ) : (
                                <p>Expected delivery: {new Date(order.estimatedDelivery || "").toLocaleDateString()}</p>
                              )}
                              {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                              {order.trackingNumber && (
                                <Button variant="outline" size="sm">
                                  <Truck className="w-4 h-4 mr-1" />
                                  Update Tracking
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Contact Artisan
                              </Button>
                              {/* Removed Rate & Review as it's for buyers */}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
