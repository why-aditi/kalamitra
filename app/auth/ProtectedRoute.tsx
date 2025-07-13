"use client" // Mark as client component

import type React from "react"
import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthContext } from "./AuthContext"

export default function ProtectedRoute({
  role,
  children,
}: {
  role: string
  children: React.ReactNode
}) {
  const { user, role: userRole, loading } = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth")
      } else if (userRole === null || userRole === undefined || userRole !== role) {
        // Handle case where userRole is not yet loaded or doesn't match
        router.push(userRole === "artisan" || userRole === null ? "/auth/artisan" : "/auth/buyer")
      }
    }
  }, [user, userRole, loading, router, role])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!user || userRole !== role) return null
  return <>{children}</>
}
