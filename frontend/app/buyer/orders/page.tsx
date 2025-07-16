"use client"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, Truck, CheckCircle, Clock, Eye, MessageCircle, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuthContext } from "@/components/providers/auth-provider"
import { api } from "@/lib/api-client" // Assuming this is your API client

interface Order {
  id: string // Matches backend 'id'
  productTitle: string
  productImage: string // Backend provides full URL
  buyer: string // Assuming buyer name is available
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

export default function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthContext() // Get user from auth context

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.email) {
        setLoading(false)
        return // Do not fetch if user email is not available
      }

      try {
        // Assuming your backend has an endpoint like /api/orders that returns buyer-specific orders
        // and that the response structure is { orders: Order[] }
        const response = await api.get<{ orders: Order[] }>(`api/orders?email=${user.email}`)
        setOrders(response.orders || [])
      } catch (error) {
        console.error("Error fetching orders:", error)
        setOrders([]) // Clear orders on error
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user?.email]) // Re-fetch when user email changes

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9.828m10.36-1.06c.148.41.228.84.228 1.291m0 0a8.966 8.001 0 01-.97 4.577m1.25 0l-.338 2.397M16 5.06c.094.187.187.387.277.608"
              />
            </svg>
          </div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Orders</h1>
        {orders.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
              <Button
                asChild
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              >
                <Link href="/marketplace">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
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
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-gray-800">{order.productTitle}</h3>
                      <p className="text-sm text-gray-600">
                        Ordered by {order.buyer} • Quantity: {order.quantity}
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-800">{order.amount}</p>
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        Ordered on {new Date(order.date).toLocaleDateString()}
                      </div>
                      {order.status === "delivered" && order.deliveredDate ? (
                        <div className="text-xs text-green-600">
                          Delivered on: {new Date(order.deliveredDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">
                          Expected delivery: {new Date(order.estimatedDelivery ?? "").toLocaleDateString()}
                        </div>
                      )}
                      {order.trackingNumber && (
                        <div className="text-xs text-gray-600">Tracking: {order.trackingNumber}</div>
                      )}
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                        {order.trackingNumber && (
                          <Button variant="outline" size="sm">
                            <Truck className="w-4 h-4 mr-1" />
                            Track Order
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Contact Artisan
                        </Button>
                        {order.status === "delivered" && (
                          <Button variant="outline" size="sm">
                            <Star className="w-4 h-4 mr-1" />
                            Rate & Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
