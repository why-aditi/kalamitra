"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, MapPin, Star, Sparkles, TrendingUp, Grid, List } from "lucide-react";

// Define the types for props and state
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
  profile: any; // Adjust with your actual profile type
};

export function ProductGrid({ searchQuery, priceRange, selectedCraft, selectedState, profile }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  const itemsPerPage = 12;

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        min_price: priceRange[0].toString(),
        max_price: priceRange[1].toString(),
        category: selectedCraft,
        state: selectedState,
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
      setError(null);
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

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, selectedCraft, selectedState]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = "/placeholder.svg";
  };

  if (error) {
    return <div className="text-red-500 text-center p-8">Error: {error}</div>;
  }

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
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-300 text-orange-600 hover:bg-orange-50"}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-orange-500 hover:bg-orange-600" : "border-orange-300 text-orange-600 hover:bg-orange-50"}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Pagination */}
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
          Page {currentPage} of {Math.ceil(totalCount / itemsPerPage) || 1}
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
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-orange-500"></div>
              <span className="text-gray-700">Searching...</span>
            </div>
          </div>
        )}
        
        {!isLoading && products.length === 0 ? (
          <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-16 text-center">
              <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-3">No products found</h3>
              <p className="text-gray-500 text-lg">Try adjusting your search or filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4" : "grid-cols-1"}`}>
            {products.map((product) => (
              <Card key={product.id} className="group border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
                {/* Product Card Content (unchanged) */}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
