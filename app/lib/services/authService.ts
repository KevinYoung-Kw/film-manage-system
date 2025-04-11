import supabase, { signInWithCredentials } from './supabaseClient';
import { User, UserRole } from '../types';
import bcrypt from 'bcryptjs';

/**
 * 认证服务 - 处理登录、注册、退出等身份验证功能
 */
export const AuthService = {
  /**
   * 用户登录
   * @param email 邮箱
   * @param password 密码
   * @returns 登录用户信息
   */
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      console.log(`尝试登录: ${email}`);
      
      // 查询用户表获取用户信息
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('登录查询失败:', error);
        throw new Error(`用户不存在或查询失败: ${error.message}`);
      }

      if (!user) {
        console.error('没有找到用户');
        throw new Error('用户名或密码错误');
      }

      console.log(`找到用户: ${user.id}, 角色: ${user.role}`);
      
      // 使用bcrypt比较密码
      console.log('尝试验证密码：', {
        inputPassword: password,
        dbPasswordHash: user.password_hash
      });
      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      console.log('密码验证结果：', passwordMatches);
      if (!passwordMatches) {
        console.error('密码不匹配');
        throw new Error('用户名或密码错误');
      }

      console.log('密码验证成功');
      
      // 使用Supabase Auth服务创建会话
      console.log('尝试创建Supabase会话...');
      const sessionCreated = await signInWithCredentials(user.email, user.role, user.id);
      
      if (!sessionCreated) {
        console.error('创建Supabase会话失败');
        throw new Error('登录失败：无法创建会话');
      }
      
      console.log('创建Supabase会话成功');

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      };
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  },

  /**
   * 用户注册
   * @param name 用户名
   * @param email 邮箱
   * @param password 密码
   * @returns 新注册的用户信息
   */
  register: async (name: string, email: string, password: string): Promise<User | null> => {
    try {
      // 检查邮箱是否已被使用
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('该邮箱已被注册');
      }

      // 使用bcrypt对密码进行哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 创建新用户
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password_hash: hashedPassword, // 存储哈希后的密码
            role: 'customer' // 默认角色是普通用户
          }
        ])
        .select()
        .maybeSingle();

      if (error || !user) {
        console.error('注册失败:', error);
        throw new Error('注册失败: ' + (error?.message || '未知错误'));
      }

      // 使用Supabase Auth服务创建会话
      console.log('尝试为新注册用户创建Supabase会话...');
      
      // 1. 首先在Auth服务中创建用户
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: 'film-system-token-' + user.id.substring(0, 8),
        options: {
          data: {
            role: user.role,
            user_db_id: user.id,
            name: name
          }
        }
      });
      
      if (signUpError) {
        console.warn('在Auth服务中创建用户失败，但数据库用户已创建:', signUpError);
      }
      
      // 2. 使用signInWithCredentials登录
      const sessionCreated = await signInWithCredentials(user.email, user.role, user.id);
      
      if (!sessionCreated) {
        console.error('创建Supabase会话失败');
        throw new Error('注册成功但登录失败：无法创建会话');
      }
      
      console.log('创建Supabase会话成功');

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      };
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },

  /**
   * 退出登录
   */
  logout: async (): Promise<void> => {
    // 清除本地会话信息
    if (typeof window !== 'undefined') {
      localStorage.removeItem('session');
    }
    
    // 清除Supabase会话
    await supabase.auth.signOut();
  },

  /**
   * 获取当前登录用户信息
   * @returns 当前用户信息
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // 从本地存储获取会话信息
      let session;
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
          session = JSON.parse(sessionStr);
        }
      }

      if (!session || !session.user_id) {
        return null;
      }

      // 获取用户信息
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .maybeSingle();

      if (error || !user) {
        console.error('获取当前用户失败:', error);
        AuthService.logout(); // 如果获取用户失败，清除会话
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      };
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  },

  /**
   * 初始化会话（用于AppContext初始化）
   * @returns 当前用户信息
   */
  initSession: async (): Promise<User | null> => {
    try {
      // 首先检查本地存储中是否有会话信息
      let session = null;
      if (typeof window !== 'undefined') {
        const sessionStr = localStorage.getItem('session');
        if (sessionStr) {
          try {
            session = JSON.parse(sessionStr);
          } catch (e) {
            console.error('解析会话信息失败:', e);
          }
        }
      }

      // 如果有本地会话，尝试刷新令牌
      if (session?.user_id && session?.email && session?.role) {
        // 检查当前Supabase会话状态
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        
        // 如果没有有效的Supabase会话，尝试重新创建
        if (!supabaseSession) {
          console.log('本地会话存在但Supabase会话已过期，尝试刷新...');
          await signInWithCredentials(session.email, session.role, session.user_id);
        }
      }
      
      // 最后获取当前用户信息
      return await AuthService.getCurrentUser();
    } catch (error) {
      console.error('初始化会话失败:', error);
      return null;
    }
  },

  /**
   * 测试数据库连接和用户查询
   * @returns 数据库连接和用户查询结果
   */
  testUserQuery: async (email: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, name, created_at')
        .eq('email', email);
      
      if (error) {
        return { 
          success: false, 
          message: '查询失败', 
          error 
        };
      }
      
      return { 
        success: true, 
        message: '查询成功', 
        data,
        count: data?.length || 0
      };
    } catch (error) {
      return { 
        success: false, 
        message: '执行查询时出错', 
        error 
      };
    }
  }
};