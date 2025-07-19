import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import { NavBar } from '@/components/nav-bar'
import { QnAChatbot } from '@/components/qna-chatbot'

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
          <QnAChatbot />
        </AuthProvider>
      </body>
    </html>
  )
}
