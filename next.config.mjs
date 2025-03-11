/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
  // Disable source maps in development
  productionBrowserSourceMaps: false,

  // Optional: Disable Webpack cache in development
  webpack: (config, { dev }) => {
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: "memory",
      });
    }
    // Important: return the modified config
    return config;
  },
};

export default nextConfig;
