import { User, UserRole } from '../types';
import { mockUsers } from '../mockData';

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

// 用户会话管理
const SESSION_KEY = 'user_session';

// 保存用户会话到localStorage
const saveSession = (user: User): void => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('保存会话失败:', error);
  }
};

// 从localStorage获取用户会话
const getSession = (): User | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (sessionData) {
      return JSON.parse(sessionData);
    }
  } catch (error) {
    console.error('获取会话失败:', error);
  }
  return null;
};

// 清除localStorage中的用户会话
const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('清除会话失败:', error);
  }
};

export const AuthService = {
  // 登录方法
  login: async (credentials: LoginCredentials): Promise<User | null> => {
    try {
      // 使用模拟数据进行登录
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
    } catch (error) {
      console.error('登录失败:', error);
      return null;
    }
  },
  
  // 注册方法
  register: async (data: RegisterData): Promise<User | null> => {
    try {
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
    } catch (error) {
      console.error('注册失败:', error);
      return null;
    }
  },
  
  // 登出方法
  logout: async (): Promise<void> => {
    clearSession();
  },
  
  // 获取当前用户
  getCurrentUser: (): User | null => {
    return getSession();
  },
  
  // 初始化会话
  initSession: async (): Promise<User | null> => {
    return getSession();
  }
}; 