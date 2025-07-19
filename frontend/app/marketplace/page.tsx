"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Sparkles, TrendingUp } from "lucide-react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { ProductGrid } from "@/components/ui/ProductGrid"; // Import the new component

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Temporary filter states for the UI
  const [tempPriceRange, setTempPriceRange] = useState([0, 20000]);
  const [tempSelectedCraft, setTempSelectedCraft] = useState("all");
  const [tempSelectedState, setTempSelectedState] = useState("all");

  // Applied filter states passed to the ProductGrid
  const [appliedPriceRange, setAppliedPriceRange] = useState([0, 20000]);
  const [appliedSelectedCraft, setAppliedSelectedCraft] = useState("all");
  const [appliedSelectedState, setAppliedSelectedState] = useState("all");

  const { profile } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dummy data for filter dropdowns. In a real app, you might fetch these.
  const crafts = useMemo(() => ["art", "pottery", "textiles", "woodwork"], []);
  const states = useMemo(() => ["Rajasthan", "Bihar", "Gujarat", "Kerala"], []);

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
        {/* Hero Search Section */}
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
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200" onClick={() => handleQuickSearch("")}>
                <Sparkles className="w-4 h-4 mr-2" /> All
              </Badge>
              <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-orange-50 border-orange-200" onClick={() => handleQuickSearch("madhubani")}>
                <TrendingUp className="w-4 h-4 mr-2" /> Madhubani
              </Badge>
              {/* ... other quick search badges */}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 space-y-6">
            <Card className="border-2 border-orange-200 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg">
                  <Filter className="w-5 h-5 text-orange-600" /> Filters
                </h3>
                <div className="space-y-6">
                  {/* Price Range Slider */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">
                      Price Range: ₹{tempPriceRange[0]} - ₹{tempPriceRange[1]}
                    </label>
                    <Slider value={tempPriceRange} onValueChange={setTempPriceRange} max={20000} min={0} step={500} />
                  </div>
                  {/* Category Select */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Category</label>
                    <Select value={tempSelectedCraft} onValueChange={setTempSelectedCraft}>
                      <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {crafts.map((craft) => (
                          <SelectItem key={craft} value={craft}>{craft.charAt(0).toUpperCase() + craft.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Location Select */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-3 block">Location</label>
                    <Select value={tempSelectedState} onValueChange={setTempSelectedState}>
                      <SelectTrigger><SelectValue placeholder="All locations" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>{state.charAt(0).toUpperCase() + state.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Filter Buttons */}
                  <div className="space-y-3">
                    <Button onClick={handleApplyFilters} className="w-full bg-orange-500 hover:bg-orange-600 text-white">Apply Filters</Button>
                    <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50" onClick={handleClearFilters}>Clear All Filters</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Grid Component */}
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
