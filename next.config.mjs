/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启图片优化功能
  images: {
    domains: ['images.unsplash.com', 'image.tmdb.org', 'localhost'],
    unoptimized: true, // 在所有环境中都不优化图片，确保一致性
  },
  
  // 页面响应和构建时配置
  poweredByHeader: false,
  reactStrictMode: true,
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
};

export default nextConfig; 