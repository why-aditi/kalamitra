"use client"

import { useState, useEffect } from "react"
import MarketplaceUI from "./MarketplaceUI" // Correct relative import

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 2000])
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])

  useEffect(() => {
    const mockProducts = [
      {
        id: 1,
        title: "Handcrafted Rajasthani Clay Diya Set",
        description: "Exquisite handmade clay diyas crafted using traditional Rajasthani techniques.",
        price: 299,
        originalPrice: 399,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Kamala Devi",
          location: "Jaipur, Rajasthan",
          rating: 4.8,
          craft: "pottery",
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
        description: "Luxurious hand-woven Pashmina shawl with intricate embroidery.",
        price: 2499,
        originalPrice: 3200,
        image: "/placeholder.svg?height=400&width=400",
        artisan: {
          name: "Abdul Rahman",
          location: "Srinagar, Kashmir",
          rating: 4.9,
          craft: "textiles",
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
    ]

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
          craft: listing.artisan?.craft || "handmade",
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

  useEffect(() => {
    let filtered = [...products]

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          product.artisan.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    filtered = filtered.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1])

    if (selectedCrafts.length > 0) {
      filtered = filtered.filter((product) => selectedCrafts.includes(product.artisan.craft.toLowerCase()))
    }

    if (selectedStates.length > 0) {
      filtered = filtered.filter((product) =>
        selectedStates.some((state) => product.artisan.location.toLowerCase().includes(state.toLowerCase())),
      )
    }

    setFilteredProducts(filtered)
  }, [products, searchQuery, priceRange, selectedCrafts, selectedStates])

  return (
    <MarketplaceUI
      products={filteredProducts}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      priceRange={priceRange}
      setPriceRange={setPriceRange}
      selectedCrafts={selectedCrafts}
      setSelectedCrafts={setSelectedCrafts}
      selectedStates={selectedStates}
      setSelectedStates={setSelectedStates}
      viewMode={viewMode}
      setViewMode={setViewMode}
    />
  )
}

