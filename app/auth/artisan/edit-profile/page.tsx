"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuth, onAuthStateChanged } from "firebase/auth" // Using getAuth directly here
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditProfilePage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    craft: "",
    region: "",
    state: "",
  })
  const [loading, setLoading] = useState(true)

  // 🔐 Auth check & token fetch
  useEffect(() => {
    const authInstance = getAuth() // Renamed to avoid conflict with imported 'auth' if any
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (!user) {
        router.replace("/login")
      } else {
        const token = await user.getIdToken()
        setToken(token)

        // 👇 Fetch profile data from your backend (MongoDB)
        const res = await fetch("/api/artisan/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          setFormData({
            name: data.name || "",
            craft: data.craft || "",
            region: data.region || "",
            state: data.state || "",
          })
        }

        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    const res = await fetch("/api/artisan/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      router.push("/artisan/dashboard")
    } else {
      alert("Failed to update profile")
    }
  }

  if (loading) return <p className="p-4">Loading...</p>

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <Label>Craft</Label>
              <Input name="craft" value={formData.craft} onChange={handleChange} />
            </div>
            <div>
              <Label>Region</Label>
              <Input name="region" value={formData.region} onChange={handleChange} />
            </div>
            <div>
              <Label>State</Label>
              <Input name="state" value={formData.state} onChange={handleChange} />
            </div>
            <Button type="submit" className="w-full">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
