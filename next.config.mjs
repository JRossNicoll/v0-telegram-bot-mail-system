const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src https://auth.privy.io",
  "frame-ancestors 'self' https://auth.privy.io",
  "base-uri 'self'",
  "form-action 'self'",
]

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
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
