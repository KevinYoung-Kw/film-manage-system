import supabase from './supabaseClient';
import { User, UserRole } from '../types';

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
      // 查询用户表获取用户信息
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        console.error('登录失败:', error);
        throw new Error('用户名或密码错误');
      }

      // 在实际项目中应使用安全的密码比较方法
      // 这里简化为直接比较，实际项目中应使用bcrypt等
      if (user.password_hash !== password) {
        throw new Error('用户名或密码错误');
      }

      // 登录成功后更新认证状态
      const session = {
        user_id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      // 保存会话信息到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('session', JSON.stringify(session));
      }

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
        .single();

      if (existingUser) {
        throw new Error('该邮箱已被注册');
      }

      // 创建新用户
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password_hash: password, // 实际项目中应哈希密码
            role: 'customer' // 默认角色是普通用户
          }
        ])
        .select()
        .single();

      if (error || !user) {
        console.error('注册失败:', error);
        throw new Error('注册失败: ' + (error?.message || '未知错误'));
      }

      // 注册成功后自动登录
      return await AuthService.login(email, password);
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
        .single();

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
  }
}; 