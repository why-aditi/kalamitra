"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import { auth } from "@/lib/firebase" // Ensure this path and export are correct
import { onAuthStateChanged, type User } from "firebase/auth" // Use type import for User

interface AuthContextType {
  user: User | null
  role: string | null
  name: string | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  name: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // IMPORTANT: Check if 'auth' is defined before proceeding
    if (!auth) {
      console.error("Firebase 'auth' object is undefined. Check your '@/lib/firebase' setup.")
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUser(null)
        setRole(null)
        setName(null)
        setLoading(false)
        return
      }
      setUser(user)
      const token = await user.getIdToken()
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (res.ok) {
          const data = await res.json()
          setRole(data.role || null)
          setName(data.name || null)
        } else {
          console.warn("Backend returned error for /me:", res.status, res.statusText)
          setRole(null)
          setName(null)
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setRole(null)
        setName(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, []) // Dependency array is empty, runs once on mount

  return <AuthContext.Provider value={{ user, role, name, loading }}>{children}</AuthContext.Provider>
}
