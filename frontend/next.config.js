/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: 'https://poetic-surprise-production-a81f.up.railway.app',
    NEXT_PUBLIC_WS_URL: 'wss://poetic-surprise-production-a81f.up.railway.app',
  },
}

module.exports = nextConfig
