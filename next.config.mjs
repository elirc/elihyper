/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: true,
  reactStrictMode: true,
  async headers() {
    // Prevent 304 revalidation for large binary assets in dev.
    // This avoids Chrome `ERR_CACHE_WRITE_FAILURE` edge cases seen with 304 + disk cache.
    // In prod, prefer long-lived caching to reduce bandwidth/latency.
    const isDev = process.env.NODE_ENV !== 'production'
    const cacheControl = isDev ? 'no-store' : 'public, max-age=31536000, immutable'
    return [
      {
        source: '/source/:path*',
        headers: [{ key: 'Cache-Control', value: cacheControl }],
      },
      {
        source: '/textures/:path*',
        headers: [{ key: 'Cache-Control', value: cacheControl }],
      },
    ]
  },
}

export default nextConfig
