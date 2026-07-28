"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/product-image";
import { Search, MapPin, Mic, SlidersHorizontal, Star } from "lucide-react";
import { API_BASE_URL, buildQuery, isAbortError } from "@/lib/api-client";
import { processVoiceTranscription } from "@/lib/voice-utils";

const PAGE_SIZE = 12;
const MAX_PRICE = 20000;

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  artisanName: string;
  region: string;
  craft: string;
  inStock: boolean;
  /** Null until the piece has been reviewed — there is no invented default. */
  rating: number | null;
  reviewCount: number;
};

/**
 * Contract: GET /api/listings embeds the artisan on every listing, and the
 * response is projected — `description` arrives truncated, and `story`,
 * `transcription` and `reviews` are not sent at all. Nothing in the grid reads
 * those; the full document is on GET /api/listings/{id}.
 */
type ListingFromApi = {
  _id: string;
  title?: string;
  description?: string;
  /** Canonical. `suggested_price` is a legacy display string and is not used. */
  price?: number;
  image_ids?: string[];
  artist_id?: string;
  status?: string;
  category?: string;
  tags?: string[];
  rating?: number | null;
  review_count?: number;
  artisan?: {
    id?: string;
    name?: string;
    craft?: string;
    region?: string;
    location?: string;
  };
};

/**
 * Everything the listings request depends on, in one piece of state.
 *
 * It used to be six separate states plus an effect that reset the page number,
 * which meant every filter change fired two full rounds of requests: one for the
 * new filters and one for the page reset. Updating them together is a single
 * render and a single request.
 */
type Query = {
  page: number;
  search: string;
  minPrice: number;
  maxPrice: number;
  category: string;
  region: string;
};

const INITIAL_QUERY: Query = {
  page: 1,
  search: "",
  minPrice: 0,
  maxPrice: MAX_PRICE,
  category: "all",
  region: "all",
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function toPrice(raw: number | undefined): number {
  return typeof raw === "number" && Number.isFinite(raw) ? Math.round(raw) : 0;
}

/**
 * Reading search params opts a route out of prerendering unless it sits behind a
 * Suspense boundary. Isolating the one thing that needs them — the post-Stripe
 * `?success=true` bounce — lets the whole rest of the page ship as static HTML
 * instead of an empty skeleton.
 */
function CheckoutSuccessRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("success") === "true") {
      router.replace("/marketplace/success");
    }
  }, [searchParams, router]);

  return null;
}

