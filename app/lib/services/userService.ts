import supabase from './supabaseClient';
import { User, UserRole } from '../types';

// 用户服务：处理用户注册、登录、获取信息等功能
export const UserService = {
  // 用户注册
  register: async (name: string, email: string, password: string, role: UserRole = UserRole.CUSTOMER): Promise<User | null> => {
    try {
      // 1. 创建Supabase Auth用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (authError) {
        console.error('注册Auth用户失败:', authError);
        return null;
      }

      // 2. 如果Auth注册成功，获取用户信息
      if (authData.user) {
        return {
          id: authData.user.id,
          name,
          email,
          role,
          createdAt: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('用户注册失败:', error);
      return null;
    }
  },

  // 用户登录
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      // 使用Supabase Auth登录
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('登录失败:', authError);
        return null;
      }

      // 获取用户数据
      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, email, role, created_at')
          .eq('id', authData.user.id)
          .single();

        if (userError) {
          console.error('获取用户数据失败:', userError);
          return null;
        }

        return {
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
          createdAt: new Date(userData.created_at)
        };
      }

      return null;
    } catch (error) {
      console.error('登录失败:', error);
      return null;
    }
  },

  // 登出
  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('登出失败:', error);
      }
    } catch (error) {
      console.error('登出失败:', error);
    }
  },

  // 获取当前登录用户
  getCurrentUser: async (): Promise<User | null> => {
    try {
      // 获取当前会话
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        return null;
      }

      // 获取用户数据
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, email, role, created_at')
        .eq('id', sessionData.session.user.id)
        .single();

      if (userError) {
        console.error('获取用户数据失败:', userError);
        return null;
      }

      return {
        id: sessionData.session.user.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as UserRole,
        createdAt: new Date(userData.created_at)
      };
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  },

  // 获取所有用户(仅管理员可用)
  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取用户列表失败:', error);
        return [];
      }

      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  },

  // 根据ID获取用户
  getUserById: async (id: string): Promise<User | undefined> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取用户失败:', error);
        return undefined;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('获取用户失败:', error);
      return undefined;
    }
  },

  // 更新用户信息
  updateUser: async (id: string, userData: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('更新用户失败:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('更新用户失败:', error);
      return null;
    }
  }
}; 