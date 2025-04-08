'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Movie, Theater, Showtime, Order, User, UserRole, TicketType } from '../types';
import { MovieService, TheaterService, ShowtimeService, OrderService, UserService } from '../services/dataService';
import { AuthService } from '../services/authService';
import { useRouter, usePathname } from 'next/navigation';

// 定义上下文状态类型
interface AppContextState {
  // 数据状态
  movies: Movie[];
  theaters: Theater[];
  showtimes: Showtime[];
  todayShowtimes: Showtime[];
  orders: Order[];
  
  // 用户状态和认证
  currentUser: User | null;
  userRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<User | null>;
  logout: () => Promise<void>;
  
  // 当前选中的项目
  selectedMovie: Movie | null;
  selectedShowtime: Showtime | null;
  selectedSeats: string[];
  
  // 操作方法
  selectMovie: (movie: Movie | null) => void;
  selectShowtime: (showtime: Showtime | null) => void;
  selectSeat: (seatId: string) => void;
  unselectSeat: (seatId: string) => void;
  clearSelectedSeats: () => void;
  refreshData: () => Promise<void>;
  
  // 业务流程方法
  searchMovies: (query: string) => Promise<Movie[]>;
  getShowtimesForMovie: (movieId: string) => Promise<Showtime[]>;
  createOrder: (ticketType: TicketType) => Promise<Order | null>;
}

// 创建上下文
const AppContext = createContext<AppContextState | undefined>(undefined);

