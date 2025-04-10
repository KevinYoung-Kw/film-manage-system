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
  }
});

// 添加修改后的signIn方法，执行正确的登录流程并获取访问令牌
export const signInWithCredentials = async (email: string, role: string, userId: string) => {
  try {
    // 调用自定义的登录函数，获取有效的访问令牌
    const { data, error } = await supabase.rpc('create_user_session', {
      p_user_id: userId,
      p_email: email,
      p_role: role
    });

    if (error) {
      console.error('创建会话失败:', error);
      throw error;
    }

    if (data?.access_token) {
      // 使用获取的令牌设置认证状态
      supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token || ''
      });
      
      return true;
    } else {
      console.error('获取访问令牌失败');
      return false;
    }
  } catch (error) {
    console.error('登录过程发生错误:', error);
    return false;
  }
};

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
        // 清除Supabase会话
        supabase.auth.signOut();
      }
      return response;
    });
};

export default supabase; 