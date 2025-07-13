"use client"

import type React from "react"
import type { Dispatch, SetStateAction } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Heart, MapPin, Star, Sparkles, TrendingUp, Grid, List } from "lucide-react"
import Link from "next/link"

export interface MarketplaceUIProps {
  products: any[]
  searchQuery: string
  setSearchQuery: Dispatch<SetStateAction<string>>
  priceRange: number[]
  setPriceRange: Dispatch<SetStateAction<number[]>>
  selectedCrafts: string[]
  setSelectedCrafts: Dispatch<SetStateAction<string[]>>
  selectedStates: string[]
  setSelectedStates: Dispatch<SetStateAction<string[]>>
  viewMode: "grid" | "list"
  setViewMode: Dispatch<SetStateAction<"grid" | "list">>
}

const MarketplaceUI: React.FC<MarketplaceUIProps> = ({
  products,
  searchQuery,
  setSearchQuery,
  priceRange,
  setPriceRange,
  selectedCrafts,
  setSelectedCrafts,
  selectedStates,
  setSelectedStates,
  viewMode,
  setViewMode,
}) => {
  return (
    <>
      {/* Filter Sidebar */}
      <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>

        {/* Search Input */}
        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
          </label>
          <div className="flex gap-4">
            <input
              type="range"
              min="0"
              max="5000"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
              className="flex-1"
            />
            <input
              type="range"
              min="0"
              max="5000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
              className="flex-1"
            />
          </div>
        </div>

        {/* Craft Types */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Craft Types</label>
          <div className="flex flex-wrap gap-2">
            {["pottery", "textiles", "woodwork", "jewelry", "painting"].map((craft) => (
              <button
                key={craft}
                onClick={() => {
                  if (selectedCrafts.includes(craft)) {
                    setSelectedCrafts(selectedCrafts.filter((c) => c !== craft))
                  } else {
                    setSelectedCrafts([...selectedCrafts, craft])
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedCrafts.includes(craft)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                }`}
              >
                {craft.charAt(0).toUpperCase() + craft.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">States</label>
          <div className="flex flex-wrap gap-2">
            {["rajasthan", "kashmir", "kerala", "gujarat", "punjab"].map((state) => (
              <button
                key={state}
                onClick={() => {
                  if (selectedStates.includes(state)) {
                    setSelectedStates(selectedStates.filter((s) => s !== state))
                  } else {
                    setSelectedStates([...selectedStates, state])
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedStates.includes(state)
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                }`}
              >
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {searchQuery ? `Results for "${searchQuery}"` : "All Products"}
          </h2>
          <p className="text-gray-600 mt-1">{products.length} handcrafted treasures found</p>
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
      {products.length === 0 ? (
        <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-16 text-center">
            <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-3">No products found</h3>
            <p className="text-gray-500 text-lg">Try adjusting your search or filters to discover more treasures</p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid gap-8 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
        >
          {products.map((product) => (
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
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>

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
    </>
  )
}

export default MarketplaceUI
