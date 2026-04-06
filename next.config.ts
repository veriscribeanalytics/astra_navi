import type { NextConfig } from "next";

const nextConfig: any = {
  /* config options here */
  reactCompiler: true,
  allowedDevOrigins: ['192.168.1.3', '192.168.1.3:3000', '192.168.1.2', '192.168.1.2:3000', 'localhost', 'localhost:3000', '0.0.0.0']
};

export default nextConfig;
