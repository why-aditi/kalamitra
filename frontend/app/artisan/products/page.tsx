"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Eye, Edit } from "lucide-react";
import Link from "next/link";

interface Listing {
  _id: string;
  title: string;
  description: string;
  suggestedPrice: string;
  category: string;
  images?: string[];
}

export default function ArtisanProducts() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the artisan's listings from the backend
    const fetchListings = async () => {
      try {
        const res = await fetch("/api/artist/listings");
        if (!res.ok) throw new Error("Failed to fetch listings");
        const data = await res.json();
        setListings(data.listings || data || []);
      } catch (err) {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
          <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
            <Link href="/artisan/create-listing">
              <Plus className="w-4 h-4 mr-2" /> Add New Product
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading...</div>
        ) : listings.length === 0 ? (
          <Card className="border-orange-200">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-6">Create your first product listing to start selling</p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                <Link href="/artisan/create-listing">
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing._id} className="border-orange-200 hover:shadow-lg transition-shadow">
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {listing.images && listing.images[0] ? (
                    <img
                      src={listing.images[0] || "/placeholder.svg"}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-orange-600">{listing.suggestedPrice}</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{listing.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
