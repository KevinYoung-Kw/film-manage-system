import supabase from './supabaseClient';
import { User, UserRole } from '../types';

/**
 * 用户服务 - 处理用户管理相关功能
 */
export const UserService = {
  /**
   * 获取所有用户
   * @returns 用户列表
   */
  getAllUsers: async (): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('获取用户列表失败: ' + error.message);
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
      throw error;
    }
  },

  /**
   * 按角色获取用户
   * @param role 用户角色
   * @returns 符合角色的用户列表
   */
  getUsersByRole: async (role: UserRole): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取${role}用户列表失败: ` + error.message);
      }

      return data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        createdAt: new Date(user.created_at)
      }));
    } catch (error) {
      console.error(`获取${role}用户列表失败:`, error);
      throw error;
    }
  },

  /**
   * 获取指定用户
   * @param userId 用户ID
   * @returns 用户信息
   */
  getUserById: async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('获取用户信息失败:', error);
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
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param userData 更新的用户数据
   * @returns 更新后的用户信息
   */
  updateUser: async (userId: string, userData: Partial<User>): Promise<User | null> => {
    try {
      // 转换为数据库格式
      const updateData: any = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.role) updateData.role = userData.role;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error('更新用户信息失败: ' + error?.message || '未知错误');
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 更新用户密码
   * @param userId 用户ID
   * @param newPassword 新密码
   * @returns 是否成功
   */
  updatePassword: async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          password_hash: newPassword,  // 实际应用中需要哈希处理
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw new Error('更新密码失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('更新密码失败:', error);
      throw error;
    }
  },

  /**
   * 创建新用户（仅管理员可用）
   * @param userData 用户信息
   * @returns 创建的用户信息
   */
  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<User | null> => {
    try {
      // 检查邮箱是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('该邮箱已被注册');
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: userData.name,
          email: userData.email,
          password_hash: userData.password,  // 实际应用中需要哈希处理
          role: userData.role
        }])
        .select()
        .single();

      if (error || !data) {
        throw new Error('创建用户失败: ' + error?.message || '未知错误');
      }

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  },

  /**
   * 删除用户（仅管理员可用）
   * @param userId 用户ID
   * @returns 是否成功
   */
  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error('删除用户失败: ' + error.message);
      }

      return true;
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    }
  }
}; 