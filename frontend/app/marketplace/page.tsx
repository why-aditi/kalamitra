"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Heart, MapPin, Star, Grid, List, Filter, Palette, Sparkles, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/components/providers/auth-provider";

// #region Type Definitions
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

type ProductGridProps = {
  searchQuery: string;
  priceRange: number[];
  selectedCraft: string;
  selectedState: string;
  profile: any; // Replace 'any' with your actual profile type
};
// #endregion

// #region Custom Hooks
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
// #endregion

// #region ProductGrid Component
function ProductGrid({ searchQuery, priceRange, selectedCraft, selectedState, profile }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  const itemsPerPage = 12;

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        min_price: priceRange[0].toString(),
        max_price: priceRange[1].toString(),
        category: selectedCraft === "all" ? "" : selectedCraft,
        state: selectedState === "all" ? "" : selectedState,
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/listings?${params}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      if (!data.listings || !Array.isArray(data.listings)) {
        throw new Error('Invalid response structure from API');
      }

      const fetchedProducts = await Promise.all(
        (data.listings as ListingFromApi[]).map(async (item: ListingFromApi) => {
          let artistData: ArtistData = {};
          try {
            const artistRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/${item.artist_id}`);
            if (artistRes.ok) artistData = await artistRes.json();
          } catch {
            artistData = { name: "Traditional Artisan", region: "Unknown", state: "India" };
          }

          const price = parseInt(((item.suggested_price ?? "299").toString()).replace(/\D/g, "")) || 299;

          return {
            id: item._id,
            title: item.title || "Untitled Product",
            description: item.description || "No description available",
            price: price,
            originalPrice: Math.round(price * 1.2),
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

      setProducts(fetchedProducts);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      setProducts([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, priceRange, selectedCraft, selectedState]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, selectedCraft, selectedState]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = "/placeholder.svg";
  };

  return (
    <div className="flex-1">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
          </h2>
          <p className="text-gray-600 mt-1">
            {totalCount} handcrafted treasures found
            {isLoading && " (searching...)"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")} className={viewMode === "grid" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-300 text-orange-600 hover:bg-orange-50"}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-300 text-orange-600 hover:bg-orange-50"}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="border-orange-300 text-orange-600 hover:bg-orange-50">
          Previous
        </Button>
        <span className="text-gray-600">Page {currentPage} of {Math.ceil(totalCount / itemsPerPage) || 1}</span>
        <Button variant="outline" onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || isLoading} className="border-orange-300 text-orange-600 hover:bg-orange-50">
          Next
        </Button>
      </div>

      {/* Products Grid */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
              <span className="text-gray-700">Searching...</span>
            </div>
          </div>
        )}
        
        {error && <div className="text-red-500 text-center p-8 bg-red-50 rounded-lg">Error: {error}</div>}

        {!isLoading && !error && products.length === 0 ? (
          <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-16 text-center">
              <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">No products found</h3>
              <p className="text-gray-500 text-lg">Try adjusting your search or filters to discover more treasures.</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"}`}>
            {products.map((product) => (
              <Card key={product.id} className="group border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className={`${viewMode === "grid" ? "" : "flex"}`}>
                  <div className={`relative overflow-hidden ${viewMode === "grid" ? "aspect-[4/3]" : "w-48 h-48 flex-shrink-0"}`}>
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={handleImageError} />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.featured && <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg text-xs"><Sparkles className="w-3 h-3 mr-1" />Featured</Badge>}
                      {product.trending && <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg text-xs"><TrendingUp className="w-3 h-3 mr-1" />Trending</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-lg rounded-full p-1.5">
                      <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                    </Button>
                    {product.originalPrice > product.price && <Badge className="absolute bottom-2 right-2 bg-red-500 text-white shadow-lg text-xs">{Math.round((1 - product.price / product.originalPrice) * 100)}% OFF</Badge>}
                  </div>
                  <CardContent className={`${viewMode === "grid" ? "p-4" : "p-6 flex-1"}`}>
                    <div className="space-y-3 flex flex-col h-full">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-800 text-base line-clamp-2 group-hover:text-orange-600 transition-colors mb-1">{product.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs pt-2">
                        <MapPin className="w-3 h-3" />
                        <span className="font-medium truncate">{product.artisan.name}</span>
                        {product.artisan.verified && <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold">{product.artisan.rating}</span>
                          <span className="text-xs text-gray-500">({product.reviews})</span>
                        </div>
                        <Badge variant="outline" className="border-orange-200 text-orange-700 text-xs">{product.category}</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-orange-600">₹{product.price}</span>
                          {product.originalPrice > product.price && <span className="text-xs text-gray-500 line-through">₹{product.originalPrice}</span>}
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-1.5 text-xs font-semibold shadow" onClick={() => {
                          if (!profile) { window.location.href = "/buyer/login"; return; }
                          window.location.href = `/product/${product.id}`;
                        }}>
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
  );
}
// #endregion

// #region Marketplace Page Component
export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const [tempPriceRange, setTempPriceRange] = useState([0, 20000]);
  const [tempSelectedCraft, setTempSelectedCraft] = useState("all");
  const [tempSelectedState, setTempSelectedState] = useState("all");

  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 20000]);
  const [appliedSelectedCraft, setAppliedSelectedCraft] = useState("all");
  const [appliedSelectedState, setAppliedSelectedState] = useState("all");

  const { profile } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // These could be fetched from an API
  const crafts = useMemo(() => ["art", "pottery", "textiles", "woodwork", "metalwork", "jewelry"], []);
  const states = useMemo(() => ["Rajasthan", "Bihar", "Gujarat", "Kerala", "Uttar Pradesh", "West Bengal"], []);

  useEffect(() => {
    if (searchParams?.get("success") === "true") {
      router.replace("/marketplace/success");
    }
  }, [searchParams, router]);

  const handleApplyFilters = useCallback(() => {
    setAppliedPriceRange(tempPriceRange);
    setAppliedSelectedCraft(tempSelectedCraft);
    setAppliedSelectedState(tempSelectedState);
  }, [tempPriceRange, tempSelectedCraft, tempSelectedState]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setTempPriceRange([0, 20000]);
    setTempSelectedCraft("all");
    setTempSelectedState("all");
    setAppliedPriceRange([0, 20000]);
    setAppliedSelectedCraft("all");
    setAppliedSelectedState("all");
  }, []);

  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Discover <span className="bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">Authentic</span> Handmade Treasures
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Support local artisans and find unique handcrafted products from across India
            </p>
            <div className="max-w-3xl mx-auto relative mb-8">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Search handmade products, artisans, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 pr-20 py-6 text-lg border-2 border-orange-200 focus:border-orange-400 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200" onClick={() => handleQuickSearch("")}><Sparkles className="w-4 h-4 mr-2" />All</Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200" onClick={() => handleQuickSearch("madhubani")}><TrendingUp className="w-4 h-4 mr-2" />Madhubani</Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200" onClick={() => handleQuickSearch("art")}><Palette className="w-4 h-4 mr-2" />Art</Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200" onClick={() => handleQuickSearch("traditional")}>Traditional</Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 space-y-6">
            <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg"><Filter className="w-5 h-5 text-orange-600" />Filters</h3>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Price Range: ₹{tempPriceRange[0]} - ₹{tempPriceRange[1]}</label>
                    <Slider value={tempPriceRange} onValueChange={setTempPriceRange} max={20000} min={0} step={500} />
                    <div className="flex justify-between text-xs text-gray-500 mt-2"><span>₹0</span><span>₹20,000</span></div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                    <Select value={tempSelectedCraft} onValueChange={setTempSelectedCraft}>
                      <SelectTrigger className="border-orange-200 focus:border-orange-400"><SelectValue placeholder="All categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {crafts.map((craft) => <SelectItem key={craft} value={craft}>{craft.charAt(0).toUpperCase() + craft.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>
                    <Select value={tempSelectedState} onValueChange={setTempSelectedState}>
                      <SelectTrigger className="border-orange-200 focus:border-orange-400"><SelectValue placeholder="All locations" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {states.map((state) => <SelectItem key={state} value={state}>{state.charAt(0).toUpperCase() + state.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 pt-2">
                    <Button onClick={handleApplyFilters} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Apply Filters</Button>
                    <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 bg-transparent" onClick={handleClearFilters}>Clear All Filters</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <ProductGrid
            searchQuery={debouncedSearchQuery}
            priceRange={appliedPriceRange}
            selectedCraft={appliedSelectedCraft}
            selectedState={appliedSelectedState}
            profile={profile}
          />
        </div>
      </div>
    </div>
  );
}
// #endregion
