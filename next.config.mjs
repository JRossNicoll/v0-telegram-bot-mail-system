/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: false,
    webpackBuildWorker: false,
  },
  webpack: (config) => {
    return config;
  },
};

module.exports = nextConfig;
