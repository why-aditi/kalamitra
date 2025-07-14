'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/components/providers/auth-provider';
import { LoadingPage } from '@/components/ui/loading';

export default function BuyerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, signIn, loading } = useAuthContext();
  const from = searchParams.get('from') || '/marketplace';

  useEffect(() => {
    if (user && profile?.role) {
        const redirectPath = profile.role === 'artisan' ? '/artisan/dashboard' : '/marketplace';
        router.push(from && from !== '/' ? from : redirectPath);
    }
  }, [user, profile, router, from]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Welcome to Kalamitra
          </h2>
          <p className="text-center text-muted-foreground text-lg">
            Discover unique artisan creations
          </p>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Continue with
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <Button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center space-x-3 h-12 text-base bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white hover:opacity-90 rounded-lg shadow-lg"
          >
            <Image
              src="/google.svg"
              alt="Google Logo"
              width={24}
              height={24}
            />
            <span>Sign in with Google</span>
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="/terms" className="font-medium hover:text-primary underline underline-offset-4">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="font-medium hover:text-primary underline underline-offset-4">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
