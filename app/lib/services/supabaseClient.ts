import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// 从环境变量中获取Supabase URL和匿名API密钥
// 在本地开发时，这些值会从.env.local文件中读取
// 在生产环境中，需要在部署平台上设置这些环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    // 设置较长的请求超时时间和认证头
    fetch: (url, options = {}) => {
      // 添加自定义请求头
      const customHeaders = {
        ...options?.headers,
        'apikey': supabaseAnonKey, // 添加 apikey 到请求头
        'Authorization': `Bearer ${supabaseAnonKey}`, // 添加 Authorization 到请求头
        'Content-Profile': 'public',
        'Accept-Profile': 'public'
      };

      // 创建新的选项对象
      const newOptions = {
        ...options,
        headers: customHeaders,
        // 设置较长的请求超时
        signal: AbortSignal.timeout(10000) // 10秒超时
      };

      // 检查 URL 是否已包含 apikey 参数
      try {
        // 确保 URL 是字符串类型
        const urlString = url.toString();
        const urlObj = new URL(urlString);
        
        // 添加 apikey 参数，如果还没有
        if (!urlObj.searchParams.has('apikey')) {
          urlObj.searchParams.append('apikey', supabaseAnonKey);
        }
        
        // 不再使用auth=bypass作为查询参数，而是在路径中添加
        if (urlObj.pathname.includes('/rest/v1/auth/bypass/')) {
          // 移除auth/bypass路径，直接使用标准路径
          urlObj.pathname = urlObj.pathname.replace('/rest/v1/auth/bypass/', '/rest/v1/');
        }
        
        return fetch(urlObj.toString(), newOptions);
      } catch (error) {
        // 如果解析 URL 失败，直接使用原始 URL
        console.warn('无法解析 URL，使用原始 URL:', error);
        return fetch(url, newOptions);
      }
    }
  },
  // 添加数据库配置
  db: {
    schema: 'public'
  }
});

// 导出无安全策略的客户端，仅用于基本表操作
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  },
  global: {
    fetch: (url, options = {}) => {
      const customHeaders = {
        ...options?.headers,
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Profile': 'public',
        'Accept-Profile': 'public',
        // 特殊头，尝试绕过 RLS
        'x-client-info': 'admin-bypass',
        'Prefer': 'return=minimal'
      };

      const newOptions = {
        ...options,
        headers: customHeaders,
        signal: AbortSignal.timeout(10000)
      };

      try {
        const urlString = url.toString();
        const urlObj = new URL(urlString);
        
        if (!urlObj.searchParams.has('apikey')) {
          urlObj.searchParams.append('apikey', supabaseAnonKey);
        }
        
        // 使用正确的方式添加绕过路径
        if (urlObj.pathname.includes('/rest/v1/auth/bypass/')) {
          // 移除auth/bypass路径，直接使用标准路径
          urlObj.pathname = urlObj.pathname.replace('/rest/v1/auth/bypass/', '/rest/v1/');
        }
        
        return fetch(urlObj.toString(), newOptions);
      } catch (error) {
        console.warn('无法解析 URL，使用原始 URL:', error);
        return fetch(url, newOptions);
      }
    }
  },
  db: {
    schema: 'public'
  }
});

export default supabase; 