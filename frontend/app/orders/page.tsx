"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Search, Package, Truck, CheckCircle, Clock, ArrowLeft, Eye, MessageCircle, Star } from "lucide-react"
import Link from "next/link"

export default function OrderTracking() {
  const [orders, setOrders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])

  useEffect(() => {
    // Mock orders data
    const mockOrders = [
      {
        id: "KM001",
        productTitle: "Handcrafted Rajasthani Clay Diya Set",
        productImage: "/placeholder.svg?height=100&width=100",
        artisan: "Kamala Devi",
        artisanLocation: "Jaipur, Rajasthan",
        quantity: 2,
        amount: 598,
        status: "shipped",
        orderDate: "2024-01-15",
        estimatedDelivery: "2024-01-22",
        trackingNumber: "TRK123456789",
        paymentMethod: "COD",
        shippingAddress: "123 Main Street, Mumbai, Maharashtra - 400001"
      },
      {
        id: "KM002",
        productTitle: "Traditional Kashmiri Pashmina Shawl",
        productImage: "/placeholder.svg?height=100&width=100",
        artisan: "Abdul Rahman",
        artisanLocation: "Srinagar, Kashmir",
        quantity: 1,
        amount: 2499,
        status: "confirmed",
        orderDate: "2024-01-18",
        estimatedDelivery: "2024-01-25",
        trackingNumber: null,
        paymentMethod: "UPI",
        shippingAddress: "456 Park Avenue, Delhi - 110001"
      },
      {
        id: "KM003",
        productTitle: "Madhubani Painting - Peacock Design",
        productImage: "/placeholder.svg?height=100&width=100",
        artisan: "Sunita Kumari",
        artisanLocation: "Madhubani, Bihar",
        quantity: 1,
        amount: 899,
        status: "delivered",
        orderDate: "2024-01-10",
        estimatedDelivery: "2024-01-17",
        deliveredDate: "2024-01-16",
        trackingNumber: "TRK987654321",
        paymentMethod: "COD",
        shippingAddress: "789 Garden Road, Bangalore, Karnataka - 560001"
      },
      {
        id: "KM004",
        productTitle: "Silver Filigree Jewelry Set",
        productImage: "/placeholder.svg?height=100&width=100",
        artisan: "Meera Patel",
        artisanLocation: "Cuttack, Odisha",
        quantity: 1,
        amount: 1899,
        status: "pending",
        orderDate: "2024-01-20",
        estimatedDelivery: "2024-01-27",
        trackingNumber: null,
        paymentMethod: "UPI",
        shippingAddress: "321 Lake View, Pune, Maharashtra - 411001"
      }
    ]
    setOrders(mockOrders)
    setFilteredOrders(mockOrders)
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.artisan.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredOrders(filtered)
    } else {
      setFilteredOrders(orders)
    }
  }, [searchQuery, orders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <Package className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getOrdersByStatus = (status: string) => {
    return filteredOrders.filter(order => order.status === status)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                KalaMitra
              </span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/marketplace" className="text-gray-600 hover:text-orange-600 transition-colors">
              Browse
            </Link>
            <Button variant="outline">Sign In</Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your orders and manage your purchases</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders by ID, product, or artisan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">
              All Orders ({filteredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({getOrdersByStatus('pending').length})
            </TabsTrigger>
            <TabsTrigger value="confirmed">
              Confirmed ({getOrdersByStatus('confirmed').length})
            </TabsTrigger>
            <TabsTrigger value="shipped">
              Shipped ({getOrdersByStatus('shipped').length})
            </TabsTrigger>
            <TabsTrigger value="delivered">
              Delivered ({getOrdersByStatus('delivered').length})
            </TabsTrigger>
          </TabsList>

          {/* All Orders */}
          <TabsContent value="all" className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card className="border-orange-200">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery ? 'Try adjusting your search terms' : 'Start shopping to see your orders here'}
                  </p>
                  <Button asChild>
                    <Link href="/marketplace">Browse Products</Link>
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
                        />
                        
                        {/* Order Details */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-1">{order.productTitle}</h3>
                              <p className="text-sm text-gray-600">
                                by {order.artisan} • {order.artisanLocation}
                              </p>
                              <p className="text-sm text-gray-500">
                                Order ID: {order.id} • Quantity: {order.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-800">₹{order.amount}</p>
                              <Badge className={`${getStatusColor(order.status)} border`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Order Timeline */}
                          <div className="text-sm text-gray-600">
                            <p>Ordered on: {new Date(order.orderDate).toLocaleDateString()}</p>
                            {order.status === 'delivered' && order.deliveredDate ? (
                              <p className="text-green-600">
                                Delivered on: {new Date(order.deliveredDate).toLocaleDateString()}
                              </p>
                            ) : (
                              <p>Expected delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                            )}
                            {order.trackingNumber && (
                              <p>Tracking: {order.trackingNumber}</p>
                            )}
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
                                Track Order
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Contact Artisan
                            </Button>
                            {order.status === 'delivered' && (
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
          </TabsContent>

          {/* Status-specific tabs */}
          {['pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {getOrdersByStatus(status).length === 0 ? (
                <Card className="border-orange-200">
                  <CardContent className="p-12 text-center">
                    {getStatusIcon(status)}
                    <h3 className="text-xl font-semibold text-gray-600 mb-2 mt-4">
                      No {status} orders
                    </h3>
                    <p className="text-gray-500">
                      Orders with {status} status will appear here
                    </p>
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
                                <p className="text-sm text-gray-600">
                                  by {order.artisan} • {order.artisanLocation}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Order ID: {order.id} • Quantity: {order.quantity}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-800">₹{order.amount}</p>
                                <Badge className={`${getStatusColor(order.status)} border`}>
                                  {getStatusIcon(order.status)}
                                  <span className="ml-1 capitalize">{order.status}</span>
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <p>Ordered on: {new Date(order.orderDate).toLocaleDateString()}</p>
                              {order.status === 'delivered' && order.deliveredDate ? (
                                <p className="text-green-600">
                                  Delivered on: {new Date(order.deliveredDate).toLocaleDateString()}
                                </p>
                              ) : (
                                <p>Expected delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</p>
                              )}
                              {order.trackingNumber && (
                                <p>Tracking: {order.trackingNumber}</p>
                              )}
                            </div>
                            
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
                              {order.status === 'delivered' && (
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
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

