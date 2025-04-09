import supabase from './supabaseClient';
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
        .single();

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
      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatches) {
        console.error('密码不匹配');
        throw new Error('用户名或密码错误');
      }

      console.log('密码验证成功');

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
        .single();

      if (error || !user) {
        console.error('注册失败:', error);
        throw new Error('注册失败: ' + (error?.message || '未知错误'));
      }

      // 注册成功后自动登录
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
  },

  /**
   * 初始化会话（用于AppContext初始化）
   * @returns 当前用户信息
   */
  initSession: async (): Promise<User | null> => {
    return await AuthService.getCurrentUser();
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