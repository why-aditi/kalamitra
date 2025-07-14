import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import { NavBar } from '@/components/nav-bar'

export const metadata: Metadata = {
  title: 'Kalamitra',
  description: 'Connecting artisans with art lovers',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar/>
          <main className="">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
