/** @type {import('next').NextConfig} */

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self' https://auth.privy.io https://*.vercel.app https://*.courier.markets;",
  },
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
    turbo: {},
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
