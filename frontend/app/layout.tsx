import type { Metadata, Viewport } from 'next';
import { Fraunces, Karla } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { NavBar } from '@/components/nav-bar';
import { SiteFooter } from '@/components/site-footer';
import { DeferredChatbot } from '@/components/deferred-chatbot';
import { themeInitScript } from '@/components/theme-toggle';
import './globals.css';

/*
  Two faces, both variable, both self-hosted by next/font at build time.
  Fraunces carries the display voice — it has a hand-cut, slightly wonky
  character that suits block-printed craft far better than a neutral geometric.
  Karla handles everything else: quirky enough to belong beside it, plain
  enough to set a form label in.
*/
const display = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const sans = Karla({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'Kalamitra — handmade from India, straight from the maker',
    template: '%s · Kalamitra',
  },
  description:
    'A marketplace for Indian handicraft. Artisans list their work by speaking; buyers get the object and the story behind it.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf7' },
    { media: '(prefers-color-scheme: dark)', color: '#101524' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <AuthProvider>
          <NavBar />
          {/* min-h keeps the footer at the bottom on short pages without
              pinning it, so it never floats over sparse content. */}
          <main id="main" className="min-h-[60vh]">
            {children}
          </main>
          <SiteFooter />
          <Toaster />
          <DeferredChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
