/** @type {import('next').NextConfig} */
import withPWA from "next-pwa";

const withPWAConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable in development, enable in production
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ["!robots.txt", "!sitemap.xml"],
});

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore optional dependencies that don't work in serverless
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        "webworker-threads": "commonjs webworker-threads",
      });
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "webworker-threads": false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "minio.salvawebpro.com", port: "9000" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "unsplash.com" },
      { protocol: "https", hostname: "pexels.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "http2.mlstatic.com" },
      { protocol: "https", hostname: "scontent-phx1-1.xx.fbcdn.net" },
      { protocol: "https", hostname: "external-phx1-1.xx.fbcdn.net" },
      { protocol: "https", hostname: "img.theapi.app" },
      {
        protocol: "https",
        hostname: "oaidalleapiprodscus.blob.core.windows.net",
      },
    ],
  },
};

export default withPWAConfig(nextConfig);
