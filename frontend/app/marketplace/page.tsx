"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Heart, MapPin, Star, Mic, Grid, List, Filter, Palette, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuthContext } from "@/components/providers/auth-provider";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  artisan: {
    name: string;
    location: string;
    rating: number;
    craft: string;
    verified: boolean;
  };
  category: string;
  tags: string[];
  inStock: boolean;
  featured: boolean;
  trending: boolean;
  reviews: number;
  soldCount: number;
};

type ListingFromApi = {
  _id: string;
  title?: string;
  description?: string;
  suggested_price?: number | string;
  image_ids?: string[];
  artist_id: string;
  status?: string;
  category?: string;
  tags?: string[];
};

type ArtistData = {
  name?: string;
  display_name?: string;
  region?: string;
  state?: string;
};

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function Marketplace() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce search query to avoid API calls on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Separate filter states for UI and applied filters
  const [tempPriceRange, setTempPriceRange] = useState([0, 20000]);
  const [tempSelectedCraft, setTempSelectedCraft] = useState("all");
  const [tempSelectedState, setTempSelectedState] = useState("all");
  
  // Applied filter states (used for API calls)
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 20000]);
  const [appliedSelectedCraft, setAppliedSelectedCraft] = useState("all");
  const [appliedSelectedState, setAppliedSelectedState] = useState("all");
  
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 12;
  const { profile } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("success") === "true") {
      router.replace("/marketplace/success");
    }
  }, [searchParams, router]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, appliedPriceRange, appliedSelectedCraft, appliedSelectedState]);

  // Fetch listings when page or applied filters change
  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setIsSearching(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const searchParams = new URLSearchParams({
        skip: skip.toString(),
        limit: itemsPerPage.toString(),
        search: debouncedSearchQuery,
        min_price: appliedPriceRange[0].toString(),
        max_price: appliedPriceRange[1].toString(),
        category: appliedSelectedCraft,
        state: appliedSelectedState
      });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings?${searchParams}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Check if data has the expected structure
      if (!data.listings || !Array.isArray(data.listings)) {
        throw new Error('Invalid response structure from API');
      }
      
      const products = await Promise.all(
        (data.listings as ListingFromApi[]).map(async (item: ListingFromApi) => {
          let artistData: ArtistData = {};
          try {
            const artistId = item.artist_id ?? "";
            console.log("Fetching artist data for ID:", artistId);
            const artistRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/${artistId}`);
            if (artistRes.ok) artistData = await artistRes.json();
          } catch {
            artistData = { name: "Traditional Artisan", region: "Unknown", state: "India" };
          }

          const suggestedPriceStr = (item.suggested_price ?? "299").toString();
          const parsedPrice = parseInt(suggestedPriceStr.replace(/\D/g, "")) || 299;

          return {
            id: item._id,
            title: item.title || "Untitled Product",
            description: item.description || "No description available",
            price: parsedPrice,
            originalPrice: Math.round(parsedPrice * 1.2),
            image: item.image_ids?.[0]
              ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings/${item._id}/images/${item.image_ids[0]}`
              : "/placeholder.svg",
            artisan: {
              name: artistData.name || artistData.display_name || "Unknown",
              location: `${artistData.region ?? "Unknown"}, ${artistData.state ?? "India"}`,
              rating: 4.8,
              craft: item.category ?? "Art",
              verified: true,
            },
            category: item.category ?? "Art",
            tags: item.tags || [],
            inStock: item.status === "active",
            featured: Math.random() > 0.7,
            trending: Math.random() > 0.8,
            reviews: Math.floor(Math.random() * 50) + 10,
            soldCount: Math.floor(Math.random() * 100) + 20,
          };
        })
      );
      setAllProducts(products);
      setTotalCount(data.total || 0);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      setAllProducts([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [currentPage, debouncedSearchQuery, appliedPriceRange, appliedSelectedCraft, appliedSelectedState]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Memoize filtered products to avoid recalculation on every render
  const filteredProducts = useMemo(() => {
    return allProducts;
  }, [allProducts]);

  const crafts = useMemo(() => {
    return [...new Set(allProducts.map((p) => p.category.toLowerCase()))];
  }, [allProducts]);

  const states = useMemo(() => {
    return [...new Set(allProducts.map((p) => p.artisan.location.split(",")[1]?.trim().toLowerCase()))];
  }, [allProducts]);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = "/placeholder.svg";
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedPriceRange(tempPriceRange);
    setAppliedSelectedCraft(tempSelectedCraft);
    setAppliedSelectedState(tempSelectedState);
  }, [tempPriceRange, tempSelectedCraft, tempSelectedState]);

  const handleClearFilters = useCallback(() => {
    setTempPriceRange([0, 20000]);
    setTempSelectedCraft("all");
    setTempSelectedState("all");
    setAppliedPriceRange([0, 20000]);
    setAppliedSelectedCraft("all");
    setAppliedSelectedState("all");
    setSearchQuery("");
  }, []);

  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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
                    {isSearching && (
                      <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Filter Tags */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                  <Badge
                    variant="outline"
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => handleQuickSearch("")}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    All
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => handleQuickSearch("madhubani")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Madhubani
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => handleQuickSearch("art")}
                  >
                    Art
                  </Badge>
                  <Badge
                    variant="outline"
                    className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200"
                    onClick={() => handleQuickSearch("traditional")}
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
                          Price Range: ₹{tempPriceRange[0]} - ₹{tempPriceRange[1]}
                        </label>
                        <Slider
                          value={tempPriceRange}
                          onValueChange={setTempPriceRange}
                          max={20000}
                          min={0}
                          step={500}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>₹0</span>
                          <span>₹20,000</span>
                        </div>
                      </div>

                      {/* Craft Type */}
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                        <Select value={tempSelectedCraft} onValueChange={setTempSelectedCraft}>
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
                        <Select value={tempSelectedState} onValueChange={setTempSelectedState}>
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

                      {/* Filter Action Buttons */}
                      <div className="space-y-3">
                        <Button
                          onClick={handleApplyFilters}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Apply Filters
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent"
                          onClick={handleClearFilters}
                        >
                          Clear All Filters
                        </Button>
                      </div>
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
                      {debouncedSearchQuery ? `Results for "${debouncedSearchQuery}"` : "All Products"}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {filteredProducts.length} handcrafted treasures found
                      {isSearching && " (searching...)"}
                    </p>
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

                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-4 mb-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    Previous
                  </Button>
                  <span className="text-gray-600">
                    Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || isLoading}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    Next
                  </Button>
                </div>

                {/* Products Grid */}
                <div className="relative">
                  {isSearching && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
                        <span className="text-gray-700">Searching...</span>
                      </div>
                    </div>
                  )}
                  
                  {filteredProducts.length === 0 && !isSearching ? (
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
                      className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"
                        }`}
                    >
                      {filteredProducts.map((product) => (
                        <Card
                          key={product.id}
                          id={`product-${product.id}`}
                          className="group border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden"
                        >
                          <div className={`${viewMode === "grid" ? "" : "flex"}`}>
                            <div
                              className={`relative overflow-hidden ${viewMode === "grid" ? "aspect-[4/3]" : "w-48 h-48 flex-shrink-0"
                                }`}
                            >
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={handleImageError}
                              />
                              {/* Overlay Badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {product.featured && (
                                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                                {product.trending && (
                                  <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg text-xs">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    Trending
                                  </Badge>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-lg rounded-full p-1.5"
                              >
                                <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                              </Button>

                              {/* Discount Badge */}
                              {product.originalPrice > product.price && (
                                <Badge className="absolute bottom-2 right-2 bg-red-500 text-white shadow-lg text-xs">
                                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                                </Badge>
                              )}
                            </div>

                            <CardContent className={`${viewMode === "grid" ? "p-4" : "p-6 flex-1"}`}>
                              <div className="space-y-3">
                                <div>
                                  <h3 className="font-semibold text-gray-800 text-base line-clamp-2 group-hover:text-orange-600 transition-colors mb-1">
                                    {product.title}
                                  </h3>
                                  <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                                    {product.description}
                                  </p>
                                </div>

                                {/* Artisan Info */}
                                <div className="flex items-center gap-2 text-xs">
                                  <div className="flex items-center gap-1 text-gray-600">
                                    <MapPin className="w-3 h-3" />
                                    <span className="font-medium truncate">{product.artisan.name}</span>
                                    {product.artisan.verified && (
                                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">✓</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Rating & Reviews */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-semibold">{product.artisan.rating}</span>
                                    <span className="text-xs text-gray-500">({product.reviews})</span>
                                  </div>
                                  <Badge variant="outline" className="border-orange-200 text-orange-700 text-xs">
                                    {product.category}
                                  </Badge>
                                </div>

                                {/* Price and Buy Now Button */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-orange-600">₹{product.price}</span>
                                    {product.originalPrice > product.price && (
                                      <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-1.5 text-xs font-semibold shadow"
                                    onClick={() => {
                                      if (!profile) {
                                        window.location.href = "/buyer/login";
                                        return;
                                      }
                                      window.location.href = `/product/${product.id}`;
                                    }}
                                  >
                                    Buy Now
                                  </Button>
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