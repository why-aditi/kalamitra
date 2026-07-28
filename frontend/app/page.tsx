import Link from 'next/link';
import { ArrowRight, Mic } from 'lucide-react';
import { SignedInRedirect } from '@/components/landing/signed-in-redirect';

/*
  Server component. It was 419 lines of static marketing shipped as a client
  bundle behind a full-page auth spinner; now it is HTML, and the only two
  interactive pieces below are separate client islands.

  The hero deliberately has no image. The single most characteristic thing about
  this product is that a sentence spoken out loud becomes a listing, so the hero
  shows that transformation in type. It also means the LCP element is text, which
  paints the instant the HTML arrives.
*/

const steps = [
  {
    n: '01',
    title: 'Say what you made',
    body: 'Describe the piece out loud, in Hindi, Bengali, Tamil, Marathi — whichever language you think in. Photograph it on your phone.',
  },
  {
    n: '02',
    title: 'We write the listing',
    body: 'The description gets translated, titled, tagged and priced against comparable work. You review every field before anything goes live.',
  },
  {
    n: '03',
    title: 'It sells under your name',
    body: 'Your listing carries your name, your craft and your region. Payment goes to you; there is no reseller in between.',
  },
];

export default function LandingPage() {
  return (
    <>
      <SignedInRedirect />

      {/* ---------------------------------------------------------- hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="ajrakh-field absolute inset-0" aria-hidden="true" />

        <div className="container relative mx-auto grid gap-14 px-4 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-20 lg:py-28">
          <div className="animate-rise-in">
            <p className="eyebrow">Indian handicraft, direct from the maker</p>

            <h1 className="display-xl mt-6 text-balance">
              Speak it.
              <br />
              <span className="text-madder">We&rsquo;ll list it.</span>
            </h1>

            <p className="lede mt-7 max-w-xl text-pretty">
              Most artisans never sell online because listing a product means typing English into a
              form. On Kalamitra you say what you made and the listing writes itself.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/artisan/create-listing"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
              >
                <Mic className="h-5 w-5" />
                Start a listing
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-6 py-3.5 text-base font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Browse the market
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* The signature: one spoken sentence, and what it becomes. */}
          <figure className="animate-rise-in [animation-delay:120ms]">
            <figcaption className="eyebrow mb-4">What the artisan says</figcaption>

            <blockquote className="rule-madder bg-secondary/60 py-4 pl-5 pr-4">
              {/* Devanagari sets wider than Latin at the same point size, so
                  this line steps down further on small screens than display-md. */}
              <p lang="hi" className="display-md text-lg leading-snug sm:text-2xl lg:text-[1.75rem]">
                मैंने नीले रंग की मिट्टी की सुराही बनाई है
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                &ldquo;I&rsquo;ve made a blue clay water pitcher&rdquo;
              </p>
            </blockquote>

            <div className="my-6 flex items-center gap-4">
              <div className="ajrakh-rule flex-1" aria-hidden="true" />
              <span className="eyebrow shrink-0">What gets published</span>
              <div className="ajrakh-rule flex-1" aria-hidden="true" />
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-soft">
              <p className="display-sm">Blue Glazed Terracotta Surahi</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hand-thrown water pitcher in cobalt-glazed terracotta, finished in the Jaipur blue
                pottery tradition. Keeps water cool without refrigeration.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {['Pottery', 'Jaipur', 'Terracotta'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="numeric mt-5 border-t border-border pt-4 text-2xl font-bold">₹1,450</p>
            </div>
          </figure>
        </div>
      </section>

      {/* --------------------------------------------------------- steps */}
      <section className="border-b border-border py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <p className="eyebrow">How it works</p>
            <h2 className="display-lg mt-5 text-balance">Three steps, and none of them are typing</h2>
          </div>

          {/* Numbered because this genuinely is a sequence — you cannot do 03 first. */}
          <ol className="mt-14 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.n} className="bg-background p-8">
                <span className="display-md text-madder">{step.n}</span>
                <h3 className="display-sm mt-5">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------------- cta */}
      <section className="bg-secondary py-20 lg:py-28">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="display-lg text-balance">Your craft already has a market. Find it.</h2>
          <p className="lede mt-5 text-pretty">
            Setting up takes about ten minutes and costs nothing. Bring one finished piece and your
            phone.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/artisan/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-madder px-7 py-3.5 text-base font-semibold text-madder-foreground shadow-soft transition-opacity hover:opacity-90"
            >
              Sell on Kalamitra
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-7 py-3.5 text-base font-semibold transition-colors hover:bg-accent"
            >
              I&rsquo;m here to buy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
