import type { NextConfig } from "next";

const backendInternal =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/+$/, "") ||
  "http://168.144.83.229:5106";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: `${backendInternal}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
