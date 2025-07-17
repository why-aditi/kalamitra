"use client"
import { useAuthContext } from "@/components/providers/auth-provider"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Heart,
  Star,
  MapPin,
  ShoppingCart,
  Truck,
  RotateCcw,
  MessageCircle,
  User,
  Award,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { api } from "@/lib/api-client" // Assuming your API client is here

// Type definitions
interface Artisan {
  name: string
  location: string
  rating: number
  craft: string
  experience: string
  totalProducts: number
  bio: string
  avatar: string
}

interface Review {
  id: number
  name: string
  rating: number
  comment: string
  date: string
  verified: boolean
}

interface ShippingInfo {
  freeShipping: boolean
  estimatedDays: string
  returnPolicy: string
}

interface Product {
  id: string // Changed to string to match MongoDB ObjectId
  title: string
  description: string
  price: number
  originalPrice: number
  images: string[] // Full URLs from backend
  artisan: Artisan
  category: string
  tags: string[]
  inStock: boolean
  stockCount: number
  features: string[]
  specifications: Record<string, string>
  story: string
  reviews: Review[]
  shippingInfo: ShippingInfo
}

interface OrderForm {
  name: string
  phone_number: string
  address: string
  paymentMethod: string
}

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthContext()
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [loadingProduct, setLoadingProduct] = useState(true) // New loading state for product fetch
  const [orderForm, setOrderForm] = useState<OrderForm>({
    name: "",
    phone_number: "",
    address: "",
    paymentMethod: "card",
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params.id) {
        console.log("DEBUG: params.id is missing, cannot fetch product.")
        setLoadingProduct(false)
        return
      }
      console.log("DEBUG: Fetching product with params.id:", params.id) // Added debug log for params.id

      setLoadingProduct(true)
      try {
        // Fetch product data from your API
        const response = await api.get<{ listing: Product }>(`/api/listings/${params.id}`)
        setProduct(response.listing)
        console.log("DEBUG: Product fetched successfully. Product ID from API:", response.listing.id) // Log fetched product ID
      } catch (error) {
        console.error("Failed to fetch product details:", error)
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        })
        setProduct(null) // Ensure product is null on error
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchProduct()
  }, [params.id, toast])

  const handleOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your purchase.",
        variant: "destructive",
      })
      router.push("/buyer/login")
      return
    }
    // Validate form data
    if (!orderForm.name || !orderForm.phone_number || !orderForm.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }
    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(orderForm.phone_number)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive",
      })
      return
    }
    if (!product) {
      toast({
        title: "Product Error",
        description: "Product information is not available.",
        variant: "destructive",
      })
      return
    }
    // NEW: Check if user.email is available
    if (!user.email) {
      toast({
        title: "User Email Missing",
        description: "Your email address is required to place an order. Please ensure your profile is complete.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Show loading state
      toast({
        title: "Processing Order...",
        description: "Creating your order, please wait.",
      })
      const accessToken = localStorage.getItem("accessToken")

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        })
        router.push("/buyer/login")
        return
      }

      const orderData = {
        product: {
          id: product.id || (params.id as string), // Fallback to params.id if product.id is falsy
          title: product.title,
          description: product.description,
          price: product.price,
          quantity: quantity,
        },
        buyer: {
          name: orderForm.name.trim(),
          email: user.email,
          phone_number: orderForm.phone_number.trim(),
          address: orderForm.address.trim(),
        },
      }

      console.log("Sending order data:", orderData) // This log is already there!
      console.log("DEBUG: Product ID being sent:", orderData.product.id) // Updated log to reflect the actual ID being sent

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderData),
      })

      console.log("Response status:", res.status)

      if (!res.ok) {
        let errorMessage = `Server error: ${res.status}`
        try {
          const errorData = await res.json()
          errorMessage = errorData.detail || errorMessage
        } catch (e) {
          console.error("Error parsing error response:", e)
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      console.log("Checkout session created:", data)

      if (data?.url) {
        // Close modal before redirecting
        setIsOrderModalOpen(false)

        // Show success message
        // toast({
        //   title: "Order Created Successfully!",
        //   description: "Redirecting to payment page...",
        //   variant: "default",
        // })
        // Small delay to show the toast, then redirect
        setTimeout(() => {
          window.location.href = data.url
        }, 1000)
      } else {
        throw new Error("No checkout URL received from server")
      }
    } catch (err) {
      console.error("Checkout error:", err)
      toast({
        title: "Checkout Error",
        description: err instanceof Error ? err.message : "Failed to initiate checkout. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your purchase.",
        variant: "destructive",
      })
      router.push("/buyer/login")
      return
    }
    setIsOrderModalOpen(true)
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return
    const qty = Math.max(1, Math.min(product.stockCount, newQuantity))
    setQuantity(qty)
  }

  const handleInputChange = (field: keyof OrderForm, value: string) => {
    setOrderForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (loadingProduct) {
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The product you are looking for does not exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-orange-500 hover:bg-orange-600" asChild>
              <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden border border-orange-200">
              <img
                src={product.images[selectedImage] || "/placeholder.svg"}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImage(index)
                  }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index ? "border-orange-500" : "border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg"
                    }}
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
                        i < Math.floor(product.artisan.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.artisan.rating}</span>
                <span className="text-gray-500">({product.reviews.length} reviews)</span>
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
                {product.features.map((feature, index) => (
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
                {product.tags.map((tag) => (
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                    className="w-20 text-center"
                    min="1"
                    max={product.stockCount}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stockCount}
                  >
                    +
                  </Button>
                </div>
                <span className="text-sm text-gray-500">({product.stockCount} available)</span>
              </div>
              <div className="flex gap-4">
                <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                  <Button
                    onClick={handleBuyNow}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    size="lg"
                    disabled={!product.inStock || isProcessing}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {isProcessing ? "Processing..." : "Order Now"}
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
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone_number">Phone Number *</Label>
                          <Input
                            id="phone_number"
                            type="tel"
                            value={orderForm.phone_number}
                            onChange={(e) => handleInputChange("phone_number", e.target.value)}
                            placeholder="Enter your 10-digit phone number"
                            maxLength={10}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Delivery Address *</Label>
                          <Textarea
                            id="address"
                            value={orderForm.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Enter your complete address with pin code"
                            rows={3}
                            required
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleOrder}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        disabled={!orderForm.name || !orderForm.phone_number || !orderForm.address || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Confirm Order - ₹${product.price * quantity}`
                        )}
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
                  <span>{product.shippingInfo.estimatedDays}</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <RotateCcw className="w-4 h-4" />
                  <span>{product.shippingInfo.returnPolicy}</span>
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
                  src={product.artisan.avatar || "/placeholder.svg"}
                  alt={product.artisan.name}
                  className="w-20 h-20 rounded-full border-2 border-orange-200"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{product.artisan.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {product.artisan.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {product.artisan.experience} experience
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {product.artisan.rating} rating
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{product.artisan.bio}</p>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">The Story Behind This Product</h4>
                    <p className="text-gray-600 italic">{product.story}</p>
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
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-600">{key}:</span>
                    <span className="text-gray-800">{value}</span>
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
                {product.reviews.length} reviews with an average rating of {product.artisan.rating} stars
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {product.reviews.map((review, index) => (
                  <div key={`${review.id || index}-${review.name}`} className="border-b border-gray-100 pb-4 last:border-b-0">
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
