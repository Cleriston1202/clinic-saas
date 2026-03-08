/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
    }

    return config;
  },
};

export default nextConfig;
