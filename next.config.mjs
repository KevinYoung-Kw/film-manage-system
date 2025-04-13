/** @type {import('next').NextConfig} */
const nextConfig = {
  // 开启图片优化功能
  images: {
    domains: [
      'images.unsplash.com', 
      'image.tmdb.org', 
      'localhost', 
      'hlfmexcsldkcymxlmcfu.supabase.co',
      'hlfmexcsldkcymxlmcfu.supabase.in'
    ],
    unoptimized: true, // 在所有环境中都不优化图片，确保一致性
  },
  
  // 页面响应和构建时配置
  poweredByHeader: false,
  reactStrictMode: true,
  
  // 环境变量配置
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },
  
  // ESLint配置
  eslint: {
    // 在构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  
  // TypeScript配置
  typescript: {
    // 在构建时忽略TypeScript错误
    ignoreBuildErrors: true,
  },
  
  // API 请求配置
  async headers() {
    return [
      {
        // 匹配所有 API 路由
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig; 