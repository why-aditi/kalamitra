"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductImage } from "@/components/product-image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, Loader2, MapPin, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/components/providers/auth-provider"
import { api } from "@/lib/api-client"

interface Review {
  id?: string
  name?: string
  userName?: string
  rating: number
  comment: string
  date?: string
  verified?: boolean
}

interface Artisan {
  name?: string
  location?: string
  region?: string
  craft?: string
  experience?: string
  bio?: string
  avatar?: string
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  artisan: Artisan
  category?: string
  tags: string[]
  inStock: boolean
  stockCount: number
  features: string[]
  specifications: Record<string, string>
  story?: string
  reviews: Review[]
}

interface ShippingForm {
  name: string
  phone_number: string
  address: string
}

const EMPTY_FORM: ShippingForm = { name: "", phone_number: "", address: "" }

function normalise(raw: any, id: string): Product {
  // `price` is canonical — it is what the server filters on and what Stripe
  // charges. `suggested_price` is a legacy display string and is ignored.
  const price = typeof raw?.price === "number" && Number.isFinite(raw.price) ? Math.round(raw.price) : 0

  return {
    id,
    title: raw?.title || "Untitled",
    description: raw?.description || "",
    price,
    images: Array.isArray(raw?.images) ? raw.images : [],
    artisan: raw?.artisan ?? {},
    category: raw?.category,
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    inStock: raw?.status ? raw.status === "active" : raw?.inStock !== false,
    stockCount: typeof raw?.stockCount === "number" ? raw.stockCount : 10,
    features: Array.isArray(raw?.features) ? raw.features : [],
    specifications:
      raw?.specifications && typeof raw.specifications === "object" ? raw.specifications : {},
    story: raw?.story,
    reviews: Array.isArray(raw?.reviews) ? raw.reviews : [],
  }
}

