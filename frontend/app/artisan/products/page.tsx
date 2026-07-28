"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Package, Eye, Edit } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge" // Ensure Badge is imported
import { ProductImage } from "@/components/product-image"

interface Listing {
  id: string // Changed from _id to id to match Pydantic model alias
  title: string
  description: string
  suggestedPrice: string
  category: string
  images: string[] // This will now contain full URLs from the backend
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function ArtisanProducts() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch(`${BASE_URL}/api/artist/listings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.detail || res.statusText || "Failed to fetch listings")
        }
        const data = await res.json()
        setListings(data.listings || []) // Access the 'listings' array from the response
      } catch (err) {
        console.error("Error fetching listings:", err)
        setListings([])
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Products</h1>
          <Button
            asChild
            className="bg-madder"
          >
            <Link href="/artisan/create-listing">
              <Plus className="w-4 h-4 mr-2" /> Add New Product
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : listings.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-6">Create your first product listing to start selling</p>
              <Button
                asChild
                className="bg-madder"
              >
                <Link href="/artisan/create-listing">
                  <Plus className="w-4 h-4 mr-2" /> Create Your First Listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing, index) => {
              const imageUrl = listing.images?.[0] || "/placeholder.svg" // Use the 'images' array directly

              return (
                <Card key={listing.id || `listing-${index}`} className="hover:shadow-lg">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    <ProductImage src={imageUrl || "/placeholder.svg"} alt={listing.title} sizes="(min-width: 768px) 20rem, 92vw" />
                    <Badge className="absolute top-2 right-2 bg-neem">Published</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{listing.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{listing.description}</p>
                    <div className="flex justify-between mb-4">
                      <span className="text-lg font-bold text-madder">{listing.suggestedPrice}</span>
                      <Badge variant="outline">{listing.category}</Badge> {/* Using Badge for consistency */}
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