export default function Marketplace() {
  const [query, setQuery] = useState<Query>(INITIAL_QUERY);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  // Draft filter values — only pushed into `query` when Apply is pressed.
  const [draftPrice, setDraftPrice] = useState<number[]>([0, MAX_PRICE]);
  const [draftCategory, setDraftCategory] = useState("all");
  const [draftRegion, setDraftRegion] = useState("all");

  const [isListening, setIsListening] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // A new search term always means page 1 — set both in one update.
  useEffect(() => {
    setQuery((q) => (q.search === debouncedSearch ? q : { ...q, search: debouncedSearch, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    // Supersede any request still in flight for older filters.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      setIsLoading(true);
      try {
        const qs = buildQuery({
          skip: (query.page - 1) * PAGE_SIZE,
          // The API caps `limit` at 100 and 422s above it.
          limit: PAGE_SIZE,
          search: query.search,
          // Price bounds are unbounded server-side by default, so send a bound
          // only when the buyer has actually moved that end of the slider.
          min_price: query.minPrice > 0 ? query.minPrice : undefined,
          max_price: query.maxPrice < MAX_PRICE ? query.maxPrice : undefined,
          category: query.category,
          state: query.region,
        });

        const res = await fetch(`${API_BASE_URL}/api/listings${qs}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Could not load listings (${res.status})`);

        const data = await res.json();
        if (!Array.isArray(data?.listings)) throw new Error("Unexpected response from the listings service");

        // One request, not 1 + 12: the artisan now arrives embedded on each listing.
        setProducts(
          (data.listings as ListingFromApi[]).map((item) => ({
            id: item._id,
            title: item.title || "Untitled",
            description: item.description || "",
            price: toPrice(item.price),
            image: item.image_ids?.[0]
              ? `${API_BASE_URL}/api/listings/${item._id}/images/${item.image_ids[0]}`
              : undefined,
            artisanName: item.artisan?.name || "Independent maker",
            region: item.artisan?.region || item.artisan?.location || "",
            craft: item.artisan?.craft || item.category || "Craft",
            inStock: item.status === "active",
            // Real values now. Nothing here is invented: an unreviewed piece
            // shows no rating rather than a placeholder one.
            rating: typeof item.rating === "number" ? item.rating : null,
            reviewCount: typeof item.review_count === "number" ? item.review_count : 0,
          })),
        );
        setTotalCount(typeof data.total === "number" ? data.total : 0);
        setError(null);
      } catch (err) {
        if (isAbortError(err)) return; // superseded, not a failure
        console.error("Failed to load listings:", err);
        // "Failed to fetch" is the browser talking, not the interface. Say what
        // happened and what to do about it.
        setError(
          err instanceof TypeError
            ? "Could not reach the market. Check your connection and try again."
            : err instanceof Error
              ? err.message
              : "Could not load listings.",
        );
        setProducts([]);
        setTotalCount(0);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [query]);

  /*
    Facet options are derived from the listings on screen, so they narrow as you
    page. A /api/listings/facets endpoint would fix that properly; noted in the
    handoff rather than faked here.
  */
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.craft).filter(Boolean))].sort(),
    [products],
  );
  const regions = useMemo(
    () => [...new Set(products.map((p) => p.region).filter(Boolean))].sort(),
    [products],
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const applyFilters = useCallback(() => {
    setQuery((q) => ({
      ...q,
      page: 1,
      minPrice: draftPrice[0],
      maxPrice: draftPrice[1],
      category: draftCategory,
      region: draftRegion,
    }));
  }, [draftPrice, draftCategory, draftRegion]);

  const clearFilters = useCallback(() => {
    setDraftPrice([0, MAX_PRICE]);
    setDraftCategory("all");
    setDraftRegion("all");
    setSearchInput("");
    setQuery(INITIAL_QUERY);
  }, []);

  const startVoiceSearch = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("This browser cannot listen. Type your search instead.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      try {
        const { english } = await processVoiceTranscription(transcript);
        setSearchInput(english);
      } catch {
        setSearchInput(transcript);
      } finally {
        setIsListening(false);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setError("Could not hear that. Try again, or type your search.");
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, []);

  return (
    <div className="min-h-screen">
      <Suspense fallback={null}>
        <CheckoutSuccessRedirect />
      </Suspense>

      {/* ------------------------------------------------------ search head */}
      <section className="border-b border-border bg-secondary/50">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <p className="eyebrow">The market</p>
          <h1 className="display-lg mt-4 max-w-2xl text-balance">
            Every piece here was made by one person, by hand
          </h1>

          <form
            onSubmit={(e) => e.preventDefault()}
            role="search"
            className="mt-8 flex max-w-2xl items-center gap-2"
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by craft, material or place"
                aria-label="Search listings"
                className="h-12 bg-background pl-11 text-base"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={startVoiceSearch}
              disabled={isListening}
              aria-label={isListening ? "Listening" : "Search by voice"}
              className="h-12 w-12 shrink-0 bg-background"
            >
              <Mic className={`h-5 w-5 ${isListening ? "animate-pulse text-madder" : ""}`} />
            </Button>
          </form>

          {isListening && (
            <p aria-live="polite" className="mt-3 text-sm text-madder">
              Listening. Say what you are looking for.
            </p>
          )}
        </div>
      </section>

      <div className="ajrakh-rule" aria-hidden="true" />

      <div className="container mx-auto px-4 py-10">
        {error && (
          <p
            role="alert"
            className="mb-8 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-10 lg:flex-row">
          {/* --------------------------------------------------- filter rail */}
          <aside className="lg:w-64 lg:shrink-0">
            <h2 className="eyebrow flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              Refine
            </h2>

            <div className="mt-6 space-y-7">
              <div>
                <Label className="text-sm font-semibold">Price</Label>
                <p className="numeric mt-1 text-sm text-muted-foreground">
                  ₹{draftPrice[0].toLocaleString("en-IN")} – ₹{draftPrice[1].toLocaleString("en-IN")}
                </p>
                <Slider
                  value={draftPrice}
                  onValueChange={setDraftPrice}
                  min={0}
                  max={MAX_PRICE}
                  step={500}
                  className="mt-4"
                  aria-label="Price range"
                />
              </div>

              <div>
                <Label htmlFor="filter-craft" className="text-sm font-semibold">
                  Craft
                </Label>
                <Select value={draftCategory} onValueChange={setDraftCategory}>
                  <SelectTrigger id="filter-craft" className="mt-2">
                    <SelectValue placeholder="Any craft" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any craft</SelectItem>
                    {categories.map((craft) => (
                      <SelectItem key={craft} value={craft}>
                        {craft}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-region" className="text-sm font-semibold">
                  Region
                </Label>
                <Select value={draftRegion} onValueChange={setDraftRegion}>
                  <SelectTrigger id="filter-region" className="mt-2">
                    <SelectValue placeholder="Anywhere in India" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Anywhere in India</SelectItem>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-1">
                <Button type="button" onClick={applyFilters} className="w-full">
                  Apply
                </Button>
                <Button type="button" variant="ghost" onClick={clearFilters} className="w-full">
                  Clear all
                </Button>
              </div>
            </div>
          </aside>

          {/* ------------------------------------------------------- results */}
          <div className="flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
              <h2 className="display-sm">
                {query.search ? `“${query.search}”` : "All listings"}
              </h2>
              <p className="numeric text-sm text-muted-foreground" aria-live="polite">
                {isLoading ? "Loading…" : `${totalCount} ${totalCount === 1 ? "piece" : "pieces"}`}
              </p>
            </div>

            {isLoading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="py-24 text-center">
                <h3 className="display-sm">Nothing matches that yet</h3>
                <p className="mt-2 text-muted-foreground">
                  Widen the price range or clear the filters to see everything.
                </p>
                <Button variant="outline" onClick={clearFilters} className="mt-6">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product, index) => (
                  <li key={product.id}>
                    <Link href={`/product/${product.id}`} className="group block">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-md border border-border bg-secondary">
                        <ProductImage
                          src={product.image}
                          alt={product.title}
                          sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 92vw"
                          /* Only the first row is above the fold. */
                          priority={index < 3}
                          className="transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        {!product.inStock && (
                          <span className="absolute left-3 top-3 rounded-sm bg-background/95 px-2 py-1 text-xs font-semibold">
                            Sold out
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <p className="eyebrow">{product.craft}</p>
                        <h3 className="display-sm mt-2 line-clamp-2 group-hover:text-madder">
                          {product.title}
                        </h3>
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {product.artisanName}
                            {product.region && `, ${product.region}`}
                          </span>
                        </p>
                        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <p className="numeric text-lg font-bold">
                            ₹{product.price.toLocaleString("en-IN")}
                          </p>
                          {product.rating !== null && (
                            <p className="numeric flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-haldi text-haldi" aria-hidden="true" />
                              {product.rating.toFixed(1)}
                              <span className="sr-only"> out of 5, </span>
                              <span>({product.reviewCount})</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-16 flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={() => setQuery((q) => ({ ...q, page: Math.max(1, q.page - 1) }))}
                  disabled={query.page === 1 || isLoading}
                >
                  Previous
                </Button>
                <p className="numeric text-sm text-muted-foreground">
                  Page {query.page} of {totalPages}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setQuery((q) => ({ ...q, page: Math.min(totalPages, q.page + 1) }))}
                  disabled={query.page >= totalPages || isLoading}
                >
                  Next
                </Button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <ul
      className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3"
      aria-hidden="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="aspect-[4/5] w-full rounded-md" />
          <Skeleton className="mt-4 h-3 w-16" />
          <Skeleton className="mt-3 h-5 w-4/5" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <Skeleton className="mt-4 h-6 w-24" />
        </li>
      ))}
    </ul>
  );
}
