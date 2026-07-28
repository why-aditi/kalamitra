/** @type {import('next').NextConfig} */

/*
  Product images are served by the FastAPI backend, whose host differs per
  environment, so the remote pattern is derived from the same env var the app
  fetches with instead of being hardcoded.
*/
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/** @type {import('next').RemotePattern[]} */
const remotePatterns = [
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'plus.unsplash.com' },
];

try {
  const { protocol, hostname, port } = new URL(apiBase);
  remotePatterns.push({
    protocol: protocol.replace(':', ''),
    hostname,
    port: port || '',
    pathname: '/api/listings/**',
  });
} catch {
  console.warn(`[next.config] NEXT_PUBLIC_API_BASE_URL is not a valid URL: ${apiBase}`);
}

const nextConfig = {
  // Type errors fail the build. They were suppressed here, which is how the
  // repo accumulated them in the first place.
  typescript: {
    ignoreBuildErrors: false,
  },
  // No ESLint config exists in this repo yet, so `next lint` has nothing to run
  // against; leaving this on until one is added (see handoff).
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
};

export default nextConfig;
