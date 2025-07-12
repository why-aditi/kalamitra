"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Search, Heart, MapPin, Star, Mic, Grid, List, Filter, Palette, Sparkles, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isVoiceSearch, setIsVoiceSearch] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [selectedCraft, setSelectedCraft] = useState("all")
  const [selectedState, setSelectedState] = useState("all")
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  // Mock products data with enhanced details
  useEffect(() => {
    const mockProducts = [
      {
        id: 1,
        title: "Handcrafted Rajasthani Clay Diya Set",
        description:
          "Exquisite handmade clay diyas crafted using traditional Rajasthani techniques passed down through generations.",
        price: 299,
        originalPrice: 399,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Kamala Devi",
          location: "Jaipur, Rajasthan",
          rating: 4.8,
          craft: "Pottery",
          verified: true,
        },
        category: "Home & Decor",
        tags: ["Handmade", "Clay", "Diya", "Rajasthani", "Traditional"],
        inStock: true,
        featured: true,
        trending: true,
        reviews: 127,
        soldCount: 340,
      },
      {
        id: 2,
        title: "Traditional Kashmiri Pashmina Shawl",
        description: "Luxurious hand-woven Pashmina shawl with intricate embroidery, perfect for special occasions.",
        price: 2499,
        originalPrice: 3200,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Abdul Rahman",
          location: "Srinagar, Kashmir",
          rating: 4.9,
          craft: "Textiles",
          verified: true,
        },
        category: "Fashion",
        tags: ["Pashmina", "Kashmiri", "Handwoven", "Luxury"],
        inStock: true,
        featured: true,
        trending: false,
        reviews: 89,
        soldCount: 156,
      },
      {
        id: 3,
        title: "Madhubani Painting - Peacock Design",
        description: "Authentic Madhubani painting featuring traditional peacock motifs on handmade paper.",
        price: 899,
        originalPrice: 1200,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Sunita Kumari",
          location: "Madhubani, Bihar",
          rating: 4.7,
          craft: "Painting",
          verified: true,
        },
        category: "Art",
        tags: ["Madhubani", "Painting", "Peacock", "Traditional"],
        inStock: true,
        featured: false,
        trending: true,
        reviews: 64,
        soldCount: 89,
      },
      {
        id: 4,
        title: "Wooden Carved Elephant Figurine",
        description: "Intricately carved wooden elephant figurine showcasing traditional Indian craftsmanship.",
        price: 599,
        originalPrice: 799,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Ravi Kumar",
          location: "Mysore, Karnataka",
          rating: 4.6,
          craft: "Wood Carving",
          verified: true,
        },
        category: "Home & Decor",
        tags: ["Wood", "Carved", "Elephant", "Figurine"],
        inStock: true,
        featured: false,
        trending: false,
        reviews: 43,
        soldCount: 78,
      },
      {
        id: 5,
        title: "Silver Filigree Jewelry Set",
        description: "Delicate silver filigree jewelry set with traditional Odia craftsmanship.",
        price: 1899,
        originalPrice: 2400,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Meera Patel",
          location: "Cuttack, Odisha",
          rating: 4.8,
          craft: "Jewelry",
          verified: true,
        },
        category: "Jewelry",
        tags: ["Silver", "Filigree", "Jewelry", "Traditional"],
        inStock: true,
        featured: true,
        trending: false,
        reviews: 92,
        soldCount: 203,
      },
      {
        id: 6,
        title: "Bamboo Basket Weaving Set",
        description: "Eco-friendly bamboo baskets woven using traditional techniques from Northeast India.",
        price: 449,
        originalPrice: 600,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Bina Sharma",
          location: "Shillong, Meghalaya",
          rating: 4.5,
          craft: "Basket Weaving",
          verified: true,
        },
        category: "Home & Decor",
        tags: ["Bamboo", "Basket", "Eco-friendly", "Northeast"],
        inStock: true,
        featured: false,
        trending: true,
        reviews: 38,
        soldCount: 67,
      },
    ]

    // Load any saved listings from artisan dashboard
    const savedListings = localStorage.getItem("artisan_listings")
    if (savedListings) {
      const artisanListings = JSON.parse(savedListings).map((listing: any) => ({
        ...listing,
        price: Number.parseInt(listing.suggestedPrice.replace("₹", "")),
        originalPrice: Number.parseInt(listing.suggestedPrice.replace("₹", "")) + 100,
        image: listing.images?.[0] || "/placeholder.svg?height=400&width=400",
        artisan: {
          name: listing.artisan?.name || "Unknown Artisan",
          location: `${listing.artisan?.region || "Unknown"}, ${listing.artisan?.state || "India"}`,
          rating: 4.8,
          craft: listing.artisan?.craft || "Handmade",
          verified: true,
        },
        category: listing.category || "Handmade",
        inStock: true,
        featured: true,
        trending: true,
        reviews: Math.floor(Math.random() * 50) + 10,
        soldCount: Math.floor(Math.random() * 100) + 20,
      }))
      setProducts([...mockProducts, ...artisanListings])
    } else {
      setProducts(mockProducts)
    }
  }, [])

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          product.artisan.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Price filter
    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    // Craft filter
    if (selectedCraft !== "all") {
      filtered = filtered.filter((product) => product.artisan.craft.toLowerCase() === selectedCraft)
    }

    // State filter
    if (selectedState !== "all") {
      filtered = filtered.filter((product) => product.artisan.location.toLowerCase().includes(selectedState))
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, priceRange, selectedCraft, selectedState])

  const startVoiceSearch = () => {
    setIsVoiceSearch(true)
    // Simulate voice search (in real app, use Web Speech API)
    setTimeout(() => {
      setSearchQuery("clay diya from Rajasthan")
      setIsVoiceSearch(false)
    }, 2000)
  }

  const crafts = ["pottery", "textiles", "jewelry", "wood carving", "painting", "basket weaving"]
  const states = ["rajasthan", "kashmir", "bihar", "karnataka", "odisha", "meghalaya"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="border-b border-amber-200/50 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                KalaMitra
              </span>
              <div className="text-xs text-gray-500 -mt-1">Artisan Marketplace</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/marketplace" className="text-orange-600 font-semibold border-b-2 border-orange-600 pb-1">
              Marketplace
            </Link>
            <Link href="/artisan/login" className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
              For Artisans
            </Link>
            <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent">
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Search Section */}
        <div className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Discover{" "}
              <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
                Authentic
              </span>{" "}
              Handmade Treasures
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Support local artisans and find unique handcrafted products from across India
            </p>

            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto relative mb-8">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <Input
                  placeholder="Search handmade products, artisans, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-16 pr-20 py-6 text-lg border-2 border-orange-200 focus:border-orange-400 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    isVoiceSearch ? "text-red-500 animate-pulse" : "text-gray-400 hover:text-orange-500"
                  } p-3 rounded-xl`}
                  onClick={startVoiceSearch}
                  disabled={isVoiceSearch}
                >
                  <Mic className="w-6 h-6" />
                </Button>
              </div>
              {isVoiceSearch && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-red-600 animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    Listening... Speak now
                  </p>
                </div>
              )}
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200">
                <Sparkles className="w-4 h-4 mr-2" />
                Featured
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200">
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200">
                New Arrivals
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200">
                Best Sellers
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:w-80 space-y-6">
            <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg">
                  <Filter className="w-5 h-5 text-orange-600" />
                  Filters
                </h3>

                <div className="space-y-6">
                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                    </label>
                    <Slider value={priceRange} onValueChange={setPriceRange} max={3000} step={50} className="w-full" />
                  </div>

                  {/* Craft Type */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Craft Type</label>
                    <Select value={selectedCraft} onValueChange={setSelectedCraft}>
                      <SelectTrigger className="border-orange-200 focus:border-orange-400">
                        <SelectValue placeholder="All crafts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All crafts</SelectItem>
                        {crafts.map((craft) => (
                          <SelectItem key={craft} value={craft}>
                            {craft.charAt(0).toUpperCase() + craft.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">State</label>
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="border-orange-200 focus:border-orange-400">
                        <SelectValue placeholder="All states" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All states</SelectItem>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state.charAt(0).toUpperCase() + state.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
                    onClick={() => {
                      setSearchQuery("")
                      setPriceRange([0, 2000])
                      setSelectedCraft("all")
                      setSelectedState("all")
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
                </h2>
                <p className="text-gray-600 mt-1">{filteredProducts.length} handcrafted treasures found</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={
                    viewMode === "grid"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-orange-300 text-orange-600 hover:bg-orange-50"
                  }
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "border-orange-300 text-orange-600 hover:bg-orange-50"
                  }
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-16 text-center">
                  <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-semibold text-gray-600 mb-3">No products found</h3>
                  <p className="text-gray-500 text-lg">
                    Try adjusting your search or filters to discover more treasures
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div
                className={`grid gap-8 ${
                  viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                }`}
              >
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="group border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden"
                  >
                    <Link href={`/product/${product.id}`}>
                      <div className={`${viewMode === "grid" ? "" : "flex"}`}>
                        <div
                          className={`relative overflow-hidden ${
                            viewMode === "grid" ? "aspect-square" : "w-64 h-64 flex-shrink-0"
                          }`}
                        >
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />

                          {/* Overlay Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {product.featured && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {product.trending && (
                              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-lg rounded-full p-2"
                          >
                            <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
                          </Button>

                          {/* Discount Badge */}
                          {product.originalPrice > product.price && (
                            <Badge className="absolute bottom-3 right-3 bg-red-500 text-white shadow-lg">
                              {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                            </Badge>
                          )}
                        </div>

                        <CardContent className={`${viewMode === "grid" ? "p-6" : "p-8 flex-1"}`}>
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
                                {product.title}
                              </h3>
                              <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            </div>

                            {/* Artisan Info */}
                            <div className="flex items-center gap-2 text-sm">
                              <div className="flex items-center gap-1 text-gray-600">
                                <MapPin className="w-4 h-4" />
                                <span className="font-medium">{product.artisan.name}</span>
                                {product.artisan.verified && (
                                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{product.artisan.location}</span>
                            </div>

                            {/* Rating & Reviews */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-semibold">{product.artisan.rating}</span>
                                </div>
                                <span className="text-sm text-gray-500">({product.reviews} reviews)</span>
                              </div>
                              <span className="text-xs text-gray-500">{product.soldCount} sold</span>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                              {product.tags.slice(0, 3).map((tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-orange-600">₹{product.price}</span>
                                {product.originalPrice > product.price && (
                                  <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                                )}
                              </div>
                              <Badge variant="outline" className="border-orange-200 text-orange-700">
                                {product.category}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
