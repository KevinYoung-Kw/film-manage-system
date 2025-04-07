import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'img1.doubanio.com', 
      'img2.doubanio.com', 
      'img3.doubanio.com', 
      'img9.doubanio.com',
      'api.dicebear.com',
      'img.icons8.com',
      'randomuser.me',
      'cloudflare-ipfs.com'
    ],
    unoptimized: true,
  }
};

export default nextConfig;
