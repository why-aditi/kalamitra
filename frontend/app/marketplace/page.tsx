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

// Define proper types
interface Artisan {
  name: string
  location: string
  rating: number
  craft: string
  verified: boolean
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  originalPrice: number
  image: string
  artisan: Artisan
  category: string
  tags: string[]
  inStock: boolean
  featured: boolean
  trending: boolean
  reviews: number
  soldCount: number
}

interface ApiListing {
  _id: string
  title?: string
  description?: string
  suggested_price?: string | number
  image_ids?: string[]
  artist_id?: {
    name?: string
    region?: string
    state?: string
  }
  category?: string
  tags?: string[]
  status?: string
}

interface ApiResponse {
  listings: ApiListing[]
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isVoiceSearch, setIsVoiceSearch] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000])
  const [selectedCraft, setSelectedCraft] = useState("all")
  const [selectedState, setSelectedState] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings`);
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }
        const data: ApiResponse = await response.json();
        
        // Transform the API data to match your product structure
        const listings: Product[] = data.listings?.map((listing: ApiListing) => {
          // Handle price - extract numeric value from price string
          const priceStr = listing.suggested_price || "₹299";
          const priceMatch = priceStr.toString().match(/\d+/);
          const price = priceMatch ? parseInt(priceMatch[0], 10) : 299;
          
          return {
            id: listing._id,
            title: listing.title || "Untitled Product",
            description: listing.description || "No description available",
            price: price,
            originalPrice: price + Math.floor(price * 0.2), // 20% higher original price
            image: listing.image_ids?.[0] 
              ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings/${listing._id}/images/${listing.image_ids[0]}`
              : "/placeholder.svg",
            artisan: {
              name: listing.artist_id?.name || "Traditional Artisan",
              location: listing.artist_id?.region 
                ? `${listing.artist_id.region}, ${listing.artist_id.state || "India"}` 
                : "Bihar, India",
              rating: 4.8,
              craft: listing.category || "Art",
              verified: true,
            },
            category: listing.category || "Art",
            tags: listing.tags || [],
            inStock: listing.status === "active",
            featured: Math.random() > 0.7, // Random featured status
            trending: Math.random() > 0.8, // Random trending status
            reviews: Math.floor(Math.random() * 50) + 10,
            soldCount: Math.floor(Math.random() * 100) + 20,
          };
        }) || [];
        
        setProducts(listings);
        setError(null);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load products. Please try again later.');
        setProducts([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Check for success param after publishing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      const listingId = urlParams.get('listingId')
      
      if (success && listingId) {
        // Remove the query parameters
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
        
        // Highlight the newly published listing
        setTimeout(() => {
          const element = document.getElementById(`product-${listingId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlight-new')
            setTimeout(() => {
              element.classList.remove('highlight-new')
            }, 3000)
          }
        }, 1000)
      }
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
          product.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          product.artisan.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Price filter
    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    // Craft filter
    if (selectedCraft !== "all") {
      filtered = filtered.filter((product) => product.category.toLowerCase() === selectedCraft.toLowerCase())
    }

    // State filter
    if (selectedState !== "all") {
      filtered = filtered.filter((product) => product.artisan.location.toLowerCase().includes(selectedState.toLowerCase()))
    }

    setFilteredProducts(filtered)
    console.log("Filtered products:", filtered)
  }, [products, searchQuery, priceRange, selectedCraft, selectedState])

  const startVoiceSearch = () => {
    setIsVoiceSearch(true)
    // Simulate voice search (in real app, use Web Speech API)
    setTimeout(() => {
      setSearchQuery("madhubani painting")
      setIsVoiceSearch(false)
    }, 2000)
  }

  // Extract unique categories and states from actual data
  const crafts = [...new Set(products.map(p => p.category.toLowerCase()))].filter(Boolean)
  const states = [...new Set(products.map(p => {
    const location = p.artisan.location.toLowerCase()
    if (location.includes(',')) {
      return location.split(',')[1]?.trim() || ''
    }
    return location
  }))].filter(Boolean)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "/placeholder.svg";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-lg text-gray-700">Loading handcrafted treasures...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Search Section */}
        {!isLoading && (
          <>
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

                {/* Search Bar */}
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
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => setSearchQuery("")}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    All
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => setSearchQuery("madhubani")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Madhubani
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => setSearchQuery("art")}
                  >
                    Art
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => setSearchQuery("traditional")}
                  >
                    Traditional
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
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
                        <Slider 
                          value={priceRange} 
                          onValueChange={setPriceRange} 
                          max={5000} 
                          step={100} 
                          className="w-full" 
                        />
                      </div>

                      {/* Craft Type */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                        <Select value={selectedCraft} onValueChange={setSelectedCraft}>
                          <SelectTrigger className="border-orange-200 focus:border-orange-400">
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All categories</SelectItem>
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
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                          <SelectTrigger className="border-orange-200 focus:border-orange-400">
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All locations</SelectItem>
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
                          setPriceRange([0, 5000])
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
                        id={`product-${product.id}`}
                        className="group border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-2xl bg-white/90 backdrop-blur-sm overflow-hidden"
                      >
                        <div className={`${viewMode === "grid" ? "" : "flex"}`}>
                          <div
                            className={`relative overflow-hidden ${
                              viewMode === "grid" ? "aspect-square" : "w-64 h-64 flex-shrink-0"
                            }`}
                          >
                            <img
                              src={product.image}
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={handleImageError}
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
                                {product.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

                              {/* Price and Buy Now Button */}
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-orange-600">₹{product.price}</span>
                                  {product.originalPrice > product.price && (
                                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge variant="outline" className="border-orange-200 text-orange-700 mb-2">
                                    {product.category}
                                  </Badge>
                                  <Button
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 text-sm font-semibold shadow"
                                    onClick={() => alert('Buy Now functionality coming soon!')}
                                  >
                                    Buy Now
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(249, 115, 22, 0.2);
          }
        }
        
        .highlight-new {
          animation: pulse 1.5s ease-in-out infinite;
          border-color: rgba(249, 115, 22, 0.5) !important;
        }
      `}</style>
    </div>
  )
}