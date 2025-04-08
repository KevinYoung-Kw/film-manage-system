import { User, UserRole } from '../types';
import { mockUsers } from '../mockData';
import { createClient } from '@supabase/supabase-js';

// 为未来的Supabase整合准备
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 创建Supabase客户端（如果环境变量存在）
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

// 保存登录会话（在本地存储或cookies中）
const saveSession = (user: User) => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// 清除登录会话
const clearSession = () => {
  localStorage.removeItem('currentUser');
};

// 从本地存储获取会话
const getSession = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
};

export const AuthService = {
  // 登录方法
  login: async (credentials: LoginCredentials): Promise<User | null> => {
    // 如果Supabase已配置，使用Supabase登录
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) throw new Error(error.message);
      
      if (data.user) {
        // 获取附加的用户信息
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (userData) {
          const user: User = {
            id: data.user.id,
            email: data.user.email!,
            name: userData.name,
            role: userData.role,
            createdAt: new Date(userData.created_at),
          };
          
          saveSession(user);
          return user;
        }
      }
      
      return null;
    }
    
    // 如果没有配置Supabase，使用模拟数据进行登录
    // 在真实环境中应该对密码进行哈希处理，这里为了简化使用明文
    const user = mockUsers.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase()
    );
    
    // 模拟数据中的密码固定为123456
    const isPasswordValid = credentials.password === '123456';
    
    if (user && isPasswordValid) {
      saveSession(user);
      return user;
    }
    
    return null;
  },
  
  // 注册方法
  register: async (data: RegisterData): Promise<User | null> => {
    // 如果Supabase已配置，使用Supabase注册
    if (supabase) {
      // 创建用户身份
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw new Error(error.message);
      
      if (authData.user) {
        // 创建附加的用户信息
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: data.email,
            name: data.name,
            role: data.role || UserRole.CUSTOMER,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (profileError) throw new Error(profileError.message);
        
        if (userData) {
          const user: User = {
            id: authData.user.id,
            email: data.email,
            name: data.name,
            role: data.role || UserRole.CUSTOMER,
            createdAt: new Date(),
          };
          
          saveSession(user);
          return user;
        }
      }
      
      return null;
    }
    
    // 如果没有配置Supabase，模拟注册
    const newUser: User = {
      id: `user${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role || UserRole.CUSTOMER,
      createdAt: new Date(),
    };
    
    // 在真实应用中会将新用户添加到数据库
    // 这里仅返回模拟的用户对象
    saveSession(newUser);
    return newUser;
  },
  
  // 登出方法
  logout: async (): Promise<void> => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    clearSession();
  },
  
  // 获取当前用户
  getCurrentUser: (): User | null => {
    return getSession();
  },
  
  // 初始化会话
  initSession: async (): Promise<User | null> => {
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (userData) {
          const user: User = {
            id: data.session.user.id,
            email: data.session.user.email!,
            name: userData.name,
            role: userData.role,
            createdAt: new Date(userData.created_at),
          };
          
          saveSession(user);
          return user;
        }
      }
      
      return null;
    }
    
    return getSession();
  }
}; 