// 上下文提供者组件
export const AppContextProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // 路由相关
  const router = useRouter();
  const pathname = usePathname();
  
  // 数据状态
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [todayShowtimes, setTodayShowtimes] = useState<Showtime[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // 用户状态
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  
  // 当前选中状态
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 使用ref跟踪是否已经加载初始数据
  const isInitialized = useRef(false);

  // 初始化认证
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await AuthService.initSession();
        if (user) {
          setCurrentUser(user);
          setUserRole(user.role);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('认证初始化失败:', error);
      } finally {
        setIsAuthReady(true);
      }
    };
    
    initAuth();
  }, []);
  
  // 基于用户角色处理权限路由
  useEffect(() => {
    if (!isAuthReady) return;
    
    // 检查用户是否有访问当前路径的权限
    const checkPathAccess = () => {
      // 公开路径，无需认证
      const publicPaths = ['/', '/login', '/register', '/forgot-password'];
      if (publicPaths.some(path => pathname === path)) return true;
      
      // 用户未登录，且访问的不是公开路径
      if (!isAuthenticated) {
        router.push('/login');
        return false;
      }
      
      // 根据角色检查路径权限
      if (userRole === UserRole.ADMIN) {
        if (pathname.startsWith('/user/') || pathname.startsWith('/staff/')) {
          router.push('/admin');
          return false;
        }
      } else if (userRole === UserRole.STAFF) {
        if (pathname.startsWith('/user/') || pathname.startsWith('/admin/')) {
          router.push('/staff');
          return false;
        }
      } else if (userRole === UserRole.CUSTOMER) {
        if (pathname.startsWith('/staff/') || pathname.startsWith('/admin/')) {
          router.push('/user');
          return false;
        }
      }
      
      return true;
    };
    
    checkPathAccess();
  }, [isAuthReady, isAuthenticated, userRole, pathname, router]);

  // 使用useCallback包装异步函数以避免重新创建
  const loadInitialData = useCallback(async () => {
    if (isInitialized.current) return;
    
    setIsLoading(true);
    try {
      const [moviesData, theatersData, showtimesData, todayShowtimesData] = await Promise.all([
        MovieService.getAllMovies(),
        TheaterService.getAllTheaters(),
        ShowtimeService.getAllShowtimes(),
        ShowtimeService.getTodayShowtimes()
      ]);
      
      setMovies(moviesData);
      setTheaters(theatersData);
      setShowtimes(showtimesData);
      setTodayShowtimes(todayShowtimesData);
      
      isInitialized.current = true;
    } catch (error) {
      console.error('加载初始数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 只在组件挂载和用户认证状态改变时加载数据
  useEffect(() => {
    if (isAuthReady) {
      loadInitialData();
    }
  }, [isAuthReady, loadInitialData]);
  
  // 当用户改变时更新相关状态
  useEffect(() => {
    if (!currentUser) {
      setUserRole(null);
      setIsAuthenticated(false);
      setOrders([]);
      return;
    }
    
    setUserRole(currentUser.role);
    setIsAuthenticated(true);
    
    // 根据用户角色加载订单数据
    const loadUserOrders = async () => {
      try {
        let userOrders;
        if (currentUser.role === UserRole.CUSTOMER) {
          // 普通用户只能看到自己的订单
          userOrders = await OrderService.getOrdersByUserId(currentUser.id);
        } else {
          // 工作人员和管理员可以看到所有订单
          userOrders = await OrderService.getAllOrders();
        }
        setOrders(userOrders);
      } catch (error) {
        console.error('加载订单数据失败:', error);
      }
    };
    
    loadUserOrders();
  }, [currentUser]);

  // 认证方法
  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const user = await AuthService.login({ email, password });
      if (user) {
        setCurrentUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('登录失败:', error);
      return null;
    }
  };
  
  const register = async (name: string, email: string, password: string, role?: UserRole): Promise<User | null> => {
    try {
      const user = await AuthService.register({ name, email, password, role });
      if (user) {
        setCurrentUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('注册失败:', error);
      return null;
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await AuthService.logout();
      setCurrentUser(null);
      router.push('/');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  // 选择电影
  const selectMovie = useCallback((movie: Movie | null) => {
    setSelectedMovie(movie);
    // 清除已选择的场次和座位
    setSelectedShowtime(null);
    setSelectedSeats([]);
  }, []);

  // 选择场次
  const selectShowtime = useCallback((showtime: Showtime | null) => {
    setSelectedShowtime(showtime);
    // 清除已选择的座位
    setSelectedSeats([]);
  }, []);

  // 选择座位
  const selectSeat = useCallback((seatId: string) => {
    setSelectedSeats(prev => [...prev, seatId]);
  }, []);

  // 取消选择座位
  const unselectSeat = useCallback((seatId: string) => {
    setSelectedSeats(prev => prev.filter(id => id !== seatId));
  }, []);

  // 清除已选择的座位
  const clearSelectedSeats = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  // 刷新数据
  const refreshData = useCallback(async () => {
    isInitialized.current = false;
    await loadInitialData();
  }, [loadInitialData]);

  // 搜索电影
  const searchMovies = useCallback(async (query: string): Promise<Movie[]> => {
    return await MovieService.getMoviesByFilter({ search: query });
  }, []);

  // 获取电影的场次
  const getShowtimesForMovie = useCallback(async (movieId: string): Promise<Showtime[]> => {
    return await ShowtimeService.getShowtimesByMovieId(movieId);
  }, []);

  // 创建订单
  const createOrder = useCallback(async (ticketType: TicketType): Promise<Order | null> => {
    if (!currentUser || !selectedShowtime || selectedSeats.length === 0) {
      return null;
    }

    try {
      const newOrder = await OrderService.createOrder({
        userId: currentUser.id,
        showtimeId: selectedShowtime.id,
        seats: selectedSeats,
        ticketType: ticketType,
        totalPrice: selectedSeats.length * selectedShowtime.price[ticketType],
        status: 'pending' as any,
      });
      
      // 添加到订单列表
      setOrders(prev => [...prev, newOrder]);
      
      // 清除选择状态
      clearSelectedSeats();
      
      return newOrder;
    } catch (error) {
      console.error('创建订单失败:', error);
      return null;
    }
  }, [currentUser, selectedShowtime, selectedSeats, clearSelectedSeats]);

  // 构建上下文值
  const contextValue: AppContextState = {
    // 数据状态
    movies,
    theaters,
    showtimes,
    todayShowtimes,
    orders,
    
    // 用户状态和认证
    currentUser,
    userRole,
    isAuthenticated,
    isLoading,
    isAuthReady,
    login,
    register,
    logout,
    
    // 选中状态
    selectedMovie,
    selectedShowtime,
    selectedSeats,
    
    // 操作方法
    selectMovie,
    selectShowtime,
    selectSeat,
    unselectSeat,
    clearSelectedSeats,
    refreshData,
    
    // 业务流程方法
    searchMovies,
    getShowtimesForMovie,
    createOrder,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// 自定义Hook，方便在组件中使用上下文
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}; 