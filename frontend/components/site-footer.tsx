import Link from 'next/link';
import { Wordmark } from '@/components/wordmark';

/*
  Every link here resolves to a route that exists. The previous footer pointed at
  /wishlist, /returns, /help, /shipping, /reviews and /artisan/resources — six
  guaranteed 404s. A dead link is worse than a missing one.
*/
const columns = [
  {
    heading: 'Sell your work',
    links: [
      { href: '/artisan/onboarding', label: 'Become a seller' },
      { href: '/artisan/create-listing', label: 'List by voice' },
      { href: '/artisan/dashboard', label: 'Seller dashboard' },
      { href: '/artisan/products', label: 'Your listings' },
    ],
  },
  {
    heading: 'Buy',
    links: [
      { href: '/marketplace', label: 'Browse the market' },
      { href: '/buyer/orders', label: 'Your orders' },
      { href: '/buyer/profile', label: 'Your account' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="ajrakh-rule" aria-hidden="true" />
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Wordmark tone="inverse" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
              Kalamitra connects makers of Indian handicraft directly with the people who buy it.
              No middle layer, no anonymous stock — every listing carries the name of the person who made it.
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-labelledby={`footer-${column.heading}`}>
              <h2 id={`footer-${column.heading}`} className="eyebrow text-primary-foreground/50">
                {column.heading}
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-primary-foreground/80 underline-offset-4 transition-colors hover:text-haldi hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-14 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} Kalamitra. Built for Indian artisans.
        </p>
      </div>
    </footer>
  );
}
