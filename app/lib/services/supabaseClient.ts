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
  }
});

export default supabase; 