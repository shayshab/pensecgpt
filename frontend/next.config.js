/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Environment variables are automatically available via process.env
  // No need to explicitly define them here for Next.js
  // They're accessible in the browser if prefixed with NEXT_PUBLIC_
  
  // Optional: Add image domains if needed
  images: {
    domains: [],
  },
  
  // Optional: Enable standalone output for better deployment
  output: 'standalone',
}

module.exports = nextConfig






