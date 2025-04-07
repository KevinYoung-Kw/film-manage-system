'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Movie, Theater, Showtime, Order, User, UserRole, TicketType } from '../types';
import { MovieService, TheaterService, ShowtimeService, OrderService, UserService } from '../services/dataService';

// 定义上下文状态类型
interface AppContextState {
  // 数据状态
  movies: Movie[];
  theaters: Theater[];
  showtimes: Showtime[];
  todayShowtimes: Showtime[];
  orders: Order[];
  
  // 当前用户状态
  currentUser: User | null;
  userRole: UserRole | null;
  
  // 当前选中的项目
  selectedMovie: Movie | null;
  selectedShowtime: Showtime | null;
  selectedSeats: string[];
  
  // 加载状态
  isLoading: boolean;
  
  // 操作方法
  setCurrentUser: (user: User | null) => void;
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
  // 数据状态
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [todayShowtimes, setTodayShowtimes] = useState<Showtime[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // 用户状态
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // 当前选中状态
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 使用ref跟踪是否已经加载初始数据
  const isInitialized = useRef(false);

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
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 只在组件挂载时加载数据
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  // 当用户改变时更新相关状态
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  
  useEffect(() => {
    if (!currentUser) {
      setUserRole(null);
      setOrders([]);
      return;
    }
    
    setUserRole(currentUser.role);
    
    // 避免无限循环
    if (currentUserRef.current?.id !== currentUser.id) {
      // 如果是客户，加载该客户的订单
      if (currentUser.role === UserRole.CUSTOMER) {
        OrderService.getOrdersByUserId(currentUser.id)
          .then(userOrders => {
            setOrders(userOrders);
          })
          .catch(error => {
            console.error('Failed to load user orders:', error);
          });
      } else if (currentUser.role === UserRole.STAFF || currentUser.role === UserRole.ADMIN) {
        // 如果是员工或管理员，加载所有订单
        OrderService.getAllOrders()
          .then(allOrders => {
            setOrders(allOrders);
          })
          .catch(error => {
            console.error('Failed to load all orders:', error);
          });
      }
    }
  }, [currentUser]);

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
      console.error('Failed to create order:', error);
      return null;
    }
  }, [currentUser, selectedShowtime, selectedSeats, clearSelectedSeats]);

  // 构建上下文值
  const contextValue = {
    // 数据状态
    movies,
    theaters,
    showtimes,
    todayShowtimes,
    orders,
    
    // 用户状态
    currentUser,
    userRole,
    
    // 选中状态
    selectedMovie,
    selectedShowtime,
    selectedSeats,
    
    // 加载状态
    isLoading,
    
    // 操作方法
    setCurrentUser,
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