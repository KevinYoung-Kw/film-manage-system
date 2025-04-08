'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Movie, Theater, Showtime, Order, User, UserRole, TicketType, OrderStatus, StaffOperation, StaffOperationType } from '../types';
import { MovieService, TheaterService, ShowtimeService, OrderService, UserService, StaffOperationService } from '../services/dataService';
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
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<Order | null>;
  
  // 管理员方法
  addMovie: (movie: Omit<Movie, 'id'>) => Promise<Movie | null>;
  updateMovie: (id: string, movie: Partial<Movie>) => Promise<Movie | null>;
  deleteMovie: (id: string) => Promise<boolean>;
  addShowtime: (showtime: Omit<Showtime, 'id'>) => Promise<Showtime | null>;
  updateShowtime: (id: string, showtime: Partial<Showtime>) => Promise<Showtime | null>;
  deleteShowtime: (id: string) => Promise<boolean>;
  
  // 工作人员方法
  staffOperations: StaffOperation[];
  getStaffOperations: (staffId?: string) => Promise<StaffOperation[]>;
  sellTicket: (showtimeId: string, seats: string[], ticketType: TicketType, paymentMethod: string) => Promise<Order | null>;
  checkTicket: (orderId: string) => Promise<{ success: boolean; message: string }>;
  refundTicket: (orderId: string, reason: string) => Promise<{ success: boolean; message: string }>;
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

  // 添加工作人员操作数据
  const [staffOperations, setStaffOperations] = useState<StaffOperation[]>([]);

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
      
      // 如果用户已登录，刷新订单数据
      if (currentUser) {
        let userOrders;
        if (currentUser.role === UserRole.CUSTOMER) {
          userOrders = await OrderService.getOrdersByUserId(currentUser.id);
        } else {
          userOrders = await OrderService.getAllOrders();
        }
        setOrders(userOrders);
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

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
    console.log("createOrder 被调用:", {
      currentUser: !!currentUser,
      selectedShowtime: selectedShowtime ? selectedShowtime.id : null,
      selectedSeats,
    });
    
    if (!currentUser) {
      console.error("创建订单失败: 用户未登录");
      return null;
    }
    
    if (!selectedShowtime) {
      console.error("创建订单失败: 没有选择场次");
      return null;
    }
    
    if (selectedSeats.length === 0) {
      console.error("创建订单失败: 没有选择座位");
      return null;
    }

    try {
      // 检查 selectedShowtime 是否有正确的价格信息
      if (!selectedShowtime.price || !selectedShowtime.price[ticketType]) {
        console.error("创建订单失败: 场次没有价格信息", selectedShowtime);
        return null;
      }

      const orderData = {
        userId: currentUser.id,
        showtimeId: selectedShowtime.id,
        seats: selectedSeats,
        ticketType: ticketType,
        totalPrice: selectedSeats.length * selectedShowtime.price[ticketType],
        status: 'pending' as any,
      };
      
      console.log("尝试创建订单:", orderData);
      
      const newOrder = await OrderService.createOrder(orderData);
      console.log("订单创建结果:", newOrder);
      
      // 添加到订单列表
      setOrders(prev => [...prev, newOrder]);
      
      // 更新场次数据
      const updatedShowtimes = showtimes.map(showtime => {
        if (showtime.id === selectedShowtime.id) {
          // 更新相关场次中的座位可用性
          const updatedSeats = showtime.availableSeats.map(seat => {
            if (selectedSeats.includes(seat.id)) {
              return { ...seat, available: false };
            }
            return seat;
          });
          
          return { ...showtime, availableSeats: updatedSeats };
        }
        return showtime;
      });
      
      // 更新场次状态
      setShowtimes(updatedShowtimes);
      
      // 如果是今日场次，也需要更新今日场次数据
      if (todayShowtimes.some(s => s.id === selectedShowtime.id)) {
        setTodayShowtimes(prev => 
          prev.map(showtime => 
            showtime.id === selectedShowtime.id
              ? updatedShowtimes.find(s => s.id === selectedShowtime.id)!
              : showtime
          )
        );
      }
      
      // 清除选择状态
      clearSelectedSeats();
      setSelectedShowtime(null);
      
      return newOrder;
    } catch (error) {
      console.error('创建订单失败:', error);
      return null;
    }
  }, [currentUser, selectedShowtime, selectedSeats, showtimes, todayShowtimes, clearSelectedSeats]);

  // 更新订单状态
  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus): Promise<Order | null> => {
    try {
      const updatedOrder = await OrderService.updateOrderStatus(orderId, status);
      if (updatedOrder) {
        setOrders(prev => prev.map(order => order.id === orderId ? updatedOrder : order));
        return updatedOrder;
      }
      return null;
    } catch (error) {
      console.error('更新订单状态失败:', error);
      return null;
    }
  }, []);

  // 取消订单
  const cancelOrder = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const canceledOrder = await OrderService.cancelOrder(orderId);
      if (canceledOrder) {
        setOrders(prev => prev.map(order => order.id === orderId ? canceledOrder : order));
        
        // 更新场次中的座位状态
        if (canceledOrder.showtimeId) {
          const showtime = showtimes.find(s => s.id === canceledOrder.showtimeId);
          if (showtime) {
            const updatedShowtimes = showtimes.map(s => {
              if (s.id === canceledOrder.showtimeId) {
                // 更新座位状态
                const updatedSeats = s.availableSeats.map(seat => {
                  if (canceledOrder.seats.includes(seat.id)) {
                    return { ...seat, available: true };
                  }
                  return seat;
                });
                return { ...s, availableSeats: updatedSeats };
              }
              return s;
            });
            
            // 更新场次状态
            setShowtimes(updatedShowtimes);
            
            // 如果是今日场次，也需要更新
            if (todayShowtimes.some(s => s.id === canceledOrder.showtimeId)) {
              setTodayShowtimes(prev => 
                prev.map(s => s.id === canceledOrder.showtimeId 
                  ? updatedShowtimes.find(updated => updated.id === s.id)!
                  : s
                )
              );
            }
          }
        }
        
        return canceledOrder;
      }
      return null;
    } catch (error) {
      console.error('取消订单失败:', error);
      return null;
    }
  }, [showtimes, todayShowtimes]);

  // 添加新电影
  const addMovie = useCallback(async (movie: Omit<Movie, 'id'>): Promise<Movie | null> => {
    if (userRole !== UserRole.ADMIN) {
      console.error('只有管理员可以添加电影');
      return null;
    }
    
    try {
      const newMovie = await MovieService.addMovie(movie);
      setMovies(prev => [...prev, newMovie]);
      return newMovie;
    } catch (error) {
      console.error('添加电影失败:', error);
      return null;
    }
  }, [userRole]);

  // 更新电影
  const updateMovie = useCallback(async (id: string, movieData: Partial<Movie>): Promise<Movie | null> => {
    if (userRole !== UserRole.ADMIN) {
      console.error('只有管理员可以更新电影');
      return null;
    }
    
    try {
      const updatedMovie = await MovieService.updateMovie(id, movieData);
      if (updatedMovie) {
        setMovies(prev => prev.map(movie => movie.id === id ? updatedMovie : movie));
        return updatedMovie;
      }
      return null;
    } catch (error) {
      console.error('更新电影失败:', error);
      return null;
    }
  }, [userRole]);

  // 删除电影
  const deleteMovie = useCallback(async (id: string): Promise<boolean> => {
    if (userRole !== UserRole.ADMIN) {
      console.error('只有管理员可以删除电影');
      return false;
    }
    
    try {
      const success = await MovieService.deleteMovie(id);
      if (success) {
        setMovies(prev => prev.filter(movie => movie.id !== id));
      }
      return success;
    } catch (error) {
      console.error('删除电影失败:', error);
      return false;
    }
  }, [userRole]);

  // 添加场次
  const addShowtime = useCallback(async (showtime: Omit<Showtime, 'id'>): Promise<Showtime | null> => {
    if (userRole !== UserRole.ADMIN) {
      console.error('只有管理员可以添加场次');
      return null;
    }
    
    try {
      const newShowtime = await ShowtimeService.addShowtime(showtime);
      setShowtimes(prev => [...prev, newShowtime]);
      
      // 如果是今日场次，也更新今日场次
      const today = new Date();
      const showtimeDate = new Date(newShowtime.startTime);
      if (showtimeDate.getDate() === today.getDate() &&
          showtimeDate.getMonth() === today.getMonth() &&
          showtimeDate.getFullYear() === today.getFullYear()) {
        setTodayShowtimes(prev => [...prev, newShowtime]);
      }
      
      return newShowtime;
    } catch (error) {
      console.error('添加场次失败:', error);
      return null;
    }
  }, [userRole]);

  // 更新场次
  const updateShowtime = useCallback(async (id: string, showtimeData: Partial<Showtime>): Promise<Showtime | null> => {
    if (userRole !== UserRole.ADMIN) {
      console.error('只有管理员可以更新场次');
      return null;
    }
    
    try {
      const updatedShowtime = await ShowtimeService.updateShowtime(id, showtimeData);
      if (updatedShowtime) {
        // 更新场次列表
        setShowtimes(prev => prev.map(showtime => showtime.id === id ? updatedShowtime : showtime));
        
        // 如果是今日场次，也更新今日场次列表
        if (todayShowtimes.some(s => s.id === id)) {
          setTodayShowtimes(prev => 
            prev.map(showtime => showtime.id === id ? updatedShowtime : showtime)
          );
        }
        
        return updatedShowtime;
      }
      return null;
    } catch (error) {
      console.error('更新场次失败:', error);
      return null;
    }
  }, [userRole, todayShowtimes]);

  // 删除场次
  const deleteShowtime = useCallback(async (id: string): Promise<boolean> => {
    if (userRole !== UserRole.ADMIN) {
      console.error('只有管理员可以删除场次');
      return false;
    }
    
    try {
      const success = await ShowtimeService.deleteShowtime(id);
      if (success) {
        // 从场次列表中删除
        setShowtimes(prev => prev.filter(showtime => showtime.id !== id));
        
        // 如果是今日场次，也从今日场次列表中删除
        setTodayShowtimes(prev => prev.filter(showtime => showtime.id !== id));
      }
      return success;
    } catch (error) {
      console.error('删除场次失败:', error);
      return false;
    }
  }, [userRole]);

  // 获取工作人员操作记录
  const getStaffOperations = useCallback(async (staffId?: string): Promise<StaffOperation[]> => {
    try {
      let operations;
      if (staffId) {
        operations = await StaffOperationService.getOperationsByStaffId(staffId);
      } else {
        operations = await StaffOperationService.getAllOperations();
      }
      setStaffOperations(operations);
      return operations;
    } catch (error) {
      console.error('获取工作人员操作记录失败:', error);
      return [];
    }
  }, []);

  // 售票操作
  const sellTicket = useCallback(async (
    showtimeId: string, 
    seats: string[], 
    ticketType: TicketType, 
    paymentMethod: string
  ): Promise<Order | null> => {
    if (!currentUser || userRole !== UserRole.STAFF) {
      console.error('只有工作人员可以进行售票操作');
      return null;
    }
    
    try {
      const newOrder = await StaffOperationService.sellTicket(
        currentUser.id,
        showtimeId,
        seats,
        ticketType,
        paymentMethod
      );
      
      if (newOrder) {
        // 更新订单列表
        setOrders(prev => [...prev, newOrder]);
        
        // 更新场次中的座位状态
        setShowtimes(prev => 
          prev.map(showtime => 
            showtime.id === showtimeId
              ? { ...showtime, availableSeats: showtime.availableSeats.map(seat => {
                  if (seats.includes(seat.id)) {
                    return { ...seat, available: false };
                  }
                  return seat;
                }) }
              : showtime
          )
        );
        
        return newOrder;
      }
      return null;
    } catch (error) {
      console.error('售票操作失败:', error);
      return null;
    }
  }, [currentUser, userRole, showtimes]);

  // 检查票
  const checkTicket = useCallback(async (orderId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || userRole !== UserRole.STAFF) {
      console.error('只有工作人员可以检查票');
      return { success: false, message: '只有工作人员可以检查票' };
    }
    
    try {
      const result = await StaffOperationService.checkTicket(currentUser.id, orderId);
      return result;
    } catch (error) {
      console.error('检查票失败:', error);
      return { success: false, message: '检查票失败' };
    }
  }, [currentUser, userRole]);

  // 退票操作
  const refundTicket = useCallback(async (orderId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || userRole !== UserRole.STAFF) {
      console.error('只有工作人员可以退票');
      return { success: false, message: '只有工作人员可以退票' };
    }
    
    try {
      const result = await StaffOperationService.refundTicket(currentUser.id, orderId, reason);
      return result;
    } catch (error) {
      console.error('退票失败:', error);
      return { success: false, message: '退票失败' };
    }
  }, [currentUser, userRole]);

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
    updateOrderStatus,
    cancelOrder,
    
    // 管理员方法
    addMovie,
    updateMovie,
    deleteMovie,
    addShowtime,
    updateShowtime,
    deleteShowtime,
    
    // 工作人员方法
    staffOperations,
    getStaffOperations,
    sellTicket,
    checkTicket,
    refundTicket,
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