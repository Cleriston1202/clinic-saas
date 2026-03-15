/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // OneDrive can lock .next cache files and break webpack pack cache writes.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
