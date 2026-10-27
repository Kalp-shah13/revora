import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network devices (e.g. mobile testing, LAN IP)
  allowedDevOrigins: [
    '192.168.1.200',
    '192.168.1.20',
    '192.168.1.200:3000',
    'localhost',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3000',
  ],
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
