/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow @react-pdf/renderer ESM package to work with webpack
    esmExternals: "loose",
  },
  webpack: (config) => {
    // Required for @react-pdf/renderer to work in Next.js
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
