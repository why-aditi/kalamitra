// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     domains: ["lh3.googleusercontent.com"],
//   },
//   images: {
//     unoptimized: true,
//   },
// };

// export default nextConfig;



// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   images: {
//     domains: ["lh3.googleusercontent.com", "firebasestorage.googleapis.com"], // Add all needed domains
//     unoptimized: true, // Combine here
//   },
// };

// export default nextConfig;




/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "firebasestorage.googleapis.com",
      "images.unsplash.com",
      "plus.unsplash.com", // ⬅️ For premium Unsplash images
    ],
    unoptimized: true, // Set to true if you're not using Next.js image optimization
  },
};

export default nextConfig;
