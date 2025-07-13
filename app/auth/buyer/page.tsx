"use client" // Mark as client component

import { useContext } from "react"
import { auth } from "@/lib/firebase"
import { AuthContext } from "../AuthContext"
import { useRouter } from "next/navigation"
import Marketplace from "@/app/marketplace/page" // Adjust path
import ProtectedRoute from "../ProtectedRoute" // Verified import

const BuyerDashboard = () => {
  const { name } = useContext(AuthContext)
  const router = useRouter()

  // Current date and time (02:07 PM IST, Sunday, July 13, 2025)
  const currentDate = new Date("2025-07-13T14:07:00+05:30")
  const formattedDate = currentDate.toLocaleString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })

  const handleViewCart = () => {
    router.push("/auth/buyer/cart") // Create /auth/buyer/cart if needed
  }

  const handleViewOrders = () => {
    router.push("/auth/buyer/orders") // Adjust to your orders route
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
      <p>Welcome, {name || "Buyer"}!</p>
      <p className="text-gray-600">Last updated: {formattedDate}</p>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Browse Products</h2>
        <p>Explore artisan products and add to your cart.</p>
        {/* Ensure Marketplace component is correctly exported from '@/app/marketplace/page' */}
        <Marketplace />
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Cart</h2>
        <p>View and manage your cart.</p>
        <button onClick={handleViewCart} className="mt-2 bg-blue-500 text-white p-2 rounded">
          View Cart
        </button>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-semibold">Order History</h2>
        <p>View your past purchases.</p>
        <button onClick={handleViewOrders} className="mt-2 bg-yellow-500 text-white p-2 rounded">
          View Orders
        </button>
      </div>
      <button onClick={() => auth.signOut()} className="mt-4 bg-red-500 text-white p-2 rounded">
        Logout
      </button>
    </div>
  )
}

export default function BuyerPage() {
  return (
    <ProtectedRoute role="buyer">
      <BuyerDashboard />
    </ProtectedRoute>
  )
}
