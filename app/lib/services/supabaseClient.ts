import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// 获取环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 创建Supabase客户端
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // 使用自定义的存储键
    storageKey: 'film-manage-system-auth',
    // 禁用自动获取URL中的会话信息
    detectSessionInUrl: false
  }
});

// 添加修改后的signIn方法，使用内置的身份验证机制登录
export const signInWithCredentials = async (email: string, role: string, userId: string) => {
  try {
    console.log('准备使用Supabase内置Auth登录:', { email, role, userId });
    
    // 使用自定义凭据认证功能登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: 'film-system-token-' + userId.substring(0, 8)
    });

    if (error) {
      // 如果邮箱/密码登录失败，尝试创建新用户
      console.log('登录失败，尝试创建用户...', error);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: 'film-system-token-' + userId.substring(0, 8),
        options: {
          data: {
            role: role,
            user_db_id: userId,
            name: email.split('@')[0]
          }
        }
      });

      if (signUpError) {
        console.error('创建用户失败:', signUpError);
        throw signUpError;
      }

      // 新用户创建成功，直接返回
      if (signUpData?.user) {
        console.log('新用户创建并登录成功');
        
        // 保存会话信息到localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('session', JSON.stringify({
            user_id: userId,
            email: email,
            role: role
          }));
        }
        
        return true;
      } else {
        console.error('创建用户成功但未返回用户对象');
        return false;
      }
    }

    // 邮箱/密码登录成功
    console.log('Supabase Auth登录成功:', data);
    
    // 更新用户元数据，确保角色信息正确
    if (data.user) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          role: role,
          user_db_id: userId
        }
      });
      
      if (updateError) {
        console.warn('更新用户元数据失败:', updateError);
      }
    }

    // 保存会话信息到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('session', JSON.stringify({
        user_id: userId,
        email: email,
        role: role
      }));
    }
    
    return true;
  } catch (error) {
    console.error('登录过程发生错误:', error);
    return false;
  }
};

// 检查会话状态并在必要时刷新
export const checkAndRefreshSession = async (): Promise<boolean> => {
  try {
    // 获取当前会话
    const { data: { session } } = await supabase.auth.getSession();
    
    // 如果没有会话，但有本地存储的用户信息，尝试刷新
    if (!session && typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('session');
      if (sessionStr) {
        try {
          const userSession = JSON.parse(sessionStr);
          if (userSession?.user_id && userSession?.email && userSession?.role) {
            console.log('会话已过期，尝试刷新...');
            
            // 尝试使用已存储的凭据重新登录
            return await signInWithCredentials(
              userSession.email, 
              userSession.role, 
              userSession.user_id
            );
          }
        } catch (e) {
          console.error('刷新会话失败:', e);
        }
      }
      return false;
    }
    
    return !!session;
  } catch (error) {
    console.error('检查会话状态失败:', error);
    return false;
  }
};

/**
 * 自定义错误处理类型
 */
interface CustomErrorResponse {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// 添加拦截器处理401错误和会话过期
const originalFrom = supabase.from.bind(supabase);
// @ts-expect-error - 重写类型以添加拦截器
supabase.from = function(table: string) {
  const builder = originalFrom(table);
  
  // 重写各种方法的结果处理
  const methods = ['select', 'insert', 'update', 'delete', 'upsert'];
  
  methods.forEach(method => {
    if (typeof builder[method as keyof typeof builder] === 'function') {
      const original = builder[method as keyof typeof builder].bind(builder);
      // @ts-expect-error - 动态改写方法
      builder[method] = function(...args: any[]) {
        const result = original(...args);
        
        // 添加自定义then处理
        const originalThen = result.then.bind(result);
        result.then = async function(resolve: any, reject: any) {
          try {
            const response = await originalThen((r: any) => r);
            
            // 处理401或403错误
            if (response.error && 
                ((response.error as CustomErrorResponse).code === '401' || 
                 (response.error as CustomErrorResponse).code === '42501' || 
                 (response.error as CustomErrorResponse).code === '403' ||
                 (response.error as CustomErrorResponse).message?.includes('JWT'))) {
              console.warn(`权限错误 (${table}.${method}): ${response.error.message}，尝试刷新会话...`);
              
              // 尝试刷新会话
              const refreshed = await checkAndRefreshSession();
              if (refreshed) {
                // 重试原始请求
                console.log('会话已刷新，重试请求...');
                const retryResponse = await original(...args).then((r: any) => r);
                return resolve ? resolve(retryResponse) : retryResponse;
              }
            }
            
            return resolve ? resolve(response) : response;
          } catch (error) {
            return reject ? reject(error) : Promise.reject(error);
          }
        };
        
        return result;
      };
    }
  });
  
  return builder;
};

// 添加响应拦截器处理常见错误
const originalRpc = supabase.rpc.bind(supabase);
// @ts-expect-error - 类型重写以添加错误处理
supabase.rpc = function(procedureName, params, options) {
  return originalRpc(procedureName, params, options)
    .then(async (response) => {
      if (response.error && 
          ((response.error as CustomErrorResponse).message?.includes('JWT') || 
           (response.error as CustomErrorResponse).code === '403' ||
           (response.error as CustomErrorResponse).code === '401')) {
        console.error('会话令牌无效或已过期');
        
        // 尝试刷新会话
        if (typeof window !== 'undefined') {
          const sessionStr = localStorage.getItem('session');
          if (sessionStr) {
            try {
              const userSession = JSON.parse(sessionStr);
              if (userSession?.user_id && userSession?.email && userSession?.role) {
                console.log('检测到JWT错误，尝试刷新会话...');
                const refreshed = await signInWithCredentials(
                  userSession.email, 
                  userSession.role, 
                  userSession.user_id
                );
                
                // 如果刷新成功，重试原请求
                if (refreshed && procedureName !== 'create_user_session') {
                  return await originalRpc(procedureName, params, options);
                }
              }
            } catch (e) {
              console.error('刷新会话失败:', e);
              // 清除无效的会话信息
              localStorage.removeItem('session');
              // 清除Supabase会话
              await supabase.auth.signOut();
            }
          }
        }
      }
      return response;
    });
};

// 创建一个管理员客户端（目前只是普通客户端的别名，实际项目中可能需要使用服务端角色密钥）
export const supabaseAdmin = supabase;

export default supabase; 