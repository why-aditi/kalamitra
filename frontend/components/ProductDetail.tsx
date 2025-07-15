
"use client"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Heart,
  Star,
  MapPin,
  ArrowLeft,
  ShoppingCart,
  Truck,
  RotateCcw,
  MessageCircle,
  Share2,
  User,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function ProductDetail() {
  const params = useParams()
  const { user } = useAuthContext()
  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({
    name: "",
    phone_number: "",
    address: "",
    paymentMethod: "cod",
  })

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings/${params.id}`)
        const data = await res.json()
        setProduct(data.listing)
        console.log("Fetched product image_ids:", data.listing?.image_ids)
      } catch (err) {
        console.error("Error fetching listing:", err)
      }
    }
    if (params.id) fetchListing()
  }, [params.id])

  const handleOrder = async () => {
    if (!user) {
      alert("Please sign in to continue.")
      window.location.href = "/buyer/login"
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            title: product.title,
            description: product.description,
            price: product.suggested_price || product.price,
            quantity: quantity,
          },
          buyer: {
            name: orderForm.name,
            phone_number: orderForm.phone_number,
            address: orderForm.address,
            email: user.email,
          },
        }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        alert("Failed to redirect to payment gateway.")
      }
    } catch (err) {
      alert("Something went wrong while initiating payment.")
      console.error(err)
    }
  }

  const handleBuyNow = () => {
    if (!user) {
      alert("Please sign in to continue.")
      window.location.href = "/buyer/login"
      return
    }
    setIsOrderModalOpen(true)
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  const listingId = params.id
  if (!listingId || typeof listingId !== "string") {
    throw new Error("Invalid listing ID")
  }
  const imageIds: string[] = product?.image_ids ?? []

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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden border border-orange-200">
              <img
                // --- CHANGE THIS LINE ---
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings/${listingId}/images/${imageIds[selectedImage]}`}
                // --- END CHANGE ---
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {imageIds.map((imageId: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? "border-orange-500" : "border-gray-200"}`}
                >
                  <img
                    // --- CHANGE THIS LINE ---
                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings/${listingId}/images/${imageId}`}
                    // --- END CHANGE ---
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.category}</Badge>
                {product.inStock && <Badge className="bg-green-500">In Stock</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{product.title}</h1>
              {/* Price */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl font-bold text-orange-600">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-xl text-gray-500 line-through">₹{product.originalPrice}</span>
                    <Badge variant="destructive">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>
              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.artisan?.rating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.artisan?.rating ?? 0}</span>
                <span className="text-gray-500">({product.reviews?.length ?? 0} reviews)</span>
              </div>
            </div>
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>
            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {(product.features ?? []).map((feature: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            {/* Tags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {(product.tags ?? []).map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            {/* Quantity & Order */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <Label htmlFor="quantity">Quantity:</Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                    min="1"
                    max={product.stockCount}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-gray-500">({product.stockCount} available)</span>
              </div>
              <div className="flex gap-4">
                <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                  {/* Order Now button outside of DialogTrigger */}
                  <Button
                    onClick={handleBuyNow}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    size="lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Order Now
                  </Button>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Place Your Order</DialogTitle>
                      <DialogDescription>Fill in your details to complete the order</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{product.title}</span>
                          <span className="font-bold">₹{product.price * quantity}</span>
                        </div>
                        <div className="text-sm text-gray-600">Quantity: {quantity}</div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={orderForm.name}
                            onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone_number">Phone Number *</Label>
                          <Input
                            id="phone_number"
                            value={orderForm.phone_number}
                            onChange={(e) => setOrderForm({ ...orderForm, phone_number: e.target.value })}
                            placeholder="Enter your phone number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Delivery Address *</Label>
                          <Textarea
                            id="address"
                            value={orderForm.address}
                            onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                            placeholder="Enter your complete address"
                            rows={3}
                            required
                          />
                        </div>
                        <div>
                          <Label>Payment Method</Label>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant={orderForm.paymentMethod === "cod" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setOrderForm({ ...orderForm, paymentMethod: "cod" })}
                            >
                              Cash on Delivery
                            </Button>
                            <Button
                              variant={orderForm.paymentMethod === "upi" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setOrderForm({ ...orderForm, paymentMethod: "upi" })}
                            >
                              UPI
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleOrder}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        disabled={!orderForm.name || !orderForm.phone_number || !orderForm.address}
                      >
                        Confirm Order - ₹{product.price * quantity}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Artisan
                </Button>
              </div>
            </div>
            {/* Shipping Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-green-700">
                  <Truck className="w-4 h-4" />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Clock className="w-4 h-4" />
                  <span>{product.shippingInfo?.estimatedDays ?? "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <RotateCcw className="w-4 h-4" />
                  <span>{product.shippingInfo?.returnPolicy ?? "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Additional Sections */}
        <div className="mt-16 space-y-12">
          {/* Artisan Story */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                Meet the Artisan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <img
                  src={product.artisan?.avatar || "/placeholder.svg"}
                  alt={product.artisan?.name ?? "Artisan"}
                  className="w-20 h-20 rounded-full border-2 border-orange-200"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{product.artisan?.name ?? "Unknown Artisan"}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {product.artisan?.location ?? "N/A"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {product.artisan?.experience ?? "N/A"} experience
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {product.artisan?.rating ?? 0} rating
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{product.artisan?.bio ?? "No bio available."}</p>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">The Story Behind This Product</h4>
                    <p className="text-gray-600 italic">{product.story ?? "No story available."}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Specifications */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Product Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications ?? {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="text-gray-800">{value as string}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Reviews */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>
                {product.reviews?.length ?? 0} reviews with an average rating of {product.artisan?.rating ?? 0} stars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(product.reviews ?? []).map((review: any) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{review.name}</span>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