export default function ProductDetail() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuthContext()

  const productId = typeof params?.id === "string" ? params.id : ""

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const [orderOpen, setOrderOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [form, setForm] = useState<ShippingForm>(EMPTY_FORM)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const response = await api.get<{ listing: any }>(`/api/listings/${productId}`, {
          requiresAuth: false,
        })
        if (cancelled) return
        const listing = response?.listing
        setProduct(listing ? normalise(listing, String(listing.id || listing._id || productId)) : null)
      } catch (error) {
        if (cancelled) return
        console.error("Failed to load product:", error)
        setProduct(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [productId])

  const setField = useCallback((field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const changeQuantity = useCallback(
    (next: number) => {
      if (!product) return
      setQuantity(Math.max(1, Math.min(product.stockCount, next)))
    },
    [product],
  )

  const requireSignIn = useCallback(() => {
    toast({
      title: "Sign in to continue",
      description: "You need an account to place an order.",
      variant: "destructive",
    })
    router.push("/buyer/login")
  }, [router, toast])

  const handleCheckout = async () => {
    if (!user) return requireSignIn()
    if (!product) return

    if (!form.name.trim() || !form.phone_number.trim() || !form.address.trim()) {
      toast({
        title: "Fill in the delivery details",
        description: "Name, phone number and address are all required.",
        variant: "destructive",
      })
      return
    }
    if (!/^[0-9]{10}$/.test(form.phone_number.trim())) {
      toast({
        title: "Check the phone number",
        description: "Enter a 10-digit Indian mobile number, digits only.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      /*
        Contract: the server prices the order from its own listings collection.
        The client sends what is being bought and where it goes, never an amount.
        Buyer details are flat top-level fields, not a nested `buyer` object.
      */
      const { url } = await api.post<{ url?: string; order_id?: string; total_amount?: number }>(
        "/api/create-checkout-session",
        {
          items: [{ listing_id: product.id, quantity }],
          shipping_address: form.address.trim(),
          buyer_name: form.name.trim(),
          phone_number: form.phone_number.trim(),
        },
      )

      if (!url) throw new Error("The payment provider did not return a checkout link.")
      setOrderOpen(false)
      window.location.href = url
    } catch (error) {
      console.error("Checkout failed:", error)
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) return requireSignIn()
    if (!product) return

    if (reviewRating === 0) {
      toast({ title: "Pick a rating", description: "Choose one to five stars.", variant: "destructive" })
      return
    }
    if (!reviewComment.trim()) {
      toast({ title: "Add a comment", description: "Tell other buyers what the piece is like.", variant: "destructive" })
      return
    }

    setIsSubmittingReview(true)
    try {
      // Contract: the server reads the author from the token and decides
      // `verified` from order history. The client sends neither.
      const created = await api.post<Review>(`/api/listings/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      })

      setProduct((prev) => (prev ? { ...prev, reviews: [...prev.reviews, created] } : prev))
      setReviewRating(0)
      setReviewComment("")
      setReviewOpen(false)
      toast({ title: "Review published", description: "Thanks for writing it." })
    } catch (error) {
      console.error("Review submission failed:", error)
      toast({
        title: "Review not published",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (loading) return <ProductSkeleton />

  if (!product) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-32 text-center">
        <h1 className="display-lg">This piece is gone</h1>
        <p className="lede mt-4">It may have sold, or the link may be wrong.</p>
        <Button asChild className="mt-8">
          <Link href="/marketplace">Back to the market</Link>
        </Button>
      </div>
    )
  }

  const reviews = product.reviews
  const averageRating =
    reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : null
  const total = product.price * quantity
  const place = [product.artisan.region, product.artisan.location].filter(Boolean).join(", ")

  return (
    <div className="container mx-auto px-4 py-10 lg:py-16">
      <nav aria-label="Breadcrumb" className="eyebrow">
        <Link href="/marketplace" className="hover:text-madder">
          Market
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span>{product.category || product.artisan.craft || "Piece"}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* ------------------------------------------------------- images */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
            <ProductImage
              src={product.images[selectedImage]}
              alt={product.title}
              sizes="(min-width: 1024px) 40rem, 92vw"
              priority
            />
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={image || index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={selectedImage === index}
                  className={`relative aspect-square overflow-hidden rounded-md border-2 transition-colors ${
                    selectedImage === index ? "border-madder" : "border-border hover:border-madder/50"
                  }`}
                >
                  <ProductImage src={image} alt="" sizes="8rem" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------------------------------------- detail */}
        <div>
          <p className="eyebrow">{product.artisan.craft || product.category}</p>
          <h1 className="display-lg mt-4 text-balance">{product.title}</h1>

          {(product.artisan.name || place) && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Made by {product.artisan.name || "an independent maker"}
                {place && ` in ${place}`}
              </span>
            </p>
          )}

          <p className="numeric mt-8 text-4xl font-bold">₹{product.price.toLocaleString("en-IN")}</p>

          {averageRating !== null && (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <Stars value={averageRating} />
              <span className="numeric font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </p>
          )}

          {product.description && (
            <p className="mt-8 leading-relaxed text-muted-foreground text-pretty">{product.description}</p>
          )}

          {product.features.length > 0 && (
            <ul className="mt-8 space-y-2.5">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-neem" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}

          {/* ------------------------------------------------------- buying */}
          <div className="mt-10 border-t border-border pt-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Label htmlFor="quantity" className="text-sm font-semibold">
                  Quantity
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeQuantity(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    inputMode="numeric"
                    value={quantity}
                    min={1}
                    max={product.stockCount}
                    onChange={(e) => changeQuantity(Number.parseInt(e.target.value, 10) || 1)}
                    className="numeric w-16 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => changeQuantity(quantity + 1)}
                    disabled={quantity >= product.stockCount}
                    aria-label="Increase quantity"
                  >
                    +
                  </Button>
                </div>
              </div>
              <p className="numeric text-sm text-muted-foreground">{product.stockCount} available</p>
            </div>

            <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="mt-6 w-full bg-madder text-madder-foreground hover:bg-madder/90"
                  disabled={!product.inStock}
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault()
                      requireSignIn()
                    }
                  }}
                >
                  {product.inStock ? `Buy — ₹${total.toLocaleString("en-IN")}` : "Sold out"}
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="display-sm">Where should it go?</DialogTitle>
                  <DialogDescription>
                    You will pay on the next screen. Nothing is charged yet.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="rounded-md bg-secondary p-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium">{product.title}</span>
                      <span className="numeric font-bold">₹{total.toLocaleString("en-IN")}</span>
                    </div>
                    <p className="numeric mt-1 text-sm text-muted-foreground">Quantity {quantity}</p>
                  </div>

                  <div>
                    <Label htmlFor="order-name">Full name</Label>
                    <Input
                      id="order-name"
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      autoComplete="name"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order-phone">Phone number</Label>
                    <Input
                      id="order-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.phone_number}
                      onChange={(e) => setField("phone_number", e.target.value)}
                      autoComplete="tel-national"
                      placeholder="10 digits"
                      className="numeric mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order-address">Delivery address</Label>
                    <Textarea
                      id="order-address"
                      rows={3}
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      autoComplete="street-address"
                      placeholder="Street, city, state and PIN code"
                      className="mt-1.5"
                    />
                  </div>

                  <Button onClick={handleCheckout} disabled={isProcessing} className="w-full">
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Opening payment
                      </>
                    ) : (
                      "Continue to payment"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- the maker */}
      {(product.artisan.bio || product.story) && (
        <section className="mt-24 max-w-3xl">
          <div className="ajrakh-rule" aria-hidden="true" />
          <h2 className="display-md mt-8">
            {product.artisan.name ? `About ${product.artisan.name}` : "About the maker"}
          </h2>
          {product.artisan.bio && (
            <p className="mt-4 leading-relaxed text-muted-foreground text-pretty">{product.artisan.bio}</p>
          )}
          {product.story && (
            <blockquote className="rule-madder mt-8 py-2 pl-5">
              <p className="display-sm font-normal italic text-pretty">{product.story}</p>
            </blockquote>
          )}
        </section>
      )}

      {/* ----------------------------------------------------- specifications */}
      {Object.keys(product.specifications).length > 0 && (
        <section className="mt-20 max-w-3xl">
          <h2 className="display-md">Details</h2>
          <dl className="mt-6 divide-y divide-border border-y border-border">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-6 py-3 text-sm">
                <dt className="text-muted-foreground">{key}</dt>
                <dd className="text-right font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ------------------------------------------------------------ reviews */}
      <section className="mt-20 max-w-3xl">
        <h2 className="display-md">
          {reviews.length > 0 ? `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` : "Reviews"}
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No one has written about this piece yet.</p>
        ) : (
          <ul className="mt-8 space-y-8">
            {reviews.map((review, index) => (
              <li key={review.id || index} className="border-b border-border pb-8 last:border-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{review.name || review.userName || "Buyer"}</span>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 rounded-sm bg-neem-soft px-2 py-0.5 text-xs font-semibold text-neem">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Bought this
                    </span>
                  )}
                  {review.date && <span className="text-xs text-muted-foreground">{review.date}</span>}
                </div>
                <div className="mt-2">
                  <Stars value={review.rating} />
                </div>
                <p className="mt-3 leading-relaxed text-muted-foreground">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}

        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="mt-8">
              Write a review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="display-sm">Write a review</DialogTitle>
              <DialogDescription>Say what arrived and how it felt in your hands.</DialogDescription>
            </DialogHeader>

            <fieldset>
              <legend className="text-sm font-semibold">Your rating</legend>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                    aria-pressed={reviewRating === value}
                    className="rounded-sm p-0.5"
                  >
                    <Star
                      className={`h-7 w-7 transition-colors ${
                        value <= reviewRating ? "fill-haldi text-haldi" : "text-border"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <Label htmlFor="review-comment">Your review</Label>
              <Textarea
                id="review-comment"
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <Button
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || reviewRating === 0 || !reviewComment.trim()}
              className="w-full"
            >
              {isSubmittingReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Publishing
                </>
              ) : (
                "Publish review"
              )}
            </Button>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`h-4 w-4 ${i <= Math.round(value) ? "fill-haldi text-haldi" : "text-border"}`}
        />
      ))}
    </span>
  )
}

function ProductSkeleton() {
  return (
    <div className="container mx-auto px-4 py-10 lg:py-16" aria-busy="true">
      <Skeleton className="h-3 w-32" />
      <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-lg" />
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-4 h-10 w-4/5" />
          <Skeleton className="mt-4 h-4 w-1/2" />
          <Skeleton className="mt-8 h-10 w-40" />
          <Skeleton className="mt-8 h-20 w-full" />
          <Skeleton className="mt-10 h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
