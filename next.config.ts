import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['img1.doubanio.com', 'img2.doubanio.com', 'img3.doubanio.com', 'img9.doubanio.com'],
    unoptimized: true,
  }
};

export default nextConfig;
