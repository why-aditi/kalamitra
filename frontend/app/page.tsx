'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Search, Heart, Users, Globe, Sparkles, ArrowRight, Play, Palette, Handshake, Shield } from "lucide-react"
import Link from "next/link"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers/auth-provider';
import { useState } from 'react';

export default function LandingPage() {
  const { user, profile } = useAuthContext();
  const router = useRouter();
  const [showVideo, setShowVideo] = useState(false);
  const handlePlay = () => setShowVideo(true);
  const handleClose = () => setShowVideo(false);

  useEffect(() => {
    if (user) {
      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (profile?.role === 'artisan') {
        router.replace('/artisan/dashboard');
      } else if (profile?.role === 'user') {
        router.replace('/marketplace');
      }
    }
  }, [user, profile, router]);

  if (user) {
    return null; // Optionally show a loader/spinner instead
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 via-orange-100/20 to-rose-100/20"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-sm font-medium">
                🎨 Empowering Indian Artisans
              </Badge>
              <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
                <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
                  Voice-Powered
                </span>
                <br />
                <span className="text-gray-800">Artisan Marketplace</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Connect with authentic handcrafted treasures. Artisans create listings with just their voice, while
                buyers discover unique stories behind every product.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  asChild
                >
                  <Link href="/artisan/create-listing">
                    <Mic className="w-6 h-6 mr-3" />
                    Start Creating
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 px-8 py-4 text-lg font-semibold bg-white/80 backdrop-blur-sm"
                  asChild
                >
                  <Link href="/marketplace">
                    <Search className="w-6 h-6 mr-3" />
                    Explore Marketplace
                  </Link>
                </Button>
              </div>

              {/* Demo Preview */}
              <div className="relative max-w-4xl mx-auto">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-orange-200/50">
                  <div className="aspect-video bg-gradient-to-br frfom-amber-100 via-orange-100 to-rose-100 rounded-2xl flex items-center justify-center relative overflow-hidden cursor-pointer group" onClick={handlePlay} tabIndex={0} role="button" aria-label="Play KalaMitra Demo Video">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-rose-500/10"></div>
                    <div className="text-center z-10 select-none">
                      <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200">
                        <Play className="w-10 h-10 text-white ml-1" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">See KalaMitra in Action</h3>
                      <p className="text-gray-600 text-lg">Voice → AI Magic → Live Marketplace</p>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-amber-400/20 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-6 right-6 w-8 h-8 bg-rose-400/20 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/2 left-8 w-6 h-6 bg-orange-400/20 rounded-full animate-ping"></div>
                  </div>
                  {/* Video Modal (in-place, fits card) */}
                  {showVideo && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl overflow-hidden">
                      <div className="relative w-full h-full">
                        <button
                          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full p-2 text-gray-700 shadow"
                          onClick={handleClose}
                          aria-label="Close video"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <iframe 
                        src="https://www.loom.com/embed/6d39f273fd8441a1a516c4336a232f68?sid=aafb18b2-a49d-479b-8b3d-1fdef44ee612" frameBorder="0"
                          allowFullScreen
                          className="w-full h-full rounded-2xl"
                          style={{ aspectRatio: '16/9', minHeight: '100%', minWidth: '100%' }}/>

                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">How KalaMitra Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to connect artisans with the world
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="relative border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 hover:shadow-xl group bg-white/80 backdrop-blur-sm">
              <div className="absolute -top-4 left-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Mic className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardHeader className="pt-12">
                <CardTitle className="text-2xl text-amber-700 mb-3">1. Speak Your Story</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Artisans describe their beautiful creations in their native language. Our advanced AI transcribes and
                  understands every detail of their craft story.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl group bg-white/80 backdrop-blur-sm">
              <div className="absolute -top-4 left-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardHeader className="pt-12">
                <CardTitle className="text-2xl text-orange-700 mb-3">2. AI Magic</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Our intelligent system creates stunning product listings with optimized titles, descriptions, pricing
                  suggestions, and compelling stories automatically.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="relative border-2 border-rose-200 hover:border-rose-300 transition-all duration-300 hover:shadow-xl group bg-white/80 backdrop-blur-sm">
              <div className="absolute -top-4 left-6">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Globe className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardHeader className="pt-12">
                <CardTitle className="text-2xl text-rose-700 mb-3">3. Global Reach</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  Products go live instantly on our vibrant marketplace, connecting talented artisans with appreciative
                  buyers worldwide.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Why Choose KalaMitra?</h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Empowering artisans with cutting-edge technology while preserving traditional craftsmanship
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Handshake className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Direct Connection</h3>
              <p className="text-white/90 leading-relaxed">
                Connect directly with artisans, hear their stories, and support their craft without intermediaries.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Authentic Quality</h3>
              <p className="text-white/90 leading-relaxed">
                Every product is verified authentic, handcrafted with traditional techniques and genuine materials.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Social Impact</h3>
              <p className="text-white/90 leading-relaxed">
                Your purchase directly supports artisan families and helps preserve traditional Indian crafts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto">
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                2,500+
              </div>
              <div className="text-gray-600 font-medium text-lg">Artisans Empowered</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                28
              </div>
              <div className="text-gray-600 font-medium text-lg">States Covered</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                150+
              </div>
              <div className="text-gray-600 font-medium text-lg">Craft Categories</div>
            </div>
            <div className="group">
              <div className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform duration-300">
                4.9★
              </div>
              <div className="text-gray-600 font-medium text-lg">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800">
              Ready to Share Your Craft with the World?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of talented artisans who are already using KalaMitra to showcase their beautiful handmade
              products and connect with appreciative buyers globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white px-10 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                asChild
              >
                <Link href="/artisan/onboarding">
                  <Users className="w-6 h-6 mr-3" />
                  Join as Artisan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-orange-300 text-orange-700 hover:bg-orange-50 px-10 py-4 text-lg font-semibold bg-white/80 backdrop-blur-sm"
                asChild
              >
                <Link href="/marketplace">Explore Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-bold">KalaMitra</span>
                  <div className="text-sm text-gray-400">Artisan Marketplace</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                Connecting hearts through handmade art, empowering artisans across India with voice-powered technology
                and global marketplace access.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">📘</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">📷</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">🐦</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">For Artisans</h3>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="/artisan/onboarding" className="hover:text-orange-400 transition-colors">
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link href="/artisan/create-listing" className="hover:text-orange-400 transition-colors">
                    Create Listing
                  </Link>
                </li>
                <li>
                  <Link href="/artisan/dashboard" className="hover:text-orange-400 transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/artisan/resources" className="hover:text-orange-400 transition-colors">
                    Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">For Buyers</h3>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="/marketplace" className="hover:text-orange-400 transition-colors">
                    Browse Products
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="hover:text-orange-400 transition-colors">
                    Track Orders
                  </Link>
                </li>
                <li>
                  <Link href="/wishlist" className="hover:text-orange-400 transition-colors">
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link href="/reviews" className="hover:text-orange-400 transition-colors">
                    Reviews
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-6 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-300">
                <li>
                  <Link href="/help" className="hover:text-orange-400 transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-orange-400 transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/shipping" className="hover:text-orange-400 transition-colors">
                    Shipping Info
                  </Link>
                </li>
                <li>
                  <Link href="/returns" className="hover:text-orange-400 transition-colors">
                    Returns
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2024 KalaMitra. Made with ❤️ for Indian artisans and craft lovers worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
};