import type { NextConfig } from "next";

const nextConfig: any = {
  /* config options here */
  reactCompiler: true,
  // Allow all devices on local network for development
  allowedDevOrigins: [
    '192.168.1.3', 
    '192.168.1.3:3000', 
    '192.168.1.2', 
    '192.168.1.2:3000',
    '192.168.1.15',
    '192.168.1.15:3000',
    'localhost', 
    'localhost:3000', 
    '0.0.0.0'
  ].concat(
    // Allow any IP in 192.168.x.x range
    Array.from({ length: 255 }, (_, i) => `192.168.1.${i}`),
    Array.from({ length: 255 }, (_, i) => `192.168.1.${i}:3000`)
  )
};

export default nextConfig;
