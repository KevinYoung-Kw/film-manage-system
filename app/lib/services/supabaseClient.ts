import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    // 添加自定义头部，确保API调用时携带认证信息
    headers: {
      // 如果在浏览器环境中，尝试从localStorage获取会话
      get Authorization() {
        if (typeof window !== 'undefined') {
          try {
            const sessionStr = localStorage.getItem('session');
            if (!sessionStr) {
              console.warn('未找到会话信息');
              return '';
            }
            
            const session = JSON.parse(sessionStr);
            if (!session || !session.user_id) {
              console.warn('会话信息无效');
              return '';
            }
            
            // 创建一个模拟的JWT格式，携带用户ID和角色
            return `Bearer ${btoa(JSON.stringify({
              sub: session.user_id,
              role: session.role,
              email: session.email
            }))}`;
          } catch (e) {
            console.error('获取授权头信息失败:', e);
            // 清除可能已损坏的会话数据
            localStorage.removeItem('session');
            return '';
          }
        }
        return '';
      }
    }
  }
});

// 添加响应拦截器处理常见错误
const originalRpc = supabase.rpc.bind(supabase);
// @ts-ignore - 类型重写以添加错误处理
supabase.rpc = function(procedureName, params, options) {
  return originalRpc(procedureName, params, options)
    .then(response => {
      if (response.error && response.error.message.includes('JWT')) {
        console.error('会话令牌无效或已过期');
        // 清除无效的会话信息
        if (typeof window !== 'undefined') {
          localStorage.removeItem('session');
        }
      }
      return response;
    });
};

export default supabase; 