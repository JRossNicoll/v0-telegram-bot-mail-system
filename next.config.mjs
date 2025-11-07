/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },

  // ✅ Tell Next we are intentionally using Webpack, not Turbopack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    config.externals.push("pino-pretty", "encoding")
    return config
  },

  // ✅ Silence the Turbopack check
  experimental: {
    // force webpack instead of turbopack on Vercel
    webpackBuildWorker: true,
  },

  // ✅ Clean Turbopack config so Next stops complaining
  turbopack: {},
}

export default nextConfig
