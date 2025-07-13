"use client"
import { useContext } from "react"
import { auth } from "@/lib/firebase"
import { AuthContext } from "../AuthContext" // Adjust path if needed
import { useRouter } from "next/navigation"
import ProtectedRoute from "../ProtectedRoute" // Adjust path if needed

const ArtisanDashboard = () => {
  const { name } = useContext(AuthContext)
  const router = useRouter()

  const handleEditProfile = () => {
    router.push("/auth/artisan/edit-profile") // Navigate to the existing edit profile page
  }

  const handleManageListings = () => {
    // router.push('/auth/artisan/listings'); // Create this route if needed
    alert("Manage Listings functionality coming soon!")
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold">Artisan Dashboard</h1>
      <p>Welcome, {name || "Artisan"}!</p>
      <p className="text-gray-600">This is your artisan control panel.</p>

      <div className="mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Profile Management</h2>
          <p>Update your personal and craft details.</p>
          <button onClick={handleEditProfile} className="mt-2 bg-blue-500 text-white p-2 rounded">
            Edit Profile
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold">Product Listings</h2>
          <p>Add, edit, or remove your handcrafted products.</p>
          <button onClick={handleManageListings} className="mt-2 bg-green-500 text-white p-2 rounded">
            Manage Listings
          </button>
        </div>

        <button onClick={() => auth.signOut()} className="mt-4 bg-red-500 text-white p-2 rounded">
          Logout
        </button>
      </div>
    </div>
  )
}

export default function ArtisanPage() {
  return (
    <ProtectedRoute role="artisan">
      <ArtisanDashboard />
    </ProtectedRoute>
  )
}